import React, { useState } from 'react';
import client from '../../api/client';
import {
  Upload,
  X,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const UploadMaterialModal = ({ isOpen, onClose, onSuccess, initialCategory = 'quiz' }) => {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(initialCategory); // quiz or exam
  const [questionCount, setQuestionCount] = useState(10); // 10, 25, 50
  const [questionType, setQuestionType] = useState('multiple_choice'); // multiple_choice, identification, enumeration, mixed
  const [hasTimer, setHasTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
      // If subject is blank, autofill from filename
      if (!subject) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setSubject(cleanName.slice(0, 30));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload (.pdf, .docx, .pptx, or .txt).');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide a subject name.');
      return;
    }

    if (!navigator.onLine) {
      setError('Nangangailangan ng Internet connection ang pag-upload at pag-generate ng AI questions gamit ang Gemini.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subject.trim());
      formData.append('category', category);
      formData.append('questionCount', questionCount);
      formData.append('questionTypePreference', questionType);
      formData.append('hasTimer', hasTimer);
      formData.append('timerDurationSeconds', hasTimer ? timerMinutes * 60 : 0);

      const res = await client.post('/reviewer/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to process file and generate questions. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Upload File & Generate Reviewer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                AI extracts key concepts and generates personalized questions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Upload Study Material (.pdf, .docx, .pptx, .txt)
            </label>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    I-click dito para pumili ng file
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports PowerPoint, Word, PDF, at Text files up to 25MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Category Toggle: Quiz vs Exam */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('quiz')}
                className={`p-3 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${
                  category === 'quiz'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                📝 Quiz (Quick Practice)
              </button>
              <button
                type="button"
                onClick={() => setCategory('exam')}
                className={`p-3 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${
                  category === 'exam'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                🎓 Major Exam Simulator
              </button>
            </div>
          </div>

          {/* Subject Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Subject / Course Name
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Halimbawa: CC106 - Application Development, History, Biology"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question Count Selection: 10 | 25 | 50 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 25, 50].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    questionCount === count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Question Type: Multiple Choice, Identification, Enumeration, Mixed */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Question Format
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { id: 'multiple_choice', label: '🔘 Multiple Choice Only' },
                { id: 'identification', label: '✍️ Identification Only' },
                { id: 'enumeration', label: '📋 Enumeration Only' },
                { id: 'mixed', label: '🔀 Mixed / Halo-halo' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setQuestionType(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    questionType === t.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Mode: With Timer vs Off Time */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Timer Setting
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasTimer(!hasTimer)}
                className={`px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer ${
                  hasTimer
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {hasTimer ? 'WITH TIMER' : 'OFF TIME (Chill Mode)'}
              </button>
            </div>

            {hasTimer && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-500 font-medium">Duration:</span>
                {[10, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimerMinutes(mins)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      timerMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Questions via Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Reviewer Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialModal;
