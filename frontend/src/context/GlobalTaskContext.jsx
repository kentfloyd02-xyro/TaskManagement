import React, { createContext, useContext, useState } from 'react';

const GlobalTaskContext = createContext();

export const GlobalTaskProvider = ({ children }) => {
  // Global Schedule OCR Scan state
  const [scheduleTask, setScheduleTask] = useState({
    isOpen: false,
    isMinimized: false,
    scanning: false,
    file: null,
    previewUrl: '',
    extractedSubjects: null,
    errorMessage: '',
    saveToTimetable: true,
  });

  // Global Reviewer Generator state
  const [reviewerTask, setReviewerTask] = useState({
    isOpen: false,
    isMinimized: false,
    generating: false,
    file: null,
    subject: '',
    category: 'quiz',
    questionCount: 10,
    questionType: 'multiple_choice',
    hasTimer: false,
    timerMinutes: 15,
    generatedData: null,
    errorMessage: '',
  });

  // Top dynamic island notification pill state
  const [islandNotification, setIslandNotification] = useState(null);

  const triggerIsland = (notif) => {
    setIslandNotification(notif);
    if (notif.type !== 'scanning' && notif.type !== 'generating') {
      setTimeout(() => {
        setIslandNotification((prev) => (prev?.id === notif.id ? null : prev));
      }, 7000);
    }
  };

  const dismissIsland = () => setIslandNotification(null);

  React.useEffect(() => {
    const handleIslandEvent = (e) => {
      if (e.detail) {
        triggerIsland(e.detail);
      }
    };
    window.addEventListener('student-planner-island-notif', handleIslandEvent);
    return () => window.removeEventListener('student-planner-island-notif', handleIslandEvent);
  }, []);

  return (
    <GlobalTaskContext.Provider
      value={{
        scheduleTask,
        setScheduleTask,
        reviewerTask,
        setReviewerTask,
        islandNotification,
        setIslandNotification,
        triggerIsland,
        dismissIsland,
      }}
    >
      {children}
    </GlobalTaskContext.Provider>
  );
};

export const useGlobalTasks = () => {
  const context = useContext(GlobalTaskContext);
  if (!context) {
    throw new Error('useGlobalTasks must be used within GlobalTaskProvider');
  }
  return context;
};
