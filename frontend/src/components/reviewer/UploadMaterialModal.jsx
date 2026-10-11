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
  Minus,
} from 'lucide-react';
import { useGlobalTasks } from '../../context/GlobalTaskContext';

const UploadMaterialModal = ({ isOpen, onClose, onSuccess, initialCategory = 'quiz' }) => {
  const { reviewerTask, setReviewerTask, triggerIsland } = useGlobalTasks();

  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [hasTimer, setHasTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (reviewerTask.category) {
      setCategory(reviewerTask.category);
    }
  }, [reviewerTask.category]);

  if (!isOpen || reviewerTask.isMinimized) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
      if (!subject) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setSubject(cleanName.slice(0, 30));
      }
    }
  };

  const handleMinimize = () => {
    setReviewerTask((prev) => ({
      ...prev,
      isOpen: true,
      isMinimized: true,
      generating: loading,
      file,
      subject,
    }));
  };

  const handleClose = () => {
    setReviewerTask((prev) => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
      generating: false,
    }));
    onClose();
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

    // Update global reviewer state for background tracking
    setReviewerTask((prev) => ({
      ...prev,
      isOpen: true,
      generating: true,
      file,
      subject: subject.trim(),
      errorMessage: '',
    }));

    // Trigger Dynamic Island notification
    triggerIsland({
      id: 'reviewer_gen',
      target: 'reviewer',
      type: 'generating',
      title: 'Gine-generate ang Reviewer...',
      subtitle: `${subject.trim()} (${questionCount} items)`,
    });

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
        setReviewerTask((prev) => ({
          ...prev,
          generating: false,
          isMinimized: false,
          generatedData: res.data.data,
        }));

        triggerIsland({
          id: 'reviewer_gen_done',
          target: 'reviewer',
          type: 'success',
          title: 'Reviewer Generated!',
          subtitle: `Handa na ang reviewer para sa ${subject.trim()}.`,
        });

        if (typeof onSuccess === 'function') {
          onSuccess(res.data.data);
        }
        handleClose();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to process file and generate questions. Please try again.';
      setError(msg);
      setReviewerTask((prev) => ({
        ...prev,
        generating: false,
        errorMessage: msg,
      }));
      triggerIsland({
        id: 'reviewer_gen_err',
        target: 'reviewer',
        type: 'error',
        title: 'Error sa Pag-generate',
        subtitle: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Minimize */}
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
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="I-minimize (Magpapatuloy sa background kahit lumipat ng page)"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs animate-in slide-in-from-top duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Error Generating Reviewer</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* File Drag / Drop area */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Upload Study Material (.pdf, .docx, .pptx, .txt)
            </label>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to change file
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl w-fit mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to browse notes, syllabus, or lecture slides
                  </p>
                  <p className="text-[10px] text-slate-400">Max file size: 25MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Category Toggle */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('quiz')}
                className={`py-3 rounded-2xl font-bold text-xs transition-all ${
                  category === 'quiz'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📝 Quiz (Quick Practice)
              </button>
              <button
                type="button"
                onClick={() => setCategory('exam')}
                className={`py-3 rounded-2xl font-bold text-xs transition-all ${
                  category === 'exam'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🎓 Major Exam Simulator
              </button>
            </div>
          </div>

          {/* Subject Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Subject / Course Name
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. IT101, Data Structures, Modern Biology"
              className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    questionCount === num
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Question Format */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Question Format
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'multiple_choice', label: '🔘 Multiple Choice Only' },
                { id: 'identification', label: '✍️ Identification Only' },
                { id: 'enumeration', label: '📋 Enumeration Only' },
                { id: 'mixed', label: '🔀 Mixed / Halo-halo' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setQuestionType(fmt.id)}
                  className={`p-3 rounded-2xl font-bold border transition-all text-left flex items-center ${
                    questionType === fmt.id
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Timer Setting</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHasTimer(!hasTimer)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  hasTimer
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {hasTimer ? 'Timer Active' : 'OFF TIME (Chill Mode)'}
              </button>
            </div>
          </div>

          {/* Footer Submit and Minimize buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleMinimize}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span>I-minimize habang nag-aantay</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Generating ({questionCount} Items)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Reviewer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialModal;
