import { invoke } from '@tauri-apps/api/core';
import type {
  MCPConfig,
  ManagedServer,
  MCPServer,
  TestResult,
  SaveServerRequest,
  SetEnabledRequest,
  SyncRequest,
  ConfigType,
  AppState,
} from '../types/mcp';

export async function getAllConfigs(): Promise<MCPConfig[]> {
  return invoke<MCPConfig[]>('get_all_configs');
}

export async function getManagedServers(): Promise<ManagedServer[]> {
  return invoke<ManagedServer[]>('get_managed_servers');
}

export async function saveServer(request: SaveServerRequest): Promise<void> {
  return invoke('save_server', { request });
}

export async function deleteServer(name: string): Promise<void> {
  return invoke('delete_server', { name });
}

export async function setServerEnabled(request: SetEnabledRequest): Promise<void> {
  return invoke('set_server_enabled', { request });
}

export async function testServerConnection(name: string, server: MCPServer): Promise<TestResult> {
  return invoke<TestResult>('test_server_connection', { name, server });
}

export async function syncServer(request: SyncRequest): Promise<void> {
  return invoke('sync_server', { request });
}

export async function syncAllServers(source: ConfigType): Promise<void> {
  return invoke('sync_all_servers', { source });
}

export async function backupConfigs(): Promise<string[]> {
  return invoke<string[]>('backup_configs');
}

export async function getAppState(): Promise<AppState> {
  return invoke<AppState>('get_app_state');
}

export async function importConfig(json: string): Promise<void> {
  return invoke('import_config', { json });
}

export async function exportConfig(source: ConfigType): Promise<string> {
  return invoke<string>('export_config', { source });
}
