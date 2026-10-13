import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalTasks } from '../context/GlobalTaskContext';
import UserAvatar from '../components/common/UserAvatar';
import {
  BookOpen,
  Upload,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCode,
  Award,
  ChevronLeft,
  Shuffle,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Trash2,
  Calendar,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PROGRESS_KEY_PREFIX = 'student_planner_exam_prog_';

const getSavedProgress = (id) => {
  if (!id) return null;
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveProgress = (id, data) => {
  if (!id) return;
  try {
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${id}`, JSON.stringify(data));
  } catch (e) {}
};

const clearSavedProgress = (id) => {
  if (!id) return;
  try {
    localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${id}`);
  } catch (e) {}
};

const ExamReviewer = () => {
  const { user } = useAuth();
  // Category Tab: 'quiz' | 'exam'
  const [activeCategory, setActiveCategory] = useState('quiz');

  // Stored custom reviewers from MongoDB
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const outletContext = useOutletContext();
  const { reviewerTask, setReviewerTask } = useGlobalTasks();

  // Active review session
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [identificationInput, setIdentificationInput] = useState('');
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(true);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);

  // Load saved materials from backend
  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const res = await client.get(`/reviewer/materials?category=${activeCategory}`);
      if (res.data?.success) {
        setMaterials(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch materials', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchMaterials();

    const handleSyncUpdate = () => fetchMaterials();
    window.addEventListener('student-planner-data-updated', handleSyncUpdate);
    window.addEventListener('student-planner-full-sync-complete', handleSyncUpdate);

    return () => {
      window.removeEventListener('student-planner-data-updated', handleSyncUpdate);
      window.removeEventListener('student-planner-full-sync-complete', handleSyncUpdate);
    };
  }, [activeCategory, outletContext?.refreshTrigger]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSessionCompleted || !activeMaterial) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSessionCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSessionCompleted, activeMaterial]);

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start Custom Generated Material from DB with Progress Preservation
  const handleStartCustomMaterial = (mat, restart = false) => {
    if (!mat) return;
    const existing = !restart ? getSavedProgress(mat._id) : null;

    if (existing && existing.currentQuestionIndex !== undefined) {
      // Resume existing session exactly where user stopped!
      setActiveMaterial(existing.material || mat);
      setCurrentQuestionIndex(existing.currentQuestionIndex || 0);
      setScore(existing.score || 0);
      setSavedAnswers(existing.savedAnswers || {});
      setIdentificationInput(existing.identificationInput || '');
      setIsSessionCompleted(false);
      setTimeLeft(
        existing.timeLeft !== undefined
          ? existing.timeLeft
          : mat.hasTimer && mat.timerDurationSeconds
          ? mat.timerDurationSeconds
          : null
      );
      return;
    }

    // Start fresh
    let preparedQs = [...mat.questions];
    if (shuffleMode) {
      preparedQs = shuffleArray(preparedQs).map((item) => {
        if (item.type === 'multiple_choice' && item.a?.length) {
          const mappedChoices = item.a.map((choiceText, cIdx) => ({
            text: choiceText,
            isCorrect: cIdx === item.c,
          }));
          const shuffledChoices = shuffleArray(mappedChoices);
          const newCorrectIndex = shuffledChoices.findIndex((c) => c.isCorrect);
          return {
            ...item,
            a: shuffledChoices.map((c) => c.text),
            c: newCorrectIndex,
          };
        }
        return item;
      });
    }

    setActiveMaterial({
      ...mat,
      questions: preparedQs,
    });
    setCurrentQuestionIndex(0);
    setScore(0);
    setSavedAnswers({});
    setIdentificationInput('');
    setIsSessionCompleted(false);
    setTimeLeft(mat.hasTimer && mat.timerDurationSeconds ? mat.timerDurationSeconds : null);
    if (mat._id) {
      clearSavedProgress(mat._id);
    }
  };

  // Continuously persist active quiz/exam session so progress is NEVER lost
  useEffect(() => {
    if (activeMaterial?._id && !isSessionCompleted) {
      saveProgress(activeMaterial._id, {
        material: activeMaterial,
        currentQuestionIndex,
        savedAnswers,
        score,
        identificationInput,
        timeLeft,
        lastUpdated: Date.now(),
      });
    }
  }, [activeMaterial, currentQuestionIndex, savedAnswers, score, timeLeft, identificationInput, isSessionCompleted]);

  // Automatically launch generated reviewer when background creation completes
  useEffect(() => {
    if (reviewerTask.generatedData) {
      if (reviewerTask.generatedData.category && reviewerTask.generatedData.category !== activeCategory) {
        setActiveCategory(reviewerTask.generatedData.category);
      }
      fetchMaterials();
      handleStartCustomMaterial(reviewerTask.generatedData, true);
      setReviewerTask((prev) => ({
        ...prev,
        generatedData: null,
        isOpen: false,
        isMinimized: false,
      }));
    }
  }, [reviewerTask.generatedData]);

  // Delete material from DB
  const handleDeleteMaterial = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Sigurado ka bang nais mong burahin ang reviewer na ito?')) return;
    try {
      await client.delete(`/reviewer/materials/${id}`);
      clearSavedProgress(id);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Reset or discard in-progress session back to Question 1
  const handleDiscardProgress = (e, matId) => {
    e.stopPropagation();
    if (window.confirm('Nais mo bang i-reset ang exam na ito at magsimula muli sa Question 1?')) {
      clearSavedProgress(matId);
      fetchMaterials();
    }
  };

  // Back to Menu: keeps saved progress intact in localStorage
  const handleResetToMenu = () => {
    setActiveMaterial(null);
    setIsSessionCompleted(false);
    fetchMaterials();
  };

  // Answer multiple choice
  const handleSelectChoice = (choiceIndex) => {
    if (savedAnswers[currentQuestionIndex] !== undefined) return;

    const q = activeMaterial.questions[currentQuestionIndex];
    const isCorrect = choiceIndex === q.c;

    setSavedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: { choiceIndex, isCorrect } }));

    if (isCorrect) {
      setScore((s) => s + 1);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
      } catch (e) {}
    }
  };

  // Submit identification answer
  const handleSubmitIdentification = (e) => {
    e?.preventDefault();
    if (savedAnswers[currentQuestionIndex] !== undefined) return;

    const q = activeMaterial.questions[currentQuestionIndex];
    const userText = identificationInput.trim().toLowerCase();
    const correctText = (q.expectedAnswer || '').trim().toLowerCase();

    const isCorrect =
      userText.length > 0 &&
      (userText === correctText ||
        userText.includes(correctText) ||
        correctText.includes(userText));

    setSavedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: { textAnswer: identificationInput, isCorrect },
    }));

    if (isCorrect) {
      setScore((s) => s + 1);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
      } catch (e) {}
    }
  };

  // Next Question
  const handleNextQuestion = async () => {
    setIdentificationInput('');
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= activeMaterial.questions.length) {
      setIsSessionCompleted(true);
      if (activeMaterial._id) {
        clearSavedProgress(activeMaterial._id);
        try {
          await client.put(`/reviewer/materials/${activeMaterial._id}/score`, { score });
        } catch (e) {}
      }
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    } else {
      setCurrentQuestionIndex(nextIdx);
    }
  };

  // Helper formatting for timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const currentQ = activeMaterial?.questions?.[currentQuestionIndex] || {
    q: '',
    type: 'multiple_choice',
    a: [],
    c: 0,
  };
  const currentAnswerRecord = savedAnswers[currentQuestionIndex];
  const hasAnswered = currentAnswerRecord !== undefined;
  const questionNumber = currentQuestionIndex + 1;
  const totalQuestions = activeMaterial?.questions?.length || 0;

  // Mistakes review
  const wrongQuestions = activeMaterial
    ? activeMaterial.questions.filter((q, idx) => {
        const record = savedAnswers[idx];
        return record !== undefined && !record.isCorrect;
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <BookOpen className="w-5 h-5" />
            </span>
            AI Smart Reviewer & Exam Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Generate customized Quizzes & Major Exams from your slides, PDF, & Word notes.
          </p>
        </div>

        {/* Upload File Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setReviewerTask((prev) => ({
                ...prev,
                isOpen: true,
                isMinimized: false,
                category: activeCategory,
              }))
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File & Generate</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: HOME / SELECTION MENU */}
      {!activeMaterial && (
        <div className="space-y-6">
          {/* Active In-Progress Exam Resume Banner */}
          {(() => {
            const inProgMat = materials.find((m) => {
              const p = getSavedProgress(m._id);
              return p && p.currentQuestionIndex !== undefined;
            });
            if (!inProgMat) return null;
            const p = getSavedProgress(inProgMat._id);

            return (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                      May In-Progress Exam
                    </span>
                    <span className="text-xs text-blue-100 font-bold">
                      Nakahinto sa Question {p.currentQuestionIndex + 1} of {inProgMat.questionCount}
                    </span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">{inProgMat.subject}</h3>
                  <p className="text-xs text-blue-100/90 truncate max-w-lg">
                    {inProgMat.title} • Kasalukuyang Score: {p.score} • Oras:{' '}
                    {p.timeLeft !== null ? formatTime(p.timeLeft) : 'Off-time'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartCustomMaterial(inProgMat)}
                    className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Ipagpatuloy (Question {p.currentQuestionIndex + 1})</span>
                  </button>
                  <button
                    onClick={(e) => handleDiscardProgress(e, inProgMat._id)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Ulitin at magsimula sa Question 1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Category Tabs: QUIZ vs EXAM */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 max-w-sm">
            <button
              onClick={() => setActiveCategory('quiz')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeCategory === 'quiz'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📝 Quizzes
            </button>
            <button
              onClick={() => setActiveCategory('exam')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeCategory === 'exam'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎓 Major Exams
            </button>
          </div>

          {/* AI Generated Reviewers Section */}
          <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Aking {activeCategory === 'quiz' ? 'Quizzes' : 'Major Exams'}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                    {materials.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Lahat ng na-generate mong {activeCategory === 'quiz' ? 'quiz' : 'major exam'} reviewers mula sa iyong files.
                </p>
              </div>

              {/* Shuffle Order Toggle */}
              <button
                onClick={() => setShuffleMode(!shuffleMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  shuffleMode
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle: {shuffleMode ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {loadingMaterials ? (
              <p className="text-center text-xs text-slate-400 py-6">Loading materials...</p>
            ) : materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {materials.map((mat) => {
                  const progress = getSavedProgress(mat._id);
                  const isInProgress = progress && progress.currentQuestionIndex !== undefined;

                  return (
                    <div
                      key={mat._id}
                      onClick={() => handleStartCustomMaterial(mat)}
                      className={`group relative p-5 rounded-2xl border transition-all text-left shadow-2xs hover:shadow-lg cursor-pointer ${
                        isInProgress
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 hover:border-blue-500 shadow-blue-500/10'
                          : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:border-blue-400 dark:hover:border-blue-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                            {mat.questionCount} Items
                          </span>
                          {isInProgress && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 animate-pulse">
                              <span>Huminto sa Q{progress.currentQuestionIndex + 1}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isInProgress && (
                            <button
                              onClick={(e) => handleDiscardProgress(e, mat._id)}
                              className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="I-reset pabalik sa Question 1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteMaterial(e, mat._id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Delete reviewer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {mat.subject}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {mat.title}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {isInProgress ? (
                            <span className="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current" />
                              <span>Ipagpatuloy ang Exam</span>
                            </span>
                          ) : mat.hasTimer ? (
                            `⏱️ ${mat.timerDurationSeconds / 60}m`
                          ) : (
                            '🌱 Off-time'
                          )}
                        </span>
                        {isInProgress ? (
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            Score: {progress.score}
                          </span>
                        ) : (
                          mat.lastScore !== null && (
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              Best: {mat.lastScore}/{mat.questionCount}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Wala ka pang na-generate na {activeCategory === 'quiz' ? 'Quiz' : 'Major Exam'}.
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Mag-upload ng PDF, DOCX, PPTX o notes at awtomatikong gagawa ang AI ng customized items para sa iyo.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setReviewerTask((prev) => ({
                      ...prev,
                      isOpen: true,
                      isMinimized: false,
                      category: activeCategory,
                    }))
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Mag-upload at Gumawa Ngayon</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: COMPLETED RESULTS SUMMARY */}
      {activeMaterial && isSessionCompleted && (
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <UserAvatar user={user} size="xl" className="ring-6 ring-blue-500/20 shadow-xl" />
              <div className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-emerald-500 text-white shadow-md">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {activeMaterial.category?.toUpperCase() || 'SESSION'} COMPLETED • {user?.name || 'Student'}
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {activeMaterial.subject} - {activeMaterial.title}
              </h2>
            </div>

            <div className="max-w-xs mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Final Score</p>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {score} <span className="text-xl font-bold text-slate-400">/ {totalQuestions}</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round((score / totalQuestions) * 100)}% Accuracy
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartCustomMaterial(activeMaterial, true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Retake Reviewer
              </button>
              <button
                onClick={handleResetToMenu}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
              >
                Back to Reviewer Menu
              </button>
            </div>
          </div>

          {/* Mistakes Breakdown */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Mistakes Review Breakdown ({wrongQuestions.length} items)
              </h3>
              {wrongQuestions.length === 0 && (
                <span className="text-xs font-bold text-emerald-600">Perfect Score! No mistakes! 🎉</span>
              )}
            </div>

            {wrongQuestions.length > 0 && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {wrongQuestions.map((q, idx) => {
                  const record = savedAnswers[activeMaterial.questions.indexOf(q)] || {};
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2 text-left"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        <strong>Q:</strong> {q.q}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-medium">
                          <span className="font-bold">Your answer:</span>{' '}
                          {q.type === 'multiple_choice'
                            ? q.a?.[record.choiceIndex] || 'None'
                            : record.textAnswer || 'None'}
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold">
                          <span>Correct answer:</span>{' '}
                          {q.type === 'multiple_choice'
                            ? `${String.fromCharCode(65 + q.c)}. ${q.a?.[q.c]}`
                            : q.expectedAnswer || q.expectedItems?.join(', ')}
                        </div>
                      </div>
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE TEST QUESTION INTERFACE */}
      {activeMaterial && !isSessionCompleted && (
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm space-y-6">
          {/* Top Bar with Subject, Timer, Score, and Back */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={handleResetToMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>

            <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black border ${
                    timeLeft < 60
                      ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}
              <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {activeMaterial.subject}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                Score: <strong className="text-blue-600 dark:text-blue-400">{score}</strong> / {totalQuestions}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Question {questionNumber} of {totalQuestions} ({currentQ.type.replace('_', ' ')})
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {totalQuestions - questionNumber} items remaining
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.q}
            </h2>
          </div>

          {/* Multiple Choice Format */}
          {currentQ.type === 'multiple_choice' && currentQ.a && (
            <div className="space-y-3">
              {currentQ.a.map((choice, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = currentAnswerRecord?.choiceIndex === index;
                const isCorrectAnswer = index === currentQ.c;

                let buttonStyle =
                  'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-blue-50/70 dark:hover:bg-slate-750 hover:border-blue-400';

                if (hasAnswered) {
                  if (isCorrectAnswer) {
                    buttonStyle =
                      'bg-emerald-500 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25';
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonStyle =
                      'bg-rose-500 border-rose-500 text-white font-bold shadow-md shadow-rose-500/25';
                  } else {
                    buttonStyle =
                      'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800 opacity-60 text-slate-400';
                  }
                }

                return (
                  <button
                    key={index}
                    disabled={hasAnswered}
                    onClick={() => handleSelectChoice(index)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${buttonStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        hasAnswered && (isCorrectAnswer || isSelected)
                          ? 'bg-white/20 text-white scale-110'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-medium pt-0.5 leading-snug">{choice}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Identification / Enumeration Format */}
          {(currentQ.type === 'identification' || currentQ.type === 'enumeration') && (
            <form onSubmit={handleSubmitIdentification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Type your answer:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={hasAnswered}
                    value={identificationInput}
                    onChange={(e) => setIdentificationInput(e.target.value)}
                    placeholder="Ilagay ang iyong sagot dito..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                  {!hasAnswered && (
                    <button
                      type="submit"
                      disabled={!identificationInput.trim()}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Feedback Banner retaining exact original reactions */}
          {hasAnswered && (
            <div>
              {currentAnswerRecord.isCorrect ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm flex items-center gap-2 animate-scale-in shadow-sm shadow-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p>GALING AH, KUPAL!</p>
                    {currentQ.explanation && (
                      <p className="text-xs font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                        💡 {currentQ.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-extrabold text-sm flex items-start gap-2 animate-wiggle shadow-sm shadow-rose-500/10">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p>ENGKK. ENGOT! ETO YUNG TAMA BOBO:</p>
                    <p className="mt-1 text-xs font-bold text-rose-900 dark:text-rose-100">
                      {currentQ.type === 'multiple_choice'
                        ? `${String.fromCharCode(65 + currentQ.c)}. ${currentQ.a[currentQ.c]}`
                        : currentQ.expectedAnswer || currentQ.expectedItems?.join(', ')}
                    </p>
                    {currentQ.explanation && (
                      <p className="text-xs font-normal text-rose-700 dark:text-rose-300 mt-1">
                        💡 {currentQ.explanation}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {hasAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>{questionNumber >= totalQuestions ? 'Finish Exam' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ExamReviewer;
