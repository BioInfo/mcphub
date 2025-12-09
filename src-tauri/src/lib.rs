mod config;
mod commands;
mod error;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_all_configs,
            commands::get_managed_servers,
            commands::save_server,
            commands::delete_server,
            commands::set_server_enabled,
            commands::test_server_connection,
            commands::sync_server,
            commands::sync_all_servers,
            commands::backup_configs,
            commands::get_app_state,
            commands::import_config,
            commands::export_config,
        ])
        .setup(|app| {
            // Set up app state directory
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();

            // Initialize config manager
            let config_manager = config::ConfigManager::new();
            app.manage(std::sync::Mutex::new(config_manager));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
