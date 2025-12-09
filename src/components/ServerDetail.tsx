import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  Play,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Terminal,
  Monitor,
  Code2,
  ChevronRight,
  Loader2,
  Edit3,
} from 'lucide-react';
import type { ConfigType, ManagedServer } from '../types/mcp';

const systemConfigs: { key: ConfigType; icon: React.ElementType; label: string; color: string }[] = [
  { key: 'claudeCode', icon: Terminal, label: 'Claude Code', color: 'brand' },
  { key: 'claudeDesktop', icon: Monitor, label: 'Claude Desktop', color: 'violet' },
  { key: 'rooCode', icon: Code2, label: 'Roo Code', color: 'emerald' },
];

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={clsx(
        'toggle',
        enabled ? 'toggle-enabled' : 'toggle-disabled',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'toggle-knob',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="btn-icon p-1" title="Copy">
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function HealthBadge({ server }: { server: ManagedServer }) {
  const statusConfig = {
    healthy: { label: 'Healthy', className: 'badge-success' },
    untested: { label: 'Untested', className: 'badge-warning' },
    error: { label: 'Error', className: 'badge-danger' },
    disabled: { label: 'Disabled', className: 'badge-neutral' },
  };

  const config = statusConfig[server.health];

  return <span className={config.className}>{config.label}</span>;
}

export function ServerDetail() {
  const { getSelectedServerData, setServerEnabled, testServer, deleteServer, isTestingServer, setEditModalOpen } =
    useAppStore();
  const server = getSelectedServerData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!server) {
    return (
      <div className="flex-1 flex items-center justify-center border-l border-surface-800/50 bg-surface-950/30">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800/50 flex items-center justify-center mx-auto mb-4">
            <ChevronRight className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-surface-400 font-medium">Select a server</h3>
          <p className="text-sm text-surface-600 mt-1">
            Choose a server to view its details
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async (configType: ConfigType, enabled: boolean) => {
    try {
      await setServerEnabled(server.name, configType, enabled);
    } catch (err) {
      console.error('Failed to toggle server:', err);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await testServer(server.name, {
      command: server.command,
      args: server.args,
      env: server.env,
      alwaysAllow: server.alwaysAllow,
    });
    setTestResult(result);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${server.name}"? This will remove it from all configurations.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteServer(server.name);
    } catch (err) {
      console.error('Failed to delete server:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isTesting = isTestingServer === server.name;

  return (
    <div className="flex-1 flex flex-col border-l border-surface-800/50 bg-surface-950/30">
      {/* Header */}
      <div className="p-6 border-b border-surface-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-surface-100 truncate">
                {server.name}
              </h2>
              <HealthBadge server={server} />
            </div>
            <p className="mt-1 text-sm text-surface-500 font-mono truncate">
              {server.command}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditModalOpen(true)}
              className="btn-secondary py-1.5"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTest}
              disabled={isTesting}
              className="btn-primary py-1.5"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Test
            </motion.button>
          </div>
        </div>

        {/* Test result */}
        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={clsx(
                'mt-4 p-3 rounded-lg border',
                testResult.success
                  ? 'bg-success-500/10 border-success-500/20 text-success-400'
                  : 'bg-danger-500/10 border-danger-500/20 text-danger-400'
              )}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* System toggles */}
        <section>
          <h3 className="text-sm font-medium text-surface-400 mb-3">
            Enable for Systems
          </h3>
          <div className="space-y-3">
            {systemConfigs.map(({ key, icon: Icon, label }) => {
              const status = server.systems[key];
              const isEnabled = status?.enabled ?? false;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50 border border-surface-800/50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-surface-400" />
                    <span className="text-surface-200">{label}</span>
                  </div>
                  <Toggle
                    enabled={isEnabled}
                    onChange={(enabled) => handleToggle(key, enabled)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Command */}
        <section>
          <h3 className="text-sm font-medium text-surface-400 mb-3">Command</h3>
          <div className="p-3 rounded-lg bg-surface-900/50 border border-surface-800/50 font-mono text-sm">
            <div className="flex items-center justify-between gap-2">
              <code className="text-brand-300 break-all">{server.command}</code>
              <CopyButton text={server.command} />
            </div>
          </div>
        </section>

        {/* Arguments */}
        {server.args.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-surface-400 mb-3">
              Arguments ({server.args.length})
            </h3>
            <div className="space-y-2">
              {server.args.map((arg, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-surface-900/50 border border-surface-800/50 font-mono text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-surface-300 break-all">{arg}</code>
                    <CopyButton text={arg} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Environment Variables */}
        {Object.keys(server.env).length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-surface-400 mb-3">
              Environment Variables
            </h3>
            <div className="space-y-2">
              {Object.entries(server.env).map(([key, value]) => (
                <div
                  key={key}
                  className="p-2 rounded-lg bg-surface-900/50 border border-surface-800/50 font-mono text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-warning-400">{key}</span>
                    <span className="text-surface-600">=</span>
                    <span className="text-surface-300 truncate flex-1">
                      {value.includes('***') ? '••••••••' : value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Always Allow */}
        {server.alwaysAllow.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-surface-400 mb-3">
              Always Allow
            </h3>
            <div className="flex flex-wrap gap-2">
              {server.alwaysAllow.map((permission) => (
                <span key={permission} className="badge-info">
                  {permission}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Error message */}
        {server.errorMessage && (
          <section>
            <h3 className="text-sm font-medium text-danger-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Last Error
            </h3>
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-300 text-sm font-mono">
              {server.errorMessage}
            </div>
          </section>
        )}

        {/* Last tested */}
        {server.lastTested && (
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <Clock className="w-3.5 h-3.5" />
            Last tested: {new Date(server.lastTested).toLocaleString()}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-surface-800/50">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn-danger w-full justify-center"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete Server
        </motion.button>
      </div>
    </div>
  );
}
