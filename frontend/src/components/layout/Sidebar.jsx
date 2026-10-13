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
  MessageSquare,
  Calendar,
  Download,
  Smile,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import UserAvatar from '../common/UserAvatar';
import AvatarPickerModal from '../common/AvatarPickerModal';
import InstallAppModal from '../common/InstallAppModal';

const Sidebar = ({ onQuickAddClick }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { isOnline, isSyncing, pendingQueueCount, triggerAutoSync } = useOffline();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(!!window.deferredPrompt);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  React.useEffect(() => {
    const handleInstallReady = () => setCanInstall(true);
    window.addEventListener('pwa-install-ready', handleInstallReady);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setCanInstall(true);
    });
    return () => window.removeEventListener('pwa-install-ready', handleInstallReady);
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const result = await promptEvent.userChoice;
        if (result.outcome === 'accepted') {
          setCanInstall(false);
          window.deferredPrompt = null;
        }
      } catch (e) {
        setIsInstallModalOpen(true);
      }
    } else {
      // Browser didn't provide prompt or manual instructions needed
      setIsInstallModalOpen(true);
    }
  };

  const isAdmin =
    user?.role === 'admin' ||
    (user?.email && user?.email.toLowerCase() === 'kentfloyd02@gmail.com');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Task Board & Views', href: '/tasks', icon: CheckSquare },
    { name: 'Class Schedule', href: '/schedule', icon: Calendar },
    { name: 'Study Hub & Chats', href: '/chats', icon: MessageSquare },
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
          <img
            src="/logo.png"
            alt="Student Planner Logo"
            className="w-8 h-8 rounded-xl object-cover shadow-md shadow-blue-500/20"
          />
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Student Planner</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAvatarPickerOpen(true)}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
            title="I-customize ang iyong Avatar"
          >
            <UserAvatar user={user} size="sm" />
          </button>
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
            <img
              src="/logo.png"
              alt="Student Planner Logo"
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20"
            />
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

            {/* Install App Button */}
            <button
              onClick={handleInstallApp}
              title="Install App sa Android o PC"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
            >
              <Download className="w-2.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Offline Sync Status Banner (if pending updates or syncing) */}
          {(pendingQueueCount > 0 || isSyncing) && (
            <button
              onClick={triggerAutoSync}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold cursor-pointer hover:bg-amber-500/20 active:scale-95 transition-all"
              title="I-sync ang IndexedDB updates sa cloud"
            >
              <div className="flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-500' : 'text-amber-500'}`} />
                <span>{isSyncing ? 'Nag-si-sync...' : `${pendingQueueCount} offline update(s)`}</span>
              </div>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/25">Sync Now</span>
            </button>
          )}

          {/* Interactive Profile Card with 3D Avatar */}
          <div
            onClick={() => setIsAvatarPickerOpen(true)}
            title="I-click para i-customize ang iyong Avatar"
            className="flex items-center gap-3 bg-white dark:bg-slate-800/70 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800 group transition-all cursor-pointer"
          >
            <div className="relative">
              <UserAvatar user={user} size="md" className="group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-xs ring-1 ring-white dark:ring-slate-800 group-hover:bg-indigo-600">
                ✏️
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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

      {/* Avatar Customizer Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
      />

      {/* PWA Install Guide Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        promptInstall={handleInstallApp}
        canPrompt={canInstall}
      />
    </>
  );
};

export default Sidebar;
