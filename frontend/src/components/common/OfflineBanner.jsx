import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

const OfflineBanner = () => {
  const { isOnline, isSyncing, syncStatus, triggerAutoSync } = useOffline();

  if (isOnline && !syncStatus && !isSyncing) {
    return null;
  }

  return (
    <div className="w-full z-40 transition-all duration-300">
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Offline Mode:</strong> Pwede mong gamitin ang Tasks at Preset Reviewer. Ang AI Chatbot at Question Generator ay nangangailangan ng internet.
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-black uppercase">
            Local Storage Active
          </span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="bg-blue-500/15 border-b border-blue-500/30 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between backdrop-blur-sm animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 shrink-0 text-blue-500 animate-spin" />
            <span>{syncStatus || 'Nag-si-sync ang iyong mga offline changes sa database...'}</span>
          </div>
        </div>
      )}

      {isOnline && !isSyncing && syncStatus && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{syncStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
