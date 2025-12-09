import { create } from 'zustand';
import type { ManagedServer, MCPConfig, ConfigType, MCPServer } from '../types/mcp';
import * as api from '../lib/tauri';

export type ViewMode = 'list' | 'grid';
export type FilterMode = 'all' | 'synced' | 'partial' | 'claudeCode' | 'claudeDesktop' | 'rooCode';

interface AppStore {
  // Data
  servers: ManagedServer[];
  configs: MCPConfig[];
  selectedServer: string | null;
  isLoading: boolean;
  error: string | null;

  // UI State
  viewMode: ViewMode;
  filterMode: FilterMode;
  searchQuery: string;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isSyncModalOpen: boolean;
  isTestingServer: string | null;

  // Actions
  loadData: () => Promise<void>;
  selectServer: (name: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterMode: (mode: FilterMode) => void;
  setSearchQuery: (query: string) => void;
  setAddModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setSyncModalOpen: (open: boolean) => void;

  // Server operations
  saveServer: (name: string, server: MCPServer, targets: ConfigType[], originalName?: string) => Promise<void>;
  deleteServer: (name: string) => Promise<void>;
  setServerEnabled: (name: string, configType: ConfigType, enabled: boolean) => Promise<void>;
  testServer: (name: string, server: MCPServer) => Promise<{ success: boolean; message: string }>;
  syncServer: (name: string, source: ConfigType, targets: ConfigType[]) => Promise<void>;
  syncAll: (source: ConfigType) => Promise<void>;
  backupAll: () => Promise<string[]>;

  // Computed
  getFilteredServers: () => ManagedServer[];
  getSelectedServerData: () => ManagedServer | null;
  getSyncStatus: () => { synced: number; partial: number; total: number };
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  servers: [],
  configs: [],
  selectedServer: null,
  isLoading: false,
  error: null,
  viewMode: 'list',
  filterMode: 'all',
  searchQuery: '',
  isAddModalOpen: false,
  isEditModalOpen: false,
  isSyncModalOpen: false,
  isTestingServer: null,

  // Actions
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [servers, configs] = await Promise.all([
        api.getManagedServers(),
        api.getAllConfigs(),
      ]);
      set({ servers, configs, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  selectServer: (name) => set({ selectedServer: name }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilterMode: (mode) => set({ filterMode: mode }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setAddModalOpen: (open) => set({ isAddModalOpen: open }),

  setEditModalOpen: (open) => set({ isEditModalOpen: open }),

  setSyncModalOpen: (open) => set({ isSyncModalOpen: open }),

  saveServer: async (name, server, targets, originalName) => {
    try {
      await api.saveServer({ name, server, targets, originalName });
      await get().loadData();
      set({ selectedServer: name });
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  deleteServer: async (name) => {
    try {
      await api.deleteServer(name);
      set({ selectedServer: null });
      await get().loadData();
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  setServerEnabled: async (name, configType, enabled) => {
    try {
      await api.setServerEnabled({ name, configType, enabled });
      await get().loadData();
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  testServer: async (name, server) => {
    set({ isTestingServer: name });
    try {
      const result = await api.testServerConnection(name, server);
      await get().loadData();
      return result;
    } finally {
      set({ isTestingServer: null });
    }
  },

  syncServer: async (name, source, targets) => {
    try {
      await api.syncServer({ name, source, targets });
      await get().loadData();
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  syncAll: async (source) => {
    try {
      await api.syncAllServers(source);
      await get().loadData();
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  backupAll: async () => {
    try {
      return await api.backupConfigs();
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  // Computed
  getFilteredServers: () => {
    const { servers, filterMode, searchQuery } = get();
    let filtered = servers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.command.toLowerCase().includes(query)
      );
    }

    // Apply filter mode
    switch (filterMode) {
      case 'synced':
        filtered = filtered.filter((s) => {
          const systems = Object.values(s.systems);
          return systems.every((sys) => sys.enabled);
        });
        break;
      case 'partial':
        filtered = filtered.filter((s) => {
          const systems = Object.values(s.systems);
          const enabledCount = systems.filter((sys) => sys.enabled).length;
          return enabledCount > 0 && enabledCount < systems.length;
        });
        break;
      case 'claudeCode':
        filtered = filtered.filter((s) => s.systems.claudeCode?.enabled);
        break;
      case 'claudeDesktop':
        filtered = filtered.filter((s) => s.systems.claudeDesktop?.enabled);
        break;
      case 'rooCode':
        filtered = filtered.filter((s) => s.systems.rooCode?.enabled);
        break;
    }

    return filtered;
  },

  getSelectedServerData: () => {
    const { servers, selectedServer } = get();
    if (!selectedServer) return null;
    return servers.find((s) => s.name === selectedServer) || null;
  },

  getSyncStatus: () => {
    const { servers } = get();
    let synced = 0;
    let partial = 0;

    for (const server of servers) {
      const systems = Object.values(server.systems);
      const enabledCount = systems.filter((sys) => sys.enabled).length;

      if (enabledCount === systems.length) {
        synced++;
      } else if (enabledCount > 0) {
        partial++;
      }
    }

    return { synced, partial, total: servers.length };
  },
}));
