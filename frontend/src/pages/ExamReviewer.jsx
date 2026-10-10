import React, { useState, useEffect } from 'react';
import defaultQuestions from '../data/defaultExamQuestions.json';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

const subjects = ['CC106', 'IAS101', 'PM101', 'ITE3', 'IM101', 'ITSP1C'];

const ExamReviewer = () => {
  // Master questions pool
  const [allQuestions, setAllQuestions] = useState(() => {
    const saved = localStorage.getItem('custom_exam_qs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultQuestions;
      }
    }
    return defaultQuestions;
  });

  const [selectedSubject, setSelectedSubject] = useState(() => localStorage.getItem('exam_selectedSubject') || null);
  const [activeQuestions, setActiveQuestions] = useState(() => {
    const saved = localStorage.getItem('exam_active_questions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => parseInt(localStorage.getItem('exam_currentQuestionIndex')) || 0);
  const [score, setScore] = useState(() => parseInt(localStorage.getItem('exam_score')) || 0);
  const [savedAnswers, setSavedAnswers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('exam_savedAnswers')) || {};
    } catch {
      return {};
    }
  });

  const [uploadFeedback, setUploadFeedback] = useState('');
  const [isExamCompleted, setIsExamCompleted] = useState(() => localStorage.getItem('exam_isCompleted') === 'true');
  const [shuffleMode, setShuffleMode] = useState(true);

  // Sync state with localStorage
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('exam_selectedSubject', selectedSubject);
      localStorage.setItem('exam_active_questions', JSON.stringify(activeQuestions));
      localStorage.setItem('exam_currentQuestionIndex', currentQuestionIndex);
      localStorage.setItem('exam_score', score);
      localStorage.setItem('exam_savedAnswers', JSON.stringify(savedAnswers));
      localStorage.setItem('exam_isCompleted', isExamCompleted);
    }
  }, [selectedSubject, activeQuestions, currentQuestionIndex, score, savedAnswers, isExamCompleted]);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleStartSubject = (index) => {
    const subj = subjects[index];
    const startIndex = index * 50;
    const rawSet = allQuestions.slice(startIndex, startIndex + 50);

    // Shuffle questions and their choices if shuffleMode is active
    let preparedSet = rawSet.map((item, originalIdx) => ({
      ...item,
      originalNumber: originalIdx + 1,
    }));

    if (shuffleMode) {
      preparedSet = shuffleArray(preparedSet).map((item) => {
        // Map choices with original indices to retain correct answer tracking
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
      });
    }

    setSelectedSubject(subj);
    setActiveQuestions(preparedSet);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSavedAnswers({});
    setIsExamCompleted(false);

    localStorage.setItem('exam_selectedSubject', subj);
    localStorage.setItem('exam_active_questions', JSON.stringify(preparedSet));
    localStorage.setItem('exam_currentQuestionIndex', 0);
    localStorage.setItem('exam_score', 0);
    localStorage.setItem('exam_savedAnswers', JSON.stringify({}));
    localStorage.setItem('exam_isCompleted', false);
  };

  const handleResetToMenu = () => {
    localStorage.removeItem('exam_selectedSubject');
    localStorage.removeItem('exam_active_questions');
    localStorage.removeItem('exam_currentQuestionIndex');
    localStorage.removeItem('exam_score');
    localStorage.removeItem('exam_savedAnswers');
    localStorage.removeItem('exam_isCompleted');
    setSelectedSubject(null);
    setActiveQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSavedAnswers({});
    setIsExamCompleted(false);
  };

  const handleSelectAnswer = (choiceIndex) => {
    if (savedAnswers[currentQuestionIndex] !== undefined) return;

    const q = activeQuestions[currentQuestionIndex];
    const isCorrect = choiceIndex === q.c;

    const newSavedAnswers = { ...savedAnswers, [currentQuestionIndex]: choiceIndex };
    setSavedAnswers(newSavedAnswers);

    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= activeQuestions.length) {
      setIsExamCompleted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    } else {
      setCurrentQuestionIndex(nextIdx);
    }
  };

  // Upload main.js or JSON questions file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        let parsedQs = null;

        if (file.name.endsWith('.json')) {
          parsedQs = JSON.parse(text);
        } else {
          // Parse JS file containing `const qs = [...]`
          const match = text.match(/const\s+qs\s*=\s*(\[[\s\S]*?\]);?/);
          if (match) {
            try {
              parsedQs = JSON.parse(match[1]);
            } catch {
              const parseFunc = new Function(`return ${match[1]};`);
              parsedQs = parseFunc();
            }
          } else {
            const parseFunc = new Function(`return ${text};`);
            parsedQs = parseFunc();
          }
        }

        if (Array.isArray(parsedQs) && parsedQs.length > 0 && parsedQs[0].q && parsedQs[0].a) {
          setAllQuestions(parsedQs);
          localStorage.setItem('custom_exam_qs', JSON.stringify(parsedQs));
          setUploadFeedback(`Successfully imported ${parsedQs.length} questions from ${file.name}!`);
          setTimeout(() => setUploadFeedback(''), 4000);
        } else {
          setUploadFeedback('Invalid format. File must contain array of { q, a, c } objects.');
        }
      } catch (err) {
        setUploadFeedback(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('custom_exam_qs');
    setAllQuestions(defaultQuestions);
    setUploadFeedback('Reset back to original exam template questions.');
    setTimeout(() => setUploadFeedback(''), 3000);
  };

  // Review Summary: collect mistakes
  const wrongQuestions = activeQuestions.filter((q, idx) => {
    const userChoice = savedAnswers[idx];
    return userChoice !== undefined && userChoice !== q.c;
  });

  const currentQ = activeQuestions[currentQuestionIndex] || { q: '', a: [], c: 0 };
  const currentSelectedAnswer = savedAnswers[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  const hasAnswered = currentSelectedAnswer !== undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <BookOpen className="w-5 h-5" />
            </span>
            Midterm Reviewer & Exam Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Interactive multiple-choice reviewer with original reactions, shuffle, & mistakes summary.
          </p>
        </div>

        {/* Upload Custom Answers & Questions */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload main.js / JSON</span>
            <input type="file" accept=".js,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleResetToDefault}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Reset to default questions"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {uploadFeedback && (
        <div className="p-3.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
          {uploadFeedback}
        </div>
      )}

      {/* VIEW 1: SUBJECT SELECTION SCREEN */}
      {!selectedSubject && (
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Select Exam Subject
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Choose a course subject to take the 50-item reviewer.
              </p>
            </div>

            {/* Shuffle toggle */}
            <button
              onClick={() => setShuffleMode(!shuffleMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                shuffleMode
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Order: {shuffleMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {subjects.map((subj, index) => (
              <button
                key={subj}
                onClick={() => handleStartSubject(index)}
                className={`group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white dark:hover:border-blue-500 transition-all text-left shadow-2xs hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] cursor-pointer card-interactive animate-fade-in-up stagger-${index + 1}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 group-hover:bg-white/20 group-hover:text-white text-slate-700 dark:text-slate-300 transition-colors">
                    50 Questions
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-white transition-colors">
                  {subj}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors mt-1 font-medium">
                  Reviewer Set {index + 1}
                </p>
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800 font-medium">
            Loaded database: {allQuestions.length} total questions ({subjects.length} subjects x 50 items)
          </div>
        </div>
      )}

      {/* VIEW 2: QUIZ COMPLETED SUMMARY SCREEN WITH MISTAKES BREAKDOWN */}
      {selectedSubject && isExamCompleted && (
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 ring-8 ring-emerald-500/10 mb-1">
              <Award className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Exam Complete
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Subject: {selectedSubject}
              </h2>
            </div>

            <div className="max-w-xs mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Final Score</p>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {score} <span className="text-xl font-bold text-slate-400">/ 50</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round((score / 50) * 100)}% Overall Accuracy
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartSubject(subjects.indexOf(selectedSubject))}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Retake {selectedSubject}
              </button>
              <button
                onClick={handleResetToMenu}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
              >
                Choose Another Subject
              </button>
            </div>
          </div>

          {/* Review Summary Breakdown of Mistakes */}
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
                  const userChoiceIdx = savedAnswers[activeQuestions.indexOf(q)];
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2 text-left"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        <strong>Q:</strong> {q.q}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-medium">
                          <span className="font-bold">Your answer:</span> {q.a[userChoiceIdx] || 'None'}
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold">
                          <span>Correct answer:</span> {String.fromCharCode(65 + q.c)}. {q.a[q.c]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE EXAM QUESTION INTERFACE */}
      {selectedSubject && !isExamCompleted && (
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm space-y-6">
          {/* Top Bar with Subject, Score, and Back Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={handleResetToMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {selectedSubject}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                Score: <strong className="text-blue-600 dark:text-blue-400">{score}</strong> / 50
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Question {questionNumber} of 50
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {50 - questionNumber} items remaining
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.q}
            </h2>
          </div>

          {/* Choices Buttons */}
          <div className="space-y-3">
            {currentQ.a?.map((choice, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = currentSelectedAnswer === index;
              const isCorrectAnswer = index === currentQ.c;

              let buttonStyle =
                'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-blue-50/70 dark:hover:bg-slate-750 hover:border-blue-400';

              if (hasAnswered) {
                if (isCorrectAnswer) {
                  buttonStyle = 'bg-emerald-500 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonStyle = 'bg-rose-500 border-rose-500 text-white font-bold shadow-md shadow-rose-500/25';
                } else {
                  buttonStyle = 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800 opacity-60 text-slate-400';
                }
              }

              return (
                <button
                  key={index}
                  disabled={hasAnswered}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer btn-interactive ${buttonStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
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

          {/* Feedback Banner retaining exact original reactions */}
          {hasAnswered && (
            <div>
              {currentSelectedAnswer === currentQ.c ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm flex items-center gap-2 animate-scale-in shadow-sm shadow-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>GALING AH, KUPAL!</span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-extrabold text-sm flex items-start gap-2 animate-wiggle shadow-sm shadow-rose-500/10">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p>ENGKK. ENGOT! ETO YUNG TAMA BOBO:</p>
                    <p className="mt-1 text-xs font-bold text-rose-900 dark:text-rose-100">
                      {String.fromCharCode(65 + currentQ.c)}. {currentQ.a[currentQ.c]}
                    </p>
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
                <span>{questionNumber >= 50 ? 'Finish Exam' : 'Next Question'}</span>
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
