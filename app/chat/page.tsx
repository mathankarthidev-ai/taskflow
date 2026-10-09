'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ChatChannel, ChatMessage, User } from '@/types';
import {
  getStoredChannels,
  getStoredMessages,
  sendChatMessage,
  deleteChatMessage,
  clearChannelMessages,
  clearAllStoredMessages,
  createDirectChannel,
} from '@/lib/chat-db';
import { playNotificationChime } from '@/lib/audio-chime';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  MessageSquare,
  Send,
  Paperclip,
  Link as LinkIcon,
  Plus,
  Users,
  Building2,
  Shield,
  FileText,
  ExternalLink,
  Search,
  CheckCircle,
  Globe,
  UserCheck,
  Trash2,
  Volume2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeamChatPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('channel_all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form State
  const [messageText, setMessageText] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [showLinkField, setShowLinkField] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; size?: string; type?: string } | null>(null);

  // Submission lock & window instance ID to prevent double paste
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const windowInstanceIdRef = useRef<string>(
    typeof window !== 'undefined' ? `win_${Math.random().toString(36).slice(2, 9)}` : 'srv'
  );

  // Direct DM Modal State
  const [isNewDmModalOpen, setIsNewDmModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  useEffect(() => {
    fetchAllUsersAction().then(setUsers);
    const loadedChannels = getStoredChannels();
    setChannels(loadedChannels);
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      const msgs = getStoredMessages(activeChannelId);
      setMessages(msgs);
    }
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time synchronization & cross-tab events listener
  useEffect(() => {
    const handleRemoteMessage = (e: any) => {
      const { channelId, message, originWindowId } = e.detail || {};

      // Check 1: If event originated from this exact window instance, ignore it!
      // (handleSendMessage already added it locally)
      if (originWindowId && originWindowId === windowInstanceIdRef.current) {
        return;
      }

      if (channelId === activeChannelId && message) {
        // Check 2: Only append if message is from another user/tab to prevent double paste
        if (message.senderId !== currentUser?._id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            // Check 3: Drop identical text from same sender within 2000ms
            const last = prev[prev.length - 1];
            if (
              last &&
              last.senderId === message.senderId &&
              last.text === message.text &&
              Math.abs(new Date(message.createdAt).getTime() - new Date(last.createdAt).getTime()) < 2000
            ) {
              return prev;
            }
            return [...prev, message];
          });
          playNotificationChime();
        }
      }
      setChannels(getStoredChannels());
    };

    const handleDeletedMessage = (e: any) => {
      const { channelId, messageId } = e.detail || {};
      if (channelId === activeChannelId && messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
      setChannels(getStoredChannels());
    };

    window.addEventListener('taskflow_chat_message_sent', handleRemoteMessage);
    window.addEventListener('taskflow_chat_message_deleted', handleDeletedMessage);
    return () => {
      window.removeEventListener('taskflow_chat_message_sent', handleRemoteMessage);
      window.removeEventListener('taskflow_chat_message_deleted', handleDeletedMessage);
    };
  }, [activeChannelId, currentUser?._id]);

  if (!currentUser) return null;

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      toast.error(`File "${file.name}" exceeds 5MB limit!`, {
        description: `Selected file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const url = URL.createObjectURL(file);
    setAttachedFile({
      name: file.name,
      url,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
    });
    toast.success(`Attached file "${file.name}" (< 5MB limit verified)`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    // Check 1: Guard against rapid double click or multiple submit events
    if (isSendingRef.current) return;

    const textToSend = messageText.trim();
    const fileToSend = attachedFile;
    const linkToSend = linkInput.trim();

    if (!textToSend && !fileToSend && !linkToSend) {
      toast.error('Please enter a message, link, or attach a file');
      return;
    }

    // Check 2: Immediately lock submission and clear form inputs so no second submit can grab the text
    isSendingRef.current = true;
    setIsSending(true);
    setMessageText('');
    setLinkInput('');
    setShowLinkField(false);
    setAttachedFile(null);

    try {
      const created = sendChatMessage(
        activeChannelId,
        {
          _id: currentUser._id,
          name: currentUser.name,
          role: currentUser.role,
          team: currentUser.team,
          avatar: currentUser.avatar,
        },
        textToSend,
        fileToSend || undefined,
        linkToSend || undefined,
        windowInstanceIdRef.current
      );

      // Audio chime sound on send
      playNotificationChime();

      // Notify all via In-App Notification Store
      useNotificationStore.getState().addNotification({
        type: 'chat_message',
        category: activeChannel?.name || 'Group Chat',
        title: `💬 New Message in ${activeChannel?.name || 'Group Chat'}`,
        text: `${currentUser.name}: ${textToSend || (fileToSend ? `Attached: ${fileToSend.name}` : 'Shared a link')}`,
        color: 'bg-teal-500',
        link: '/chat',
      });

      // Check 3: Add to messages state with deduplication by ID and recent identical content
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        const last = prev[prev.length - 1];
        if (
          last &&
          last.senderId === created.senderId &&
          last.text === created.text &&
          Math.abs(new Date(created.createdAt).getTime() - new Date(last.createdAt).getTime()) < 2000
        ) {
          return prev;
        }
        return [...prev, created];
      });

      setChannels(getStoredChannels());
      toast.success(`Message broadcasted to ${activeChannel?.name || 'group'}`, { icon: '🔔' });
    } finally {
      // Cooldown debounce window (400ms) before unlocking send button
      setTimeout(() => {
        isSendingRef.current = false;
        setIsSending(false);
      }, 400);
    }
  };

  // Admin delete message action
  const handleDeleteMessage = (msgId: string) => {
    const success = deleteChatMessage(activeChannelId, msgId);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setChannels(getStoredChannels());
      toast.success('Message deleted from group');
    }
  };

  // Admin clear current channel messages
  const handleClearGroup = () => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to delete all messages in "${activeChannel?.name}"? This action cannot be undone.`)) {
      clearChannelMessages(activeChannelId);
      setMessages([]);
      setChannels(getStoredChannels());
      toast.success(`All messages removed from ${activeChannel?.name}`);
    }
  };

  // Admin clear all messages across all channels
  const handleClearAllChats = () => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently clear all messages across ALL groups and direct chats?')) {
      clearAllStoredMessages();
      setMessages([]);
      setChannels(getStoredChannels());
      toast.success('All chat message history has been wiped.');
    }
  };

  const handleStartDirectChat = (targetUser: User) => {
    const dmChannel = createDirectChannel(currentUser._id, targetUser);
    setChannels(getStoredChannels());
    setActiveChannelId(dmChannel.id);
    setIsNewDmModalOpen(false);
    toast.success(`Direct conversation opened with ${targetUser.name}`);
  };

  // Filter channels relevant to user
  const allGroupChannel = channels.filter((c) => c.scope === 'all');
  const teamGroupChannels = channels.filter(
    (c) => c.scope === 'team' && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || c.team === currentUser.team)
  );
  const directChannels = channels.filter((c) => c.scope === 'direct');

  const filteredUsersForDm = users.filter(
    (u) =>
      u._id !== currentUser._id &&
      (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.team.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-4 p-4 max-w-7xl mx-auto">
      {/* Left Sidebar - Groups & Channels */}
      <div className="w-full md:w-80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card flex flex-col shrink-0 overflow-hidden shadow-sm">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-500" />
            <h2 className="font-extrabold text-sm text-foreground tracking-tight">Team Messaging</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => setIsNewDmModalOpen(true)}
              className="text-[11px] font-bold py-1 px-2.5 bg-brand-600 text-white rounded-xl gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Direct Chat
            </Button>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* All-in-One Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
              Company All-in-One Group
            </span>
            <div className="space-y-1">
              {allGroupChannel.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                    activeChannelId === ch.id
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  <Badge variant={activeChannelId === ch.id ? 'secondary' : 'default'} className="text-[9px]">
                    All Roles
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Team Level Groups */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
              Team Level Groups
            </span>
            <div className="space-y-1">
              {teamGroupChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                    activeChannelId === ch.id
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.team && (
                    <Badge variant={activeChannelId === ch.id ? 'secondary' : 'outline'} className="text-[9px]">
                      {ch.team}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Individual Conversations */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Individual Direct DMs
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{directChannels.length}</span>
            </div>
            <div className="space-y-1">
              {directChannels.length > 0 ? (
                directChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                      activeChannelId === ch.id
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                    }`}
                  >
                    <span className="truncate">{ch.name}</span>
                    <span className="text-[10px] font-mono opacity-70">{ch.lastMessageTime}</span>
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground italic px-2 py-1">No direct chats yet. Click "+ Direct Chat" to start.</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Clean Action in Sidebar Footer */}
        {isAdmin && (
          <div className="p-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={handleClearAllChats}
              className="w-full text-center py-1.5 px-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wipe All Chat History (Admin)
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Conversation Workspace */}
      <div className="flex-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card flex flex-col overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-foreground tracking-tight">{activeChannel?.name}</h1>
              <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-bold">
                {activeChannel?.scope === 'all' ? 'Group (TL, Member, Admin)' : activeChannel?.scope === 'team' ? `${activeChannel.team} Team` : 'Direct DM'}
              </Badge>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                <Volume2 className="h-3.5 w-3.5" /> Sound & Alerts Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{activeChannel?.description || 'Collaborate with text updates, share files, and link resources.'}</p>
          </div>

          {/* Admin Group Controls */}
          {isAdmin && messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearGroup}
              className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
              title="Admin: Clear all messages in this group"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Group
            </Button>
          )}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(() => {
            const seenIds = new Set<string>();
            const uniqueMessages: ChatMessage[] = [];
            for (const m of messages) {
              if (!m || seenIds.has(m.id)) continue;
              seenIds.add(m.id);
              const prev = uniqueMessages[uniqueMessages.length - 1];
              if (
                prev &&
                prev.senderId === m.senderId &&
                prev.text === m.text &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 2000
              ) {
                continue;
              }
              uniqueMessages.push(m);
            }
            return uniqueMessages.length > 0 ? (
              uniqueMessages.map((msg) => {
                const isMe = msg.senderId === currentUser._id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                  <Avatar name={msg.senderName} src={msg.senderAvatar} size="md" className="shrink-0" />
                  <div className={`max-w-xl space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                    {/* Sender Info & Admin Delete Action */}
                    <div className={`flex items-center gap-2 text-[11px] text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-bold text-foreground">{msg.senderName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {msg.senderRole}
                      </span>
                      <span className="font-mono text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* Admin Delete Action */}
                      {(isAdmin || isMe) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-40 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity p-0.5 ml-1"
                          title={isAdmin ? "Delete message (Admin)" : "Delete my message"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Content Box */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800/90 text-foreground rounded-tl-none border border-zinc-200/60 dark:border-zinc-700/60'
                      }`}
                    >
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                      {/* File Link Attachment */}
                      {msg.fileAttachment && (
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isMe ? 'bg-brand-700/60 border-brand-400/40 text-white' : 'bg-background border-zinc-200 dark:border-zinc-700 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-bold truncate" title={msg.fileAttachment.name}>
                              {msg.fileAttachment.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {msg.fileAttachment.size && <span className="text-[10px] font-mono opacity-80">{msg.fileAttachment.size}</span>}
                            <a
                              href={msg.fileAttachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          </div>
                        </div>
                      )}

                      {/* External Share Link */}
                      {msg.linkUrl && (
                        <div
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                            isMe ? 'bg-brand-700/60 border-brand-400/40 text-white' : 'bg-background border-zinc-200 dark:border-zinc-700 text-foreground'
                          }`}
                        >
                          <span className="font-mono text-[11px] truncate mr-2" title={msg.linkUrl}>
                            🔗 {msg.linkUrl}
                          </span>
                          <a
                            href={msg.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold hover:underline shrink-0 flex items-center gap-1"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-brand-500 opacity-40" />
              <p className="font-bold text-sm text-foreground">No messages yet in this group</p>
              <p className="text-xs max-w-sm">Start the conversation by sharing updates, attaching documents (&lt; 5MB limit), or pasting links below. Group messages trigger audio & notification alerts for all members.</p>
            </div>
          );
        })()}
        <div ref={messagesEndRef} />
        </div>

        {/* Message Input Controls Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
          {/* File Attachment Pill */}
          {attachedFile && (
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span className="font-bold truncate flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Attached: {attachedFile.name} ({attachedFile.size})
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Share Link Input */}
          {showLinkField && (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste share link (e.g. https://taskflow-saas-app-five.vercel.app/...)"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-mono focus-ring"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => setShowLinkField(false)} className="text-xs">
                Cancel
              </Button>
            </div>
          )}

          {/* Text Message Field & Actions */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors" title="Attach Document (< 5MB limit)">
              <Paperclip className="h-4 w-4 text-emerald-500" />
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip,.xlsx,.txt" />
            </label>

            <button
              type="button"
              onClick={() => setShowLinkField(!showLinkField)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
              title="Share Link"
            >
              <LinkIcon className="h-4 w-4 text-brand-500" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${activeChannel?.name}...`}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-2.5 text-xs font-medium focus-ring"
            />

            <Button
              type="submit"
              disabled={isSending || (!messageText.trim() && !attachedFile && !linkInput.trim())}
              className="bg-[#086075] hover:bg-[#086075]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>

      {/* Direct DM User Selector Modal */}
      <Modal
        isOpen={isNewDmModalOpen}
        onClose={() => setIsNewDmModalOpen(false)}
        title="Start Direct Message (DM)"
        description="Select a Team Lead, Team Member, or Super Admin to start a private chat."
        maxWidth="md"
      >
        <div className="space-y-3 pt-2 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search by name, role, or team..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background pl-9 pr-3 py-2 text-xs focus-ring"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredUsersForDm.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartDirectChat(u)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div>
                    <p className="font-bold text-foreground text-xs">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.role} • {u.team}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  {u.company || 'India & Australia'}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
