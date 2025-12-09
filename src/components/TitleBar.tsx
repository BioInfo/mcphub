import { Search, Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { motion } from 'framer-motion';

export function TitleBar() {
  const {
    searchQuery,
    setSearchQuery,
    setAddModalOpen,
    loadData,
    isLoading,
  } = useAppStore();

  return (
    <div className="h-[52px] flex items-center justify-between px-4 border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-xl">
      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-surface-100">MCPHub</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-1.5 text-sm bg-surface-900/50 border-surface-800"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadData()}
          disabled={isLoading}
          className="btn-icon"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddModalOpen(true)}
          className="btn-primary py-1.5 px-3 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </motion.button>
      </div>
    </div>
  );
}
