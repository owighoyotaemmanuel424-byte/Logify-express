import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, CheckCircle, RefreshCw, Clock, User, 
  Truck, ArrowRight, ShieldCheck, Search, AlertCircle
} from 'lucide-react';
import { User as UserType, Driver } from '../types.js';

interface AdminSupportViewProps {
  token: string;
  drivers: Driver[];
  users: UserType[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

interface ChatConversation {
  id: string;
  status: 'Open' | 'Resolved';
  messages: ChatMessage[];
  updatedAt: string;
}

export default function AdminSupportView({ token, drivers, users }: AdminSupportViewProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  // Internal Messaging states
  const [selectedRecipientType, setSelectedRecipientType] = useState<'driver' | 'user'>('driver');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [internalMessageText, setInternalMessageText] = useState('');
  const [sendingInternal, setSendingInternal] = useState(false);
  const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConv?.messages]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // Refresh currently active conversation details if open
        if (selectedConv) {
          const matched = data.find((c: any) => c.id === selectedConv.id);
          if (matched) {
            setSelectedConv(matched);
          }
        }
      }
    } catch (err) {
      console.error("Error synchronizing support chats:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/chat/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sender: 'admin',
          text: replyText
        })
      });

      if (res.ok) {
        setReplyText('');
        fetchChats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleStatus = async (conv: ChatConversation) => {
    const newStatus = conv.status === 'Open' ? 'Resolved' : 'Open';
    try {
      const res = await fetch(`/api/chat/${conv.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchChats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId || !internalMessageText.trim()) return;

    setSendingInternal(true);
    setInternalSuccess(null);

    try {
      // Post an alert/message in the system
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: selectedRecipientType === 'driver' ? 'Courier Notice' : 'Client Alert',
          message: internalMessageText,
          userId: selectedRecipientType === 'user' ? selectedRecipientId : undefined,
          driverId: selectedRecipientType === 'driver' ? selectedRecipientId : undefined
        })
      });

      if (response.ok) {
        setInternalSuccess(`Internal message successfully dispatched to ${selectedRecipientType === 'driver' ? 'Courier' : 'Customer'}.`);
        setInternalMessageText('');
        setTimeout(() => setInternalSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingInternal(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.id.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(chatSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center bg-[#111] border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-[#ff7a1a]" size={16} />
            Support & Internal Communications Hub
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Reply to live customer chat streams & broadcast direct agent waybill notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-neutral-300">
        {/* SUPPORT CHATS SECTION */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-5 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl h-[520px] overflow-hidden shadow-xl">
          {/* Chat List (Sidebar) */}
          <div className="md:col-span-2 border-r border-neutral-800 flex flex-col h-full bg-neutral-950/40">
            <div className="p-4 border-b border-neutral-800 space-y-3">
              <h3 className="font-bold text-white uppercase tracking-wider text-[10px] font-mono">Live Public Chats</h3>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 focus:border-[#ff7a1a] pl-8 pr-3 py-2 rounded-xl outline-none text-[10px] text-white font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-850">
              {filteredConversations.map((conv) => {
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isActive = selectedConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-3.5 text-left transition-colors flex flex-col gap-1 hover:bg-neutral-800/40 cursor-pointer ${isActive ? 'bg-neutral-800/80 border-r-2 border-[#ff7a1a]' : ''}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-[9px] text-[#ff7a1a] font-bold">SESSION: {conv.id.substring(0, 10)}...</span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${conv.status === 'Open' ? 'bg-[#ff7a1a]/10 text-[#ff7a1a] border border-[#ff7a1a]/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'}`}>
                        {conv.status}
                      </span>
                    </div>
                    {lastMsg ? (
                      <p className="text-[10px] text-neutral-400 truncate max-w-full font-medium italic">
                        "{lastMsg.text}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-neutral-500 italic">No messages yet</p>
                    )}
                    <span className="text-[8px] text-neutral-500 self-end font-mono">
                      {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-neutral-500 italic">No customer sessions found.</div>
              )}
            </div>
          </div>

          {/* Active Conversation Pane */}
          <div className="md:col-span-3 flex flex-col h-full bg-neutral-950/20">
            {selectedConv ? (
              <>
                {/* Pane Header */}
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40 shrink-0">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white font-mono text-[10px]">Active Session ID: {selectedConv.id}</p>
                    <p className="text-[9px] text-neutral-400">Current status: <span className="text-white font-semibold">{selectedConv.status}</span></p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(selectedConv)}
                    className={`px-2.5 py-1 font-bold text-[9px] rounded-lg transition-colors cursor-pointer border ${selectedConv.status === 'Open' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-[#ff7a1a]/15 text-[#ff7a1a] border-[#ff7a1a]/20 hover:bg-[#ff7a1a]/20'}`}
                  >
                    {selectedConv.status === 'Open' ? 'Mark Resolved' : 'Re-open Chat'}
                  </button>
                </div>

                {/* Messages Stream */}
                <div 
                  ref={scrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3.5"
                >
                  {selectedConv.messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[8px] text-neutral-500 mb-0.5 font-mono">
                          {isAdmin ? 'SUPPORT ASSISTANT' : 'CUSTOMER'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`p-3 rounded-2xl leading-relaxed text-[11px] ${isAdmin ? 'bg-[#ff7a1a] text-white rounded-tr-none font-medium' : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none font-sans'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {selectedConv.messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center text-neutral-500 italic">Starting fresh conversation session...</div>
                  )}
                </div>

                {/* Reply Input Form */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-neutral-800 bg-neutral-900/40 shrink-0 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type professional reply..."
                    className="flex-1 bg-neutral-950 border border-neutral-850 hover:border-neutral-800 focus:border-[#ff7a1a] rounded-xl px-3.5 py-2.5 outline-none text-white text-xs font-sans transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="p-2.5 bg-[#ff7a1a] hover:bg-[#e66c15] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    {sendingReply ? <RefreshCw className="animate-spin" size={13} /> : <Send size={13} />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8 space-y-2 text-center">
                <MessageSquare size={32} className="text-neutral-700" />
                <h4 className="font-bold uppercase tracking-wider text-[10px] font-mono text-neutral-400">No Session Selected</h4>
                <p className="text-[10px] max-w-[200px]">Select an active customer query on the left pane to initialize support controls.</p>
              </div>
            )}
          </div>
        </div>

        {/* INTERNAL MESSAGING / ALERTS DISPATCH SECTION */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2.5">
              <Truck size={15} className="text-[#ff7a1a]" />
              Internal Messaging Center
            </h3>

            <form onSubmit={handleSendInternal} className="space-y-3.5 text-xs">
              {/* Recipient Category */}
              <div className="space-y-1">
                <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Recipient Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipientType('driver'); setSelectedRecipientId(''); }}
                    className={`py-2 text-center rounded-xl font-bold border transition-all cursor-pointer ${selectedRecipientType === 'driver' ? 'border-[#ff7a1a] bg-[#ff7a1a]/10 text-white' : 'border-neutral-850 bg-neutral-950 text-neutral-400'}`}
                  >
                    Courier Agents
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipientType('user'); setSelectedRecipientId(''); }}
                    className={`py-2 text-center rounded-xl font-bold border transition-all cursor-pointer ${selectedRecipientType === 'user' ? 'border-[#ff7a1a] bg-[#ff7a1a]/10 text-white' : 'border-neutral-850 bg-neutral-950 text-neutral-400'}`}
                  >
                    Customers
                  </button>
                </div>
              </div>

              {/* Recipient Selection Dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Select Recipient Profile</label>
                <select
                  required
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-800 rounded-xl px-3 py-2.5 outline-none text-white font-medium"
                >
                  <option value="">-- Choose Recipient --</option>
                  {selectedRecipientType === 'driver' ? (
                    drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.vehicleType})</option>
                    ))
                  ) : (
                    users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))
                  )}
                </select>
              </div>

              {/* Message Input text */}
              <div className="space-y-1">
                <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Alert Notification Message</label>
                <textarea
                  required
                  rows={4}
                  value={internalMessageText}
                  onChange={(e) => setInternalMessageText(e.target.value)}
                  placeholder="Type dispatch alert or coordination message here..."
                  className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-850 rounded-xl px-3.5 py-2.5 outline-none text-white text-xs font-sans resize-none"
                />
              </div>

              {internalSuccess && (
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl font-bold text-[10px] flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  {internalSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingInternal || !selectedRecipientId || !internalMessageText.trim()}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-sans cursor-pointer disabled:opacity-40"
              >
                {sendingInternal ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <Send size={12} className="text-[#ff7a1a]" />
                )}
                Dispatch Internal Alert
              </button>
            </form>
          </div>

          <div className="p-3 bg-[#ff7a1a]/10 border border-[#ff7a1a]/20 rounded-xl text-[10px] leading-relaxed text-neutral-400 flex items-start gap-1.5">
            <AlertCircle size={14} className="text-[#ff7a1a] shrink-0 mt-0.5" />
            <p>
              Direct alerts immediately trigger in-app dashboards and update dispatch timeline histories for associated personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
