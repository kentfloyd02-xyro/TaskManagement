import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  Flame,
  Award,
  Trophy,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
  Shield,
  Star,
} from 'lucide-react';

const GamificationWidget = () => {
  const [data, setData] = useState({
    streak: { currentStreak: 1, bestStreak: 1 },
    badges: [],
    catalog: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges' | 'leaderboard'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const [statusRes, lbRes] = await Promise.all([
          client.get('/gamification/status'),
          client.get('/gamification/leaderboard'),
        ]);

        if (statusRes.data?.success) setData(statusRes.data);
        if (lbRes.data?.success) setLeaderboard(lbRes.data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching gamification data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const unlockedBadgeIds = (data.badges || []).map((b) => b.id);

  return (
    <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
      {/* Top Banner: Streak Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 ring-4 ring-orange-500/10 animate-pulse">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {data.streak?.currentStreak || 1} Days Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                Study Streak 🔥
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Best record: <strong>{data.streak?.bestStreak || 1} consecutive days</strong>. Keep studying daily!
            </p>
          </div>
        </div>

        {/* Tab switch: Badges vs Leaderboard */}
        <div className="flex p-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏅 Badges ({data.badges?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {/* VIEW 1: BADGES SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Achievement Badges Showcase</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(data.catalog || []).map((badge) => {
              const isUnlocked = unlockedBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                    isUnlocked
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 shadow-2xs'
                      : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-60 grayscale'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs shrink-0">
                    {badge.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {badge.name}
                      </h4>
                      {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: FRIENDS STREAK LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Friends & Classmates Study Streak Rankings</span>
          </h3>

          <div className="space-y-2">
            {leaderboard.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  item.isMe
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                      item.rank === 1
                        ? 'bg-amber-400 text-amber-950'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : item.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.rank}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {item.name} {item.isMe && '(Ikaw)'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {item.badgeCount} badges unlocked
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black text-xs">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{item.streak} Days</span>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">
                Mag-add ng friends sa Study Hub para makita ang rankings ninyo!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationWidget;
