import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ManagedServer, HealthStatus } from '../types/mcp';
import { Terminal, Monitor, Code2 } from 'lucide-react';

interface ServerCardProps {
  server: ManagedServer;
  isSelected: boolean;
  onClick: () => void;
}

function HealthIndicator({ health }: { health: HealthStatus }) {
  const statusClasses = {
    healthy: 'status-healthy',
    untested: 'status-warning',
    error: 'status-error',
    disabled: 'status-disabled',
  };

  return <div className={statusClasses[health]} />;
}

function SystemIndicators({ systems }: { systems: ManagedServer['systems'] }) {
  const systemConfigs = [
    { key: 'claudeCode', icon: Terminal, label: 'CC' },
    { key: 'claudeDesktop', icon: Monitor, label: 'CD' },
    { key: 'rooCode', icon: Code2, label: 'RC' },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {systemConfigs.map(({ key, label }) => {
        const status = systems[key];
        const isEnabled = status?.enabled ?? false;

        return (
          <div
            key={key}
            className={clsx(
              'system-dot',
              isEnabled ? 'system-dot-enabled' : 'system-dot-disabled'
            )}
            title={`${label}: ${isEnabled ? 'Enabled' : 'Disabled'}`}
          />
        );
      })}
    </div>
  );
}

export function ServerCard({ server, isSelected, onClick }: ServerCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={clsx(
        'cursor-pointer transition-all duration-200',
        isSelected ? 'card-selected' : 'card-interactive'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Health indicator */}
        <HealthIndicator health={server.health} />

        {/* Server info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-surface-100 truncate">
              {server.name}
            </h3>
            {server.health === 'error' && server.errorMessage && (
              <span className="badge-danger text-2xs">Error</span>
            )}
          </div>
          <p className="text-sm text-surface-500 truncate font-mono">
            {server.command} {server.args.length > 0 && `${server.args[0].split('/').pop()}`}
          </p>
        </div>

        {/* System indicators */}
        <SystemIndicators systems={server.systems} />
      </div>
    </motion.div>
  );
}
