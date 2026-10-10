import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Lock,
  User,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, theme, toggleTheme } = useAuth();

  const initialCourses = [
    'BS Computer Science',
    'BS Information Technology',
    'BS Information Systems',
    'BS Computer Engineering',
    'BS Civil Engineering',
    'BS Electrical Engineering',
    'BS Accountancy',
    'BS Business Administration',
    'BS Nursing',
    'BS Psychology',
    'BS Architecture',
    'BS Education',
  ];

  const [name, setName] = useState(user?.name || '');
  const [courseSelect, setCourseSelect] = useState(() => {
    if (!user?.course) return 'BS Computer Science';
    return initialCourses.includes(user.course) ? user.course : 'Others';
  });
  const [customCourse, setCustomCourse] = useState(() => {
    if (!user?.course) return '';
    return initialCourses.includes(user.course) ? '' : user.course;
  });
  const [yearLevel, setYearLevel] = useState(user?.yearLevel || '1st Year');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // If changing password, validate first
    if (password.trim()) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Pakisiguradong pareho ang New Password at Confirm Password.');
        return;
      }
      // Ask user confirmation before saving password change
      setShowConfirmModal(true);
      return;
    }

    // Direct save if password is not changed
    executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    setShowConfirmModal(false);

    try {
      const finalCourse = courseSelect === 'Others' ? customCourse.trim() || 'Student' : courseSelect;
      const payload = { name, course: finalCourse, yearLevel };
      if (password.trim()) {
        payload.password = password;
      }
      await updateProfile(payload);
      setMessage('Profile settings updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal student profile, password, and UI theme.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Theme Preference Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Interface Theme</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between Light and Dark interface modes.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" /> Light Mode
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" /> Dark Mode
            </>
          )}
        </button>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-blue-500" />
          Student Information
        </h3>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Course / Degree
              </label>
              <select
                value={courseSelect}
                onChange={(e) => setCourseSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Information Technology">BS Information Technology</option>
                <option value="BS Information Systems">BS Information Systems</option>
                <option value="BS Computer Engineering">BS Computer Engineering</option>
                <option value="BS Civil Engineering">BS Civil Engineering</option>
                <option value="BS Electrical Engineering">BS Electrical Engineering</option>
                <option value="BS Accountancy">BS Accountancy</option>
                <option value="BS Business Administration">BS Business Administration</option>
                <option value="BS Nursing">BS Nursing</option>
                <option value="BS Psychology">BS Psychology</option>
                <option value="BS Architecture">BS Architecture</option>
                <option value="BS Education">BS Education</option>
                <option value="Others">Others (Type below)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Year Level
              </label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Graduate Student">Graduate Student</option>
              </select>
            </div>
          </div>

          {/* Typeable custom course when Others is selected */}
          {courseSelect === 'Others' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Specify Your Custom Course / Program *
              </label>
              <input
                type="text"
                required
                placeholder="Enter your program name..."
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Security & Password
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden p-0.5 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!password.trim()}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!password.trim()}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden p-0.5 cursor-pointer disabled:opacity-40"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer btn-interactive"
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* PASSWORD CHANGE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-scale-in space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/10 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kumpirmahin ang Pagpalit ng Password?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sigurado ka ba na gusto mong palitan ang iyong kasalukuyang password? Kakailanganin mo nang gamitin ang bagong password na ito sa susunod mong pag-login.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Kanselahin
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={executeSave}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {loading ? 'Pinapalitan...' : 'Oo, Palitan ang Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
