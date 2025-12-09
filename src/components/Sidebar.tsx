import { Server, CheckCircle2, AlertCircle, Monitor, Terminal, Code2 } from 'lucide-react';
import { useAppStore, FilterMode } from '../stores/appStore';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface FilterItem {
  id: FilterMode;
  label: string;
  icon: React.ElementType;
  color?: string;
}

const filters: FilterItem[] = [
  { id: 'all', label: 'All Servers', icon: Server },
  { id: 'synced', label: 'Synced', icon: CheckCircle2 },
  { id: 'partial', label: 'Partial', icon: AlertCircle },
];

const systemFilters: FilterItem[] = [
  { id: 'claudeCode', label: 'Claude Code', icon: Terminal, color: 'brand' },
  { id: 'claudeDesktop', label: 'Claude Desktop', icon: Monitor, color: 'purple' },
  { id: 'rooCode', label: 'Roo Code', icon: Code2, color: 'emerald' },
];

export function Sidebar() {
  const { filterMode, setFilterMode, getSyncStatus, servers } = useAppStore();
  const { synced, partial, total } = getSyncStatus();

  return (
    <div className="w-56 flex-shrink-0 border-r border-surface-800/50 bg-surface-950/50 flex flex-col">
      {/* Stats */}
      <div className="p-4 border-b border-surface-800/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="glass-subtle rounded-lg p-2">
            <div className="text-lg font-semibold text-surface-100">{total}</div>
            <div className="text-2xs text-surface-500 uppercase tracking-wide">Total</div>
          </div>
          <div className="glass-subtle rounded-lg p-2">
            <div className="text-lg font-semibold text-success-400">{synced}</div>
            <div className="text-2xs text-surface-500 uppercase tracking-wide">Synced</div>
          </div>
          <div className="glass-subtle rounded-lg p-2">
            <div className="text-lg font-semibold text-warning-400">{partial}</div>
            <div className="text-2xs text-surface-500 uppercase tracking-wide">Partial</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-2">
          <span className="text-2xs font-medium text-surface-500 uppercase tracking-wider">
            Filter
          </span>
        </div>

        <nav className="px-2 space-y-0.5">
          {filters.map((filter) => {
            const isActive = filterMode === filter.id;
            const Icon = filter.icon;
            const count =
              filter.id === 'all'
                ? total
                : filter.id === 'synced'
                ? synced
                : partial;

            return (
              <motion.button
                key={filter.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilterMode(filter.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{filter.label}</span>
                <span
                  className={clsx(
                    'text-xs px-1.5 py-0.5 rounded',
                    isActive
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-surface-800 text-surface-500'
                  )}
                >
                  {count}
                </span>
              </motion.button>
            );
          })}
        </nav>

        <div className="px-3 mt-4 mb-2">
          <span className="text-2xs font-medium text-surface-500 uppercase tracking-wider">
            By System
          </span>
        </div>

        <nav className="px-2 space-y-0.5">
          {systemFilters.map((filter) => {
            const isActive = filterMode === filter.id;
            const Icon = filter.icon;
            const count = servers.filter(
              (s) => s.systems[filter.id]?.enabled
            ).length;

            return (
              <motion.button
                key={filter.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilterMode(filter.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{filter.label}</span>
                <span
                  className={clsx(
                    'text-xs px-1.5 py-0.5 rounded',
                    isActive
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-surface-800 text-surface-500'
                  )}
                >
                  {count}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-surface-800/50">
        <div className="text-2xs text-surface-600 text-center">
          MCPHub v0.1.0
        </div>
      </div>
    </div>
  );
}
