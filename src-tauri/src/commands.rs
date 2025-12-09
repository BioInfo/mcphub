use crate::config::{ConfigManager, ConfigType, HealthStatus, MCPConfig, MCPServer, ManagedServer, AppState};
use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;
use tokio::process::Command;

type ConfigManagerState = Mutex<ConfigManager>;

/// Resolve a command name to its full path by checking common locations
fn resolve_command(cmd: &str) -> Option<String> {
    // If it's already an absolute path, check if it exists
    if cmd.starts_with('/') {
        if Path::new(cmd).exists() {
            return Some(cmd.to_string());
        }
        return None;
    }

    // Common paths to search (in order of priority)
    let search_paths = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        "/opt/homebrew/sbin",
        "/usr/local/sbin",
        "/usr/sbin",
        "/sbin",
        // Add home directory paths for tools like nvm, pyenv, etc.
        &format!("{}/.nvm/versions/node/v22.9.0/bin", std::env::var("HOME").unwrap_or_default()),
        &format!("{}/.cargo/bin", std::env::var("HOME").unwrap_or_default()),
        &format!("{}/.local/bin", std::env::var("HOME").unwrap_or_default()),
        &format!("{}/Library/pnpm", std::env::var("HOME").unwrap_or_default()),
    ];

    for path in &search_paths {
        let full_path = format!("{}/{}", path, cmd);
        if Path::new(&full_path).exists() {
            return Some(full_path);
        }
    }

    None
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestResult {
    pub success: bool,
    pub message: String,
    pub output: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveServerRequest {
    pub name: String,
    pub server: MCPServer,
    pub targets: Vec<ConfigType>,
    pub original_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetEnabledRequest {
    pub name: String,
    pub config_type: ConfigType,
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRequest {
    pub name: String,
    pub source: ConfigType,
    pub targets: Vec<ConfigType>,
}

#[tauri::command]
pub fn get_all_configs(state: State<'_, ConfigManagerState>) -> Result<Vec<MCPConfig>> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;

    ConfigType::all()
        .into_iter()
        .map(|ct| manager.read_config(ct))
        .collect()
}

#[tauri::command]
pub fn get_managed_servers(state: State<'_, ConfigManagerState>) -> Result<Vec<ManagedServer>> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    manager.get_managed_servers()
}

#[tauri::command]
pub fn save_server(state: State<'_, ConfigManagerState>, request: SaveServerRequest) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;

    // If renaming, remove old server first
    if let Some(ref old_name) = request.original_name {
        if old_name != &request.name {
            manager.remove_server(old_name, &ConfigType::all())?;
        }
    }

    manager.add_server(&request.name, &request.server, &request.targets)
}

#[tauri::command]
pub fn delete_server(state: State<'_, ConfigManagerState>, name: String) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    manager.remove_server(&name, &ConfigType::all())
}

#[tauri::command]
pub fn set_server_enabled(state: State<'_, ConfigManagerState>, request: SetEnabledRequest) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;

    // Get the server template from another config if enabling
    let template = if request.enabled {
        let servers = manager.get_managed_servers()?;
        servers.iter().find(|s| s.name == request.name).map(|s| MCPServer {
            command: s.command.clone(),
            args: s.args.clone(),
            env: s.env.clone(),
            always_allow: s.always_allow.clone(),
        })
    } else {
        None
    };

    manager.set_server_enabled(&request.name, request.config_type, request.enabled, template.as_ref())
}

#[tauri::command]
pub async fn test_server_connection(
    state: State<'_, ConfigManagerState>,
    name: String,
    server: MCPServer,
) -> Result<TestResult> {
    let expanded_command = ConfigManager::expand_path(&server.command);
    let expanded_args: Vec<String> = server.args.iter().map(|a| ConfigManager::expand_path(a)).collect();

    // Resolve the command to a full path
    let resolved_command = resolve_command(&expanded_command);

    if resolved_command.is_none() {
        let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
        manager.update_server_health(&name, HealthStatus::Error, Some(format!("Command not found: {}", expanded_command)))?;

        return Ok(TestResult {
            success: false,
            message: format!("Command not found: {}. Make sure it's installed and in your PATH.", expanded_command),
            output: None,
        });
    }

    let command_path = resolved_command.unwrap();

    // Check if args contain paths that don't exist
    for arg in &expanded_args {
        if arg.starts_with('/') && !arg.contains("://") {
            if !std::path::Path::new(arg).exists() {
                let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
                manager.update_server_health(&name, HealthStatus::Error, Some(format!("Path not found: {}", arg)))?;

                return Ok(TestResult {
                    success: false,
                    message: format!("Path not found: {}", arg),
                    output: None,
                });
            }
        }
    }

    // Try to start the server briefly
    let mut cmd = Command::new(&command_path);
    cmd.args(&expanded_args);

    // Set up a proper PATH so the spawned process can find its dependencies
    let home = std::env::var("HOME").unwrap_or_default();
    let path = format!(
        "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:{}/.cargo/bin:{}/.local/bin:{}/Library/pnpm:{}/.nvm/versions/node/v22.9.0/bin",
        home, home, home, home
    );
    cmd.env("PATH", &path);
    cmd.env("HOME", &home);

    // Set environment variables from server config
    for (key, value) in &server.env {
        cmd.env(key, ConfigManager::expand_path(value));
    }

    // Capture output
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let spawn_result = cmd.spawn();

    match spawn_result {
        Ok(mut child) => {
            // Give it a moment to start
            tokio::time::sleep(Duration::from_millis(500)).await;

            // Check if it's still running (good sign) or exited with error
            match child.try_wait() {
                Ok(Some(status)) => {
                    if status.success() {
                        let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
                        manager.update_server_health(&name, HealthStatus::Healthy, None)?;

                        Ok(TestResult {
                            success: true,
                            message: "Server started and exited successfully".to_string(),
                            output: None,
                        })
                    } else {
                        let output = child.wait_with_output().await.ok();
                        let stderr = output.map(|o| String::from_utf8_lossy(&o.stderr).to_string());

                        let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
                        manager.update_server_health(&name, HealthStatus::Error, stderr.clone())?;

                        Ok(TestResult {
                            success: false,
                            message: format!("Server exited with code: {:?}", status.code()),
                            output: stderr,
                        })
                    }
                }
                Ok(None) => {
                    // Still running - this is good, kill it
                    child.kill().await.ok();

                    let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
                    manager.update_server_health(&name, HealthStatus::Healthy, None)?;

                    Ok(TestResult {
                        success: true,
                        message: "Server started successfully".to_string(),
                        output: None,
                    })
                }
                Err(e) => {
                    let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
                    manager.update_server_health(&name, HealthStatus::Error, Some(e.to_string()))?;

                    Ok(TestResult {
                        success: false,
                        message: format!("Error checking server status: {}", e),
                        output: None,
                    })
                }
            }
        }
        Err(e) => {
            let mut manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
            manager.update_server_health(&name, HealthStatus::Error, Some(e.to_string()))?;

            Ok(TestResult {
                success: false,
                message: format!("Failed to start server: {}", e),
                output: None,
            })
        }
    }
}

#[tauri::command]
pub fn sync_server(state: State<'_, ConfigManagerState>, request: SyncRequest) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    manager.sync_server(&request.name, request.source, &request.targets)
}

#[tauri::command]
pub fn sync_all_servers(state: State<'_, ConfigManagerState>, source: ConfigType) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    manager.sync_all(source)
}

#[tauri::command]
pub fn backup_configs(state: State<'_, ConfigManagerState>) -> Result<Vec<String>> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;

    let mut backups = Vec::new();
    for config_type in ConfigType::all() {
        if let Ok(path) = manager.backup_config(config_type) {
            backups.push(path);
        }
    }

    Ok(backups)
}

#[tauri::command]
pub fn get_app_state(state: State<'_, ConfigManagerState>) -> Result<AppState> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    Ok(manager.get_state().clone())
}

#[tauri::command]
pub fn import_config(state: State<'_, ConfigManagerState>, json: String) -> Result<()> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;

    let servers: HashMap<String, MCPServer> = serde_json::from_str(&json)?;

    // Import to all configs
    for config_type in ConfigType::all() {
        let mut config = manager.read_config(config_type)?;
        for (name, server) in &servers {
            config.servers.insert(name.clone(), server.clone());
        }
        manager.write_config(config_type, &config.servers)?;
    }

    Ok(())
}

#[tauri::command]
pub fn export_config(state: State<'_, ConfigManagerState>, source: ConfigType) -> Result<String> {
    let manager = state.lock().map_err(|e| AppError::IoError(e.to_string()))?;
    let config = manager.read_config(source)?;
    let json = serde_json::to_string_pretty(&config.servers)?;
    Ok(json)
}
