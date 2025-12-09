use crate::error::{AppError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConfigType {
    ClaudeCode,
    ClaudeDesktop,
    RooCode,
}

impl ConfigType {
    pub fn all() -> Vec<ConfigType> {
        vec![
            ConfigType::ClaudeCode,
            ConfigType::ClaudeDesktop,
            ConfigType::RooCode,
        ]
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ConfigType::ClaudeCode => "Claude Code",
            ConfigType::ClaudeDesktop => "Claude Desktop",
            ConfigType::RooCode => "Roo Code",
        }
    }

    pub fn short_name(&self) -> &'static str {
        match self {
            ConfigType::ClaudeCode => "CC",
            ConfigType::ClaudeDesktop => "CD",
            ConfigType::RooCode => "RC",
        }
    }

    pub fn config_path(&self) -> Result<PathBuf> {
        let home = dirs::home_dir().ok_or_else(|| AppError::PathError("Could not find home directory".to_string()))?;

        let path = match self {
            ConfigType::ClaudeCode => home.join(".claude").join(".mcp.json"),
            ConfigType::ClaudeDesktop => home
                .join("Library")
                .join("Application Support")
                .join("Claude")
                .join("claude_desktop_config.json"),
            ConfigType::RooCode => home
                .join("Library")
                .join("Application Support")
                .join("Code")
                .join("User")
                .join("globalStorage")
                .join("rooveterinaryinc.roo-cline")
                .join("settings")
                .join("mcp_settings.json"),
        };

        Ok(path)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPServer {
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub env: HashMap<String, String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub always_allow: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStatus {
    pub enabled: bool,
    pub present: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HealthStatus {
    Healthy,
    Untested,
    Error,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedServer {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub always_allow: Vec<String>,
    pub systems: HashMap<String, SystemStatus>,
    pub health: HealthStatus,
    pub last_tested: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPConfig {
    pub config_type: ConfigType,
    pub path: String,
    pub exists: bool,
    pub is_valid: bool,
    pub servers: HashMap<String, MCPServer>,
    pub last_modified: Option<DateTime<Utc>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub servers: HashMap<String, ServerState>,
    pub last_sync: Option<DateTime<Utc>>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerState {
    pub health: HealthStatus,
    pub last_tested: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

pub struct ConfigManager {
    state: AppState,
    state_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let state_path = dirs::home_dir()
            .unwrap_or_default()
            .join(".mcphub")
            .join("state.json");

        // Create directory if it doesn't exist
        if let Some(parent) = state_path.parent() {
            fs::create_dir_all(parent).ok();
        }

        // Load existing state or create default
        let state = if state_path.exists() {
            fs::read_to_string(&state_path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            AppState::default()
        };

        ConfigManager { state, state_path }
    }

    pub fn save_state(&self) -> Result<()> {
        let json = serde_json::to_string_pretty(&self.state)?;
        fs::write(&self.state_path, json)?;
        Ok(())
    }

    pub fn get_state(&self) -> &AppState {
        &self.state
    }

    pub fn update_server_health(
        &mut self,
        name: &str,
        health: HealthStatus,
        error: Option<String>,
    ) -> Result<()> {
        let server_state = self.state.servers.entry(name.to_string()).or_insert(ServerState {
            health: HealthStatus::Untested,
            last_tested: None,
            error_message: None,
        });

        server_state.health = health;
        server_state.last_tested = Some(Utc::now());
        server_state.error_message = error;

        self.save_state()
    }

    pub fn read_config(&self, config_type: ConfigType) -> Result<MCPConfig> {
        let path = config_type.config_path()?;
        let path_str = path.to_string_lossy().to_string();

        if !path.exists() {
            return Ok(MCPConfig {
                config_type,
                path: path_str,
                exists: false,
                is_valid: false,
                servers: HashMap::new(),
                last_modified: None,
                error: Some("Config file does not exist".to_string()),
            });
        }

        let content = fs::read_to_string(&path)?;
        let last_modified = fs::metadata(&path)
            .ok()
            .and_then(|m| m.modified().ok())
            .map(|t| DateTime::<Utc>::from(t));

        // Parse the config - different formats for different tools
        let servers = match config_type {
            ConfigType::ClaudeCode | ConfigType::RooCode => {
                // Format: { "mcpServers": { ... } }
                let parsed: serde_json::Value = serde_json::from_str(&content)?;
                if let Some(mcp_servers) = parsed.get("mcpServers") {
                    serde_json::from_value(mcp_servers.clone()).unwrap_or_default()
                } else {
                    HashMap::new()
                }
            }
            ConfigType::ClaudeDesktop => {
                // Format: { "mcpServers": { ... } }
                let parsed: serde_json::Value = serde_json::from_str(&content)?;
                if let Some(mcp_servers) = parsed.get("mcpServers") {
                    serde_json::from_value(mcp_servers.clone()).unwrap_or_default()
                } else {
                    HashMap::new()
                }
            }
        };

        Ok(MCPConfig {
            config_type,
            path: path_str,
            exists: true,
            is_valid: true,
            servers,
            last_modified,
            error: None,
        })
    }

    pub fn write_config(&self, config_type: ConfigType, servers: &HashMap<String, MCPServer>) -> Result<()> {
        let path = config_type.config_path()?;

        // Create directory if it doesn't exist
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Read existing config to preserve other fields
        let mut config_value: serde_json::Value = if path.exists() {
            let content = fs::read_to_string(&path)?;
            serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        // Update mcpServers field
        config_value["mcpServers"] = serde_json::to_value(servers)?;

        // Write back
        let json = serde_json::to_string_pretty(&config_value)?;
        fs::write(&path, json)?;

        Ok(())
    }

    pub fn backup_config(&self, config_type: ConfigType) -> Result<String> {
        let path = config_type.config_path()?;

        if !path.exists() {
            return Err(AppError::ConfigNotFound(path.to_string_lossy().to_string()));
        }

        let backup_dir = dirs::home_dir()
            .ok_or_else(|| AppError::PathError("Could not find home directory".to_string()))?
            .join(".mcphub")
            .join("backups");

        fs::create_dir_all(&backup_dir)?;

        let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("{}_{}.json", config_type.short_name().to_lowercase(), timestamp);
        let backup_path = backup_dir.join(&backup_name);

        fs::copy(&path, &backup_path)?;

        Ok(backup_path.to_string_lossy().to_string())
    }

    pub fn get_managed_servers(&self) -> Result<Vec<ManagedServer>> {
        let configs: Vec<MCPConfig> = ConfigType::all()
            .into_iter()
            .map(|ct| self.read_config(ct))
            .collect::<Result<Vec<_>>>()?;

        // Collect all unique server names
        let mut all_servers: HashMap<String, ManagedServer> = HashMap::new();

        for config in &configs {
            for (name, server) in &config.servers {
                let entry = all_servers.entry(name.clone()).or_insert_with(|| {
                    let server_state = self.state.servers.get(name);
                    ManagedServer {
                        name: name.clone(),
                        command: server.command.clone(),
                        args: server.args.clone(),
                        env: server.env.clone(),
                        always_allow: server.always_allow.clone(),
                        systems: HashMap::new(),
                        health: server_state.map(|s| s.health).unwrap_or(HealthStatus::Untested),
                        last_tested: server_state.and_then(|s| s.last_tested),
                        error_message: server_state.and_then(|s| s.error_message.clone()),
                    }
                });

                // Update system status
                let system_key = match config.config_type {
                    ConfigType::ClaudeCode => "claudeCode",
                    ConfigType::ClaudeDesktop => "claudeDesktop",
                    ConfigType::RooCode => "rooCode",
                };

                entry.systems.insert(
                    system_key.to_string(),
                    SystemStatus {
                        enabled: true,
                        present: true,
                    },
                );
            }
        }

        // Fill in missing system statuses
        for server in all_servers.values_mut() {
            for system_key in ["claudeCode", "claudeDesktop", "rooCode"] {
                server.systems.entry(system_key.to_string()).or_insert(SystemStatus {
                    enabled: false,
                    present: false,
                });
            }
        }

        let mut servers: Vec<ManagedServer> = all_servers.into_values().collect();
        servers.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

        Ok(servers)
    }

    pub fn expand_path(path: &str) -> String {
        if path.starts_with('~') {
            if let Some(home) = dirs::home_dir() {
                return path.replacen('~', &home.to_string_lossy(), 1);
            }
        }
        path.to_string()
    }

    pub fn add_server(
        &self,
        name: &str,
        server: &MCPServer,
        targets: &[ConfigType],
    ) -> Result<()> {
        for config_type in targets {
            let mut config = self.read_config(*config_type)?;

            // Expand paths in args
            let expanded_server = MCPServer {
                command: Self::expand_path(&server.command),
                args: server.args.iter().map(|a| Self::expand_path(a)).collect(),
                env: server.env.clone(),
                always_allow: server.always_allow.clone(),
            };

            config.servers.insert(name.to_string(), expanded_server);
            self.write_config(*config_type, &config.servers)?;
        }

        Ok(())
    }

    pub fn remove_server(&self, name: &str, targets: &[ConfigType]) -> Result<()> {
        for config_type in targets {
            let mut config = self.read_config(*config_type)?;
            config.servers.remove(name);
            self.write_config(*config_type, &config.servers)?;
        }

        Ok(())
    }

    pub fn set_server_enabled(
        &self,
        name: &str,
        config_type: ConfigType,
        enabled: bool,
        server_template: Option<&MCPServer>,
    ) -> Result<()> {
        let mut config = self.read_config(config_type)?;

        if enabled {
            // Add server if we have a template
            if let Some(template) = server_template {
                let expanded_server = MCPServer {
                    command: Self::expand_path(&template.command),
                    args: template.args.iter().map(|a| Self::expand_path(a)).collect(),
                    env: template.env.clone(),
                    always_allow: template.always_allow.clone(),
                };
                config.servers.insert(name.to_string(), expanded_server);
            }
        } else {
            // Remove server
            config.servers.remove(name);
        }

        self.write_config(config_type, &config.servers)?;
        Ok(())
    }

    pub fn sync_server(&self, name: &str, source: ConfigType, targets: &[ConfigType]) -> Result<()> {
        let source_config = self.read_config(source)?;

        let server = source_config
            .servers
            .get(name)
            .ok_or_else(|| AppError::ServerNotFound(name.to_string()))?;

        for target in targets {
            if *target != source {
                let mut target_config = self.read_config(*target)?;
                target_config.servers.insert(name.to_string(), server.clone());
                self.write_config(*target, &target_config.servers)?;
            }
        }

        Ok(())
    }

    pub fn sync_all(&self, source: ConfigType) -> Result<()> {
        let source_config = self.read_config(source)?;

        for target in ConfigType::all() {
            if target != source {
                self.write_config(target, &source_config.servers)?;
            }
        }

        Ok(())
    }
}
