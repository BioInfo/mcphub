import { useAppStore } from '../stores/appStore';
import { ServerCard } from './ServerCard';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchX } from 'lucide-react';

export function ServerList() {
  const { getFilteredServers, selectedServer, selectServer, isLoading } = useAppStore();
  const servers = getFilteredServers();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-surface-500">Loading servers...</span>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-surface-800/50 flex items-center justify-center">
            <SearchX className="w-6 h-6 text-surface-500" />
          </div>
          <div>
            <h3 className="text-surface-200 font-medium">No servers found</h3>
            <p className="text-sm text-surface-500 mt-1">
              Try adjusting your search or filter
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <AnimatePresence mode="popLayout">
        <motion.div className="space-y-2">
          {servers.map((server, index) => (
            <motion.div
              key={server.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            >
              <ServerCard
                server={server}
                isSelected={selectedServer === server.name}
                onClick={() => selectServer(server.name)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
