import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickAddModal from '../tasks/QuickAddModal';
import AIChatbot from '../ai/AIChatbot';
import OfflineBanner from '../common/OfflineBanner';

const AppLayout = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    </div>
  );
};

export default AppLayout;
