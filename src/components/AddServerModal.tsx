import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Terminal, Monitor, Code2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { ConfigType, MCPServer } from '../types/mcp';

const systemConfigs: { key: ConfigType; icon: React.ElementType; label: string }[] = [
  { key: 'claudeCode', icon: Terminal, label: 'Claude Code' },
  { key: 'claudeDesktop', icon: Monitor, label: 'Claude Desktop' },
  { key: 'rooCode', icon: Code2, label: 'Roo Code' },
];

interface FormData {
  name: string;
  command: string;
  args: string[];
  env: { key: string; value: string }[];
  alwaysAllow: string[];
  targets: ConfigType[];
}

const initialFormData: FormData = {
  name: '',
  command: '',
  args: [''],
  env: [],
  alwaysAllow: [],
  targets: ['claudeCode', 'claudeDesktop', 'rooCode'],
};

export function AddServerModal() {
  const { isAddModalOpen, setAddModalOpen, saveServer, isEditModalOpen, setEditModalOpen, getSelectedServerData } =
    useAppStore();

  const isOpen = isAddModalOpen || isEditModalOpen;
  const isEditing = isEditModalOpen;
  const selectedServer = getSelectedServerData();

  const [form, setForm] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && selectedServer) {
      setForm({
        name: selectedServer.name,
        command: selectedServer.command,
        args: selectedServer.args.length > 0 ? selectedServer.args : [''],
        env: Object.entries(selectedServer.env).map(([key, value]) => ({ key, value })),
        alwaysAllow: selectedServer.alwaysAllow,
        targets: (Object.entries(selectedServer.systems)
          .filter(([_, status]) => status.enabled)
          .map(([key]) => key) as ConfigType[]),
      });
    } else {
      setForm(initialFormData);
    }
  }, [isEditing, selectedServer]);

  const handleClose = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setForm(initialFormData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Server name is required');
      return;
    }

    if (!form.command.trim()) {
      setError('Command is required');
      return;
    }

    if (form.targets.length === 0) {
      setError('Select at least one target system');
      return;
    }

    setIsSubmitting(true);

    try {
      const server: MCPServer = {
        command: form.command.trim(),
        args: form.args.filter((a) => a.trim() !== ''),
        env: Object.fromEntries(form.env.filter((e) => e.key.trim()).map((e) => [e.key, e.value])),
        alwaysAllow: form.alwaysAllow.filter((a) => a.trim() !== ''),
      };

      await saveServer(
        form.name.trim(),
        server,
        form.targets,
        isEditing ? selectedServer?.name : undefined
      );

      handleClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addArg = () => setForm((f) => ({ ...f, args: [...f.args, ''] }));
  const removeArg = (index: number) =>
    setForm((f) => ({ ...f, args: f.args.filter((_, i) => i !== index) }));
  const updateArg = (index: number, value: string) =>
    setForm((f) => ({ ...f, args: f.args.map((a, i) => (i === index ? value : a)) }));

  const addEnv = () => setForm((f) => ({ ...f, env: [...f.env, { key: '', value: '' }] }));
  const removeEnv = (index: number) =>
    setForm((f) => ({ ...f, env: f.env.filter((_, i) => i !== index) }));
  const updateEnv = (index: number, field: 'key' | 'value', value: string) =>
    setForm((f) => ({
      ...f,
      env: f.env.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));

  const toggleTarget = (target: ConfigType) => {
    setForm((f) => ({
      ...f,
      targets: f.targets.includes(target)
        ? f.targets.filter((t) => t !== target)
        : [...f.targets, target],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="glass w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-surface-800/50">
                <h2 className="text-lg font-semibold text-surface-100">
                  {isEditing ? 'Edit Server' : 'Add New Server'}
                </h2>
                <button onClick={handleClose} className="btn-icon">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">
                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Server Name */}
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., filesystem, github"
                      className="input"
                      autoFocus
                    />
                  </div>

                  {/* Command */}
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Command
                    </label>
                    <input
                      type="text"
                      value={form.command}
                      onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                      placeholder="e.g., npx, node, python"
                      className="input font-mono"
                    />
                  </div>

                  {/* Arguments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-surface-300">Arguments</label>
                      <button type="button" onClick={addArg} className="btn-ghost py-1 px-2 text-xs">
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.args.map((arg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={arg}
                            onChange={(e) => updateArg(i, e.target.value)}
                            placeholder={`Argument ${i + 1}`}
                            className="input-sm font-mono flex-1"
                          />
                          {form.args.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArg(i)}
                              className="btn-icon p-1.5 text-danger-400 hover:text-danger-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environment Variables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-surface-300">
                        Environment Variables
                      </label>
                      <button type="button" onClick={addEnv} className="btn-ghost py-1 px-2 text-xs">
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    {form.env.length > 0 ? (
                      <div className="space-y-2">
                        {form.env.map((env, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={env.key}
                              onChange={(e) => updateEnv(i, 'key', e.target.value)}
                              placeholder="KEY"
                              className="input-sm font-mono w-1/3"
                            />
                            <span className="text-surface-600">=</span>
                            <input
                              type="text"
                              value={env.value}
                              onChange={(e) => updateEnv(i, 'value', e.target.value)}
                              placeholder="value"
                              className="input-sm font-mono flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeEnv(i)}
                              className="btn-icon p-1.5 text-danger-400 hover:text-danger-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-surface-500">No environment variables</p>
                    )}
                  </div>

                  {/* Target Systems */}
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-3">
                      Enable for Systems
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {systemConfigs.map(({ key, icon: Icon, label }) => {
                        const isSelected = form.targets.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleTarget(key)}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                              isSelected
                                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                                : 'bg-surface-900/50 border-surface-700 text-surface-400 hover:border-surface-600'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-surface-800/50 flex items-center justify-end gap-3">
                  <button type="button" onClick={handleClose} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEditing ? (
                      'Save Changes'
                    ) : (
                      'Add Server'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
