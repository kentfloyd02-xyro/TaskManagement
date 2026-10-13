import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickAddModal from '../tasks/QuickAddModal';
import AIChatbot from '../ai/AIChatbot';
import OfflineBanner from '../common/OfflineBanner';
import DynamicIslandNotification from '../common/DynamicIslandNotification';
import FloatingTaskPills from '../common/FloatingTaskPills';
import ScheduleScanModal from '../subjects/ScheduleScanModal';
import UploadMaterialModal from '../reviewer/UploadMaterialModal';
import ClassAlarmModal from '../schedule/ClassAlarmModal';
import { useGlobalTasks } from '../../context/GlobalTaskContext';

const AppLayout = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const {
    scheduleTask,
    setScheduleTask,
    reviewerTask,
    setReviewerTask,
    activeAlarm,
    handleStopAlarm,
    handleSnoozeAlarm,
  } = useGlobalTasks();

  const handleTaskCreated = () => {
    setIsQuickAddOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      <Sidebar onQuickAddClick={() => setIsQuickAddOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        <OfflineBanner />
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshTrigger, triggerRefresh: () => setRefreshTrigger((p) => p + 1) }} />
        </div>
      </main>

      {/* Global Quick Add Modal */}
      {isQuickAddOpen && (
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onSuccess={handleTaskCreated}
        />
      )}

      {/* Floating & Expandable AI Study Chatbot */}
      <AIChatbot />

      {/* Global Dynamic Island Notification (Top Center) */}
      <DynamicIslandNotification />

      {/* Global Floating Minimized Task Pills (Bottom Right) */}
      <FloatingTaskPills />

      {/* Global Schedule Auto-Scan Modal */}
      <ScheduleScanModal
        isOpen={scheduleTask.isOpen && !scheduleTask.isMinimized}
        onClose={() => setScheduleTask((prev) => ({ ...prev, isOpen: false, isMinimized: false }))}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />

      {/* Global Exam Reviewer Generator Modal */}
      <UploadMaterialModal
        isOpen={reviewerTask.isOpen && !reviewerTask.isMinimized}
        onClose={() => setReviewerTask((prev) => ({ ...prev, isOpen: false, isMinimized: false }))}
        initialCategory={reviewerTask.category || 'quiz'}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />

      {/* Global High-Priority Emergency Class Alarm Modal */}
      {activeAlarm && (
        <ClassAlarmModal
          alarm={activeAlarm}
          onStop={handleStopAlarm}
          onSnooze={handleSnoozeAlarm}
        />
      )}
    </div>
  );
};

export default AppLayout;
