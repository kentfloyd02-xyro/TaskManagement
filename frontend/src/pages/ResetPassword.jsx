import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import {
  GraduationCap,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [previousPassword, setPreviousPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPreviousPassword, setShowPreviousPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requiresPreviousPassword, setRequiresPreviousPassword] = useState(true);
  const [checkingInfo, setCheckingInfo] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResetInfo = async () => {
      try {
        const res = await api.get(`/auth/reset-password-info/${token}`);
        if (res.data.success) {
          setRequiresPreviousPassword(res.data.requiresPreviousPassword);
        }
      } catch (err) {
        // If error fetching info, default based on query param ?source=localhost
        const isLocalhost = searchParams.get('source') === 'localhost';
        setRequiresPreviousPassword(isLocalhost);
      } finally {
        setCheckingInfo(false);
      }
    };

    fetchResetInfo();
  }, [token, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requiresPreviousPassword && !previousPassword.trim()) {
      setError('Pakilagay ang iyong Previous Password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Pakisiguradong pareho ang New Password at Confirm Password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        password,
        previousPassword: requiresPreviousPassword ? previousPassword : undefined,
      };
      const res = await api.post(`/auth/reset-password/${token}`, payload);
      setMessage(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Set New Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please enter your new student account password.
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message} Redirecting to login...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Security Mode Indicator Pill */}
        {!checkingInfo && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
              requiresPreviousPassword
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {requiresPreviousPassword ? (
              <>
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <strong className="block font-bold">Localhost Recovery Mode</strong>
                  <span>Dahil sa localhost ginagawa ang pag-reset, kailangan mong ilagay ang iyong previous password para sa seguridad ng account.</span>
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <strong className="block font-bold">Verified via SMTP Email</strong>
                  <span>Na-verify ang link mula sa iyong email. Hindi mo na kailangang ilagay ang iyong previous password.</span>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Previous Password field - shown ONLY if requiresPreviousPassword is true */}
          {requiresPreviousPassword && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Previous / Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPreviousPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your old password"
                  value={previousPassword}
                  onChange={(e) => setPreviousPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-50/40 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPreviousPassword(!showPreviousPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden p-0.5 cursor-pointer"
                  title={showPreviousPassword ? 'Hide password' : 'Show password'}
                >
                  {showPreviousPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              New Password (6+ characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden p-0.5 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span>{loading ? 'Updating...' : 'Update Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
