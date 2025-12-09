import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ServerList } from './components/ServerList';
import { ServerDetail } from './components/ServerDetail';
import { AddServerModal } from './components/AddServerModal';

function App() {
  const { loadData, error } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Server List */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-surface-800/50 bg-surface-950/50">
          <ServerList />
        </div>

        {/* Server Detail */}
        <ServerDetail />
      </div>

      {/* Modals */}
      <AddServerModal />

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
