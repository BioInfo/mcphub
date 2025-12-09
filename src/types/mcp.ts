export type ConfigType = 'claudeCode' | 'claudeDesktop' | 'rooCode';

export type HealthStatus = 'healthy' | 'untested' | 'error' | 'disabled';

export interface MCPServer {
  command: string;
  args: string[];
  env: Record<string, string>;
  alwaysAllow: string[];
}

export interface SystemStatus {
  enabled: boolean;
  present: boolean;
}

export interface ManagedServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  alwaysAllow: string[];
  systems: Record<string, SystemStatus>;
  health: HealthStatus;
  lastTested?: string;
  errorMessage?: string;
}

export interface MCPConfig {
  configType: ConfigType;
  path: string;
  exists: boolean;
  isValid: boolean;
  servers: Record<string, MCPServer>;
  lastModified?: string;
  error?: string;
}

export interface AppState {
  servers: Record<string, ServerState>;
  lastSync?: string;
  version: string;
}

export interface ServerState {
  health: HealthStatus;
  lastTested?: string;
  errorMessage?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  output?: string;
}

export interface SaveServerRequest {
  name: string;
  server: MCPServer;
  targets: ConfigType[];
  originalName?: string;
}

export interface SetEnabledRequest {
  name: string;
  configType: ConfigType;
  enabled: boolean;
}

export interface SyncRequest {
  name: string;
  source: ConfigType;
  targets: ConfigType[];
}

export const CONFIG_TYPE_INFO: Record<ConfigType, { displayName: string; shortName: string; color: string }> = {
  claudeCode: { displayName: 'Claude Code', shortName: 'CC', color: 'brand' },
  claudeDesktop: { displayName: 'Claude Desktop', shortName: 'CD', color: 'purple' },
  rooCode: { displayName: 'Roo Code', shortName: 'RC', color: 'emerald' },
};

export const ALL_CONFIG_TYPES: ConfigType[] = ['claudeCode', 'claudeDesktop', 'rooCode'];
