import React from 'react';
import { useGlobalTasks } from '../../context/GlobalTaskContext';
import { CheckCircle, AlertCircle, Loader2, X, Sparkles, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DynamicIslandNotification = () => {
  const { islandNotification, dismissIsland, setScheduleTask, setReviewerTask } = useGlobalTasks();
  const navigate = useNavigate();

  if (!islandNotification) return null;

  const handleClick = () => {
    // If it's related to schedule scan, expand schedule modal
    if (islandNotification.target === 'schedule') {
      setScheduleTask((prev) => ({ ...prev, isOpen: true, isMinimized: false }));
      navigate('/subjects');
    } else if (islandNotification.target === 'reviewer') {
      setReviewerTask((prev) => ({ ...prev, isOpen: true, isMinimized: false }));
      navigate('/exam');
    }
  };

  const isWorking = islandNotification.type === 'scanning' || islandNotification.type === 'generating';
  const isSuccess = islandNotification.type === 'success';
  const isError = islandNotification.type === 'error';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-6 duration-300 pointer-events-auto">
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-2xl border text-xs cursor-pointer transition-all hover:scale-105 select-none ${
          isError
            ? 'bg-rose-950/95 border-rose-700/80 text-rose-100 shadow-rose-950/50'
            : isSuccess
            ? 'bg-emerald-950/95 border-emerald-700/80 text-emerald-100 shadow-emerald-950/50'
            : 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60'
        }`}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
          {isWorking ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>

        <div className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
          <span className="font-extrabold mr-1.5">{islandNotification.title}</span>
          <span className="opacity-80 text-[11px] truncate">{islandNotification.subtitle}</span>
        </div>

        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 opacity-70">
          {islandNotification.target === 'sync' ? 'Auto-Synced' : 'Click to View'}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            dismissIsland();
          }}
          className="p-1 rounded-full hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DynamicIslandNotification;
