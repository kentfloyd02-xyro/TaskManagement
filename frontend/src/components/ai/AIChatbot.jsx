import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Kumusta ${user?.name || 'kasama'}! Ako ang iyong AI Study Assistant. Maaari mo akong tanungin tungkol sa iyong mga reviewer, mahihirap na lessons, essay guides, o kahit anong gusto mong malaman. Paano kita matutulungan ngayon?`,
    },
  ]);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiUsage, setAiUsage] = useState({
    isSuperAdmin: false,
    unlimited: false,
    remaining: 50,
    usedToday: 0,
    dailyLimit: 50,
  });

  const messagesEndRef = useRef(null);

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'kentfloyd02@gmail.com' || user?.role === 'admin';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Fetch token usage and conversations
  const fetchUsageAndConversations = async () => {
    try {
      const [usageRes, convsRes] = await Promise.all([
        client.get('/chatbot/usage'),
        client.get('/chatbot/conversations'),
      ]);
      if (usageRes.data?.success) {
        setAiUsage(usageRes.data.data);
      }
      if (convsRes.data?.success) {
        setConversations(convsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load chatbot data', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsageAndConversations();
    }
  }, [user, isOpen]);

  const handleSelectConversation = async (convId) => {
    try {
      setLoading(true);
      const res = await client.get(`/chatbot/conversations/${convId}`);
      if (res.data?.success) {
        setActiveConvId(res.data.data._id);
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([
      {
        role: 'assistant',
        content: `Handa na ako sa bagong tanong mo! Anong lesson o topic ang pag-uusapan natin?`,
      },
    ]);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await client.delete(`/chatbot/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg || loading) return;

    if (!isSuperAdmin && aiUsage.remaining <= 0) {
      alert('Naubos mo na ang iyong 50 AI tokens para sa araw na ito. Mag-rereset ito bukas!');
      return;
    }

    const optimisticMsg = { role: 'user', content: cleanMsg };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessage('');
    setLoading(true);

    try {
      const res = await client.post('/chatbot/message', {
        message: cleanMsg,
        conversationId: activeConvId,
      });

      if (res.data?.success) {
        const data = res.data.data;
        setActiveConvId(data.conversationId);
        setMessages(data.messages);

        if (data.usage) {
          setAiUsage((prev) => ({
            ...prev,
            remaining: data.usage.remaining,
            usedToday: data.usage.usedToday,
            unlimited: data.usage.unlimited,
          }));
        }

        // Refresh conversation sidebar list
        const convsRes = await client.get('/chatbot/conversations');
        if (convsRes.data?.success) {
          setConversations(convsRes.data.data || []);
        }
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || 'Paumanhin, nagkaroon ng problema sa pakikipag-ugnayan sa AI.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group cursor-pointer"
          title="Open AI Study Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900"></span>
          </div>
          <span className="text-sm font-bold pr-1 hidden sm:inline">AI Study Assistant</span>
        </button>
      )}

      {/* Chat Window / Fullscreen Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-2xl ${
            isExpanded
              ? 'inset-2 sm:inset-6 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[88vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60 rounded-t-3xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Study Assistant AI
                  </h3>
                  {isSuperAdmin ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      ADMIN • UNLI TOKENS
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        aiUsage.remaining > 10
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {aiUsage.remaining}/50 Tokens Left
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Gemini 3.8 Flash • Powered AI Tutor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors hidden sm:block"
                title={isExpanded ? 'Restore size' : 'Expand full-screen'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body (Split into History sidebar if expanded) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Expanded Sidebar for Conversations History */}
            {isExpanded && (
              <div className="w-64 border-r border-slate-100 dark:border-slate-800/80 p-3 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  onClick={handleNewChat}
                  className="w-full mb-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>

                <p className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Past Chats
                </p>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {conversations.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectConversation(c._id)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                        activeConvId === c._id
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">{c.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {conversations.length === 0 && (
                    <p className="text-center text-[11px] text-slate-400 py-6">
                      No saved conversations yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Messages Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, index) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 text-xs md:text-sm ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div
                        className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/15'
                            : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3 text-xs">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="font-medium">Nag-iisip ang AI Assistant...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b1329] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    !isSuperAdmin && aiUsage.remaining <= 0
                      ? 'Naabot mo na ang 50 daily token limit...'
                      : 'Magtanong tungkol sa iyong subject, quiz, o reviewers...'
                  }
                  disabled={loading || (!isSuperAdmin && aiUsage.remaining <= 0)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={loading || !message.trim() || (!isSuperAdmin && aiUsage.remaining <= 0)}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-40 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
