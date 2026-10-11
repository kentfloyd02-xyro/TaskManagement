import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import AddFriendModal from '../components/chat/AddFriendModal';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import CollaborativeWhiteboard from '../components/chat/CollaborativeWhiteboard';
import UserAvatar from '../components/common/UserAvatar';
import {
  Users,
  MessageSquare,
  UserPlus,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  Shield,
  FileText,
  UserMinus,
  Sparkles,
  Download,
  AlertCircle,
  Pencil,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

const StudyHub = () => {
  const { user } = useAuth();

  // Navigation tab on left: 'chats' vs 'friends' vs 'requests'
  const [activeTab, setActiveTab] = useState('chats');

  // Rooms and Friends state
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Active chat room & messages
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Modals & Image Lightbox
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Search filter
  const [chatFilter, setChatFilter] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to resolve full backend attachment URL for images/files
  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseBackend = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    return `${baseBackend}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isImageFile = (fileName = '', fileType = '') => {
    if (fileType && fileType.startsWith('image/')) return true;
    return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial rooms, friends, and requests
  const loadInitialData = async () => {
    try {
      const [roomsRes, friendsRes, reqsRes] = await Promise.all([
        client.get('/chat/rooms'),
        client.get('/friends'),
        client.get('/friends/requests'),
      ]);

      if (roomsRes.data?.success) setRooms(roomsRes.data.rooms || []);
      if (friendsRes.data?.success) setFriends(friendsRes.data.friends || []);
      if (reqsRes.data?.success) {
        setIncomingRequests(reqsRes.data.incoming || []);
        setOutgoingRequests(reqsRes.data.outgoing || []);
      }
    } catch (err) {
      console.error('Error fetching chat data', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Socket room listener
  useEffect(() => {
    if (!activeRoom) return;

    // Join room channel
    socket.emit('join_room', activeRoom._id);

    const handleNewMessage = (newMessage) => {
      if (newMessage.chatRoom === activeRoom._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
      // Update room preview text
      setRooms((prev) =>
        prev.map((r) =>
          r._id === newMessage.chatRoom
            ? {
                ...r,
                lastMessage: {
                  text: newMessage.text || `[Sent a file: ${newMessage.fileName}]`,
                  sender: newMessage.sender?._id,
                  createdAt: newMessage.createdAt,
                },
              }
            : r
        )
      );
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_room', activeRoom._id);
      socket.off('new_message', handleNewMessage);
    };
  }, [activeRoom]);

  // Select Chat Room
  const handleSelectRoom = async (room) => {
    setActiveRoom(room);
    setLoadingMessages(true);
    try {
      const res = await client.get(`/chat/rooms/${room._id}/messages`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Open or create DM with Friend
  const handleStartDirectChat = async (friendId) => {
    try {
      const res = await client.post('/chat/direct', { friendId });
      if (res.data?.success) {
        const room = res.data.room;
        setActiveTab('chats');
        // Refresh rooms list
        const roomsRes = await client.get('/chat/rooms');
        if (roomsRes.data?.success) setRooms(roomsRes.data.rooms);
        handleSelectRoom(room);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept or Reject Request
  const handleRespondRequest = async (requestId, action) => {
    try {
      await client.put(`/friends/request/${requestId}/respond`, { action });
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Send Chat Message (Text and/or File)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !activeRoom || sendingMessage) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      if (inputText.trim()) formData.append('text', inputText.trim());
      if (selectedFile) formData.append('file', selectedFile);

      const res = await client.post(`/chat/rooms/${activeRoom._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setInputText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper for room title & display
  const getRoomTitle = (room) => {
    if (room.isGroup) return room.name;
    const other = room.members?.find((m) => m._id !== user?._id);
    return other?.name || 'Private Chat';
  };

  const filteredRooms = rooms.filter((r) =>
    getRoomTitle(r).toLowerCase().includes(chatFilter.toLowerCase())
  );

  return (
    <div className="h-[84vh] flex flex-col md:flex-row bg-white dark:bg-[#0b1329] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* LEFT COLUMN: NAVIGATION & CONTACTS */}
      <div className="w-full md:w-80 border-r border-slate-100 dark:border-slate-800/80 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                Study Hub & Chats
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Live Classmate Collaboration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAddFriendOpen(true)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Add Friend"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
              title="Create Study Group Chat"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons: Chats vs Friends vs Requests */}
        <div className="flex p-2 gap-1 border-b border-slate-100 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chats'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Chats ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Requests
            {incomingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input for Chats / Friends */}
        {activeTab === 'chats' && (
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={chatFilter}
                onChange={(e) => setChatFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* TAB CONTENT: CHATS LIST */}
        {activeTab === 'chats' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredRooms.map((room) => {
              const isActive = activeRoom?._id === room._id;
              const title = getRoomTitle(room);

              return (
                <div
                  key={room._id}
                  onClick={() => handleSelectRoom(room)}
                  className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : room.isGroup
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    {room.isGroup ? <Users className="w-5 h-5" /> : title.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-extrabold text-xs truncate">{title}</h4>
                      {room.lastMessage?.createdAt && (
                        <span
                          className={`text-[10px] ${
                            isActive ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {format(new Date(room.lastMessage.createdAt), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate ${
                        isActive ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {room.lastMessage?.text || 'Walang mensahe pa'}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Wala ka pang aktibong chat.</p>
                <button
                  onClick={() => setIsAddFriendOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Mag-add ng Friends
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: FRIENDS LIST */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <UserAvatar user={friend} size="sm" />
                  <div className="truncate">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {friend.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartDirectChat(friend._id)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Message
                </button>
              </div>
            ))}

            {friends.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Wala ka pang friends. Mag-click sa Add Friend sa taas!
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PENDING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Incoming Requests ({incomingRequests.length})
              </h4>
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar user={req.sender} size="sm" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {req.sender?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{req.sender?.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondRequest(req._id, 'accept')}
                        className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req._id, 'reject')}
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No pending requests</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: ACTIVE CHATROOM & MESSAGES */}
      <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/20">
        {activeRoom ? (
          <>
            {/* Room Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0b1329]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                  {activeRoom.isGroup ? <Users className="w-5 h-5" /> : getRoomTitle(activeRoom).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {getRoomTitle(activeRoom)}
                    </h3>
                    {activeRoom.isGroup && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {activeRoom.members?.length} Members
                      </span>
                    )}
                    {activeRoom.subjectTag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {activeRoom.subjectTag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {activeRoom.isGroup
                      ? `Creator: ${activeRoom.creator?.name || 'Admin'}`
                      : 'Private 1-on-1 Direct Message'}
                  </p>
                </div>
              </div>

              {/* Right Action: Open Shared Whiteboard for Group Study */}
              {activeRoom.isGroup && (
                <button
                  onClick={() => setIsWhiteboardOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Open Real-time Shared Whiteboard"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Shared Whiteboard</span>
                </button>
              )}
            </div>


            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMine = m.sender?._id === user?._id;
                return (
                  <div
                    key={m._id}
                    className={`flex gap-2.5 text-xs md:text-sm ${
                      isMine ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {!isMine && (
                      <UserAvatar user={m.sender} size="xs" className="shrink-0 mt-0.5" />
                    )}

                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl space-y-1 shadow-2xs ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {!isMine && activeRoom.isGroup && (
                        <p className="text-[10px] font-black text-indigo-500 pb-0.5">
                          {m.sender?.name}
                        </p>
                      )}

                      {/* Text */}
                      {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                      {/* File attachment / Image if present */}
                      {m.fileUrl && (
                        <div className="mt-1.5 space-y-1">
                          {isImageFile(m.fileName, m.fileType) ? (
                            <div className="relative group overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5 max-w-sm">
                              <img
                                src={getAttachmentUrl(m.fileUrl)}
                                alt={m.fileName || 'Shared image'}
                                className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-all active:scale-[0.99]"
                                onClick={() => setPreviewImage(getAttachmentUrl(m.fileUrl))}
                                loading="lazy"
                              />
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white">
                                <a
                                  href={getAttachmentUrl(m.fileUrl)}
                                  download={m.fileName || 'image.png'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3 h-3" /> Save
                                </a>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={getAttachmentUrl(m.fileUrl)}
                              download={m.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                                isMine
                                  ? 'bg-blue-700/70 border-blue-500 text-white hover:bg-blue-700'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                              <span className="text-xs font-bold truncate flex-1">{m.fileName}</span>
                              <Download className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          )}
                        </div>
                      )}

                      <div
                        className={`text-[9px] text-right font-medium pt-0.5 ${
                          isMine ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {format(new Date(m.createdAt), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview Badge */}
            {selectedFile && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-bold">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:text-rose-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b1329] flex items-center gap-2"
            >
              {/* File Upload Button */}
              <label className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 cursor-pointer transition-colors">
                <Paperclip className="w-5 h-5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message or share review notes..."
                className="flex-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />

              <button
                type="submit"
                disabled={sendingMessage || (!inputText.trim() && !selectedFile)}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-40 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 ring-8 ring-blue-500/10">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Pumili ng Chat o Mag-simula ng Usapan
            </h3>
            <p className="text-xs max-w-sm">
              Makipag-usap sa mga kaklase nang 1-on-1 o gumawa ng Group Chat para sa inyong subject group study!
            </p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onFriendUpdated={loadInitialData}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        friends={friends}
        onSuccess={(newRoom) => {
          loadInitialData();
          handleSelectRoom(newRoom);
        }}
      />

      {/* Real-time Collaborative Whiteboard Modal */}
      {activeRoom && (
        <CollaborativeWhiteboard
          isOpen={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
          roomId={activeRoom._id}
          roomName={getRoomTitle(activeRoom)}
        />
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged preview"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-colors"
              >
                <Download className="w-4 h-4" /> Download Full Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyHub;
