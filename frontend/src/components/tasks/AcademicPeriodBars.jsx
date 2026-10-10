import React from 'react';
import { Award, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const AcademicPeriodBars = ({ periods }) => {
  const periodKeys = [
    {
      key: 'Prelim',
      label: 'Prelim Period',
      gradient: 'from-blue-500 to-indigo-600',
      badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
      glow: 'shadow-blue-500/20',
    },
    {
      key: 'Midterm',
      label: 'Midterm Period',
      gradient: 'from-amber-500 to-orange-600',
      badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
      glow: 'shadow-amber-500/20',
    },
    {
      key: 'Finals',
      label: 'Finals Period',
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
      glow: 'shadow-emerald-500/20',
    },
  ];

  return (
    <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </span>
            Academic Term Completion Bars
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time finished task ratios for Prelims, Midterms, and Finals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {periodKeys.map(({ key, label, gradient, badge, glow }, idx) => {
          const stat = periods?.[key] || { total: 0, completed: 0, pending: 0, percentage: 0 };
          const isFinished = stat.total > 0 && stat.percentage === 100;
          const staggerClass = idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : 'stagger-3';

          return (
            <div
              key={key}
              className={`bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-5 space-y-3.5 card-interactive animate-fade-in-up ${staggerClass} ${
                isFinished ? 'ring-2 ring-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badge} flex items-center gap-1.5 transition-transform hover:scale-105`}>
                  {label}
                  {isFinished && <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />}
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.percentage}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
                <div
                  className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-700 ease-out shadow-xs`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {stat.completed} Finished
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {stat.pending} Pending ({stat.total} Total)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AcademicPeriodBars;
