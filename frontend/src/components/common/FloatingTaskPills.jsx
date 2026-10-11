import React from 'react';
import { useGlobalTasks } from '../../context/GlobalTaskContext';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Maximize2, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingTaskPills = () => {
  const { scheduleTask, setScheduleTask, reviewerTask, setReviewerTask } = useGlobalTasks();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 pointer-events-auto">
      {/* 1. SCHEDULE SCAN MINIMIZED PILL */}
      {scheduleTask.isOpen && scheduleTask.isMinimized && (
        <div
          onClick={() => {
            setScheduleTask((prev) => ({ ...prev, isMinimized: false }));
            navigate('/subjects');
          }}
          className="flex items-center gap-3.5 px-4 py-3 bg-slate-900/90 dark:bg-black/90 hover:bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl cursor-pointer hover:scale-105 transition-all group"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              {scheduleTask.scanning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : scheduleTask.extractedSubjects ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : scheduleTask.errorMessage ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>
            {scheduleTask.scanning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>

          <div className="pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide">
                {scheduleTask.scanning
                  ? 'Sina-scan ang Schedule...'
                  : scheduleTask.extractedSubjects
                  ? `Ready to Review (${scheduleTask.extractedSubjects.length})`
                  : scheduleTask.errorMessage
                  ? 'May Error sa Scan'
                  : 'Schedule Scanner'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold uppercase">
                Minimized
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {scheduleTask.file?.name || 'I-click para i-maximize'}
            </p>
          </div>

          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScheduleTask((prev) => ({ ...prev, isMinimized: false }));
                navigate('/subjects');
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScheduleTask((prev) => ({ ...prev, isOpen: false, isMinimized: false, file: null, extractedSubjects: null }));
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. REVIEWER GENERATE MINIMIZED PILL */}
      {reviewerTask.isOpen && reviewerTask.isMinimized && (
        <div
          onClick={() => {
            setReviewerTask((prev) => ({ ...prev, isMinimized: false }));
            navigate('/exam');
          }}
          className="flex items-center gap-3.5 px-4 py-3 bg-indigo-950/90 dark:bg-black/90 hover:bg-indigo-900 text-white rounded-2xl shadow-2xl border border-indigo-700/80 backdrop-blur-xl cursor-pointer hover:scale-105 transition-all group"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              {reviewerTask.generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : reviewerTask.generatedData ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : reviewerTask.errorMessage ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-purple-300" />
              )}
            </div>
            {reviewerTask.generating && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            )}
          </div>

          <div className="pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide">
                {reviewerTask.generating
                  ? 'Gine-generate ang Reviewer...'
                  : reviewerTask.generatedData
                  ? 'Tapos na ang Reviewer!'
                  : reviewerTask.errorMessage
                  ? 'May Error sa Reviewer'
                  : 'Reviewer Generator'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold uppercase">
                Minimized
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {reviewerTask.subject || reviewerTask.file?.name || 'I-click para i-maximize'}
            </p>
          </div>

          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReviewerTask((prev) => ({ ...prev, isMinimized: false }));
                navigate('/exam');
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReviewerTask((prev) => ({ ...prev, isOpen: false, isMinimized: false, file: null, generatedData: null }));
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTaskPills;
