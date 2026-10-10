import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FolderGit2,
  Archive,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  PlusCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({ onQuickAddClick }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin =
    user?.role === 'admin' ||
    (user?.email && user?.email.toLowerCase() === 'kentfloyd02@gmail.com');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Task Board & Views', href: '/tasks', icon: CheckSquare },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Exam Reviewer', href: '/exam', icon: BookOpen },
    { name: 'Archive Vault', href: '/archive', icon: Archive },
    ...(isAdmin
      ? [{ name: 'Admin Console', href: '/admin', icon: ShieldCheck, isAdmin: true }]
      : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Student Planner</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/90 dark:bg-[#0c121e]/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Student Planner</h1>
              <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Academic Engine
              </p>
            </div>
          </div>

          {/* Quick Add Button */}
          <div className="px-4 pt-5 pb-3">
            <button
              onClick={() => {
                if (onQuickAddClick) onQuickAddClick();
                setIsOpen(false);
              }}
              className="w-full group flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>Quick Add Task</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? item.isAdmin
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm shadow-amber-500/30'
                        : 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/30'
                      : item.isAdmin
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.isAdmin && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 shadow-2xs">
                    Admin
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Settings Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" /> Dark Mode
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* User Details Profile Pill */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <div
              className={`w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-xs ${
                isAdmin
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-2 ring-amber-500/30'
                  : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
              }`}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name || 'Student'}
                </p>
                {isAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {isAdmin ? 'System Administrator' : user?.course || 'Student'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
