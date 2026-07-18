import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, ArrowRight, CheckCircle } from 'lucide-react';

interface PublicLiveChatProps {
  companyName: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export default function PublicLiveChat({ companyName }: PublicLiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch conversation ID on mount
  useEffect(() => {
    let session = localStorage.getItem('logify_chat_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('logify_chat_session', session);
    }
    setConversationId(session);
  }, []);

  // Fetch messages if chat is open
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId, isOpen]);

  // Auto-scroll messages stream to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error pulling chat logs:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const userText = inputText;
    setInputText('');
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user',
          text: userText
        })
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. EXPANDED GLASSMORPHIC CHAT CARD */}
      {isOpen && (
        <div className="w-[320px] sm:w-[360px] h-[450px] bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-fade-in text-neutral-300">
          
          {/* Support Widget Header */}
          <div className="p-4 bg-neutral-950 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff7a1a] animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-white leading-tight">{companyName} Support</h3>
                <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Courier & Dispatch Line</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages Log Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3.5 text-neutral-500 px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-center">
                  <Bot size={20} className="text-[#ff7a1a]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-white uppercase font-mono tracking-wider">Transit Assistant</h4>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Welcome to dispatch routing support. Leave a message regarding a waybill, shipping quote, or carrier questions and a coordinator will reply immediately.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[8px] text-neutral-500 mb-0.5 font-mono uppercase tracking-wider">
                      {isUser ? 'YOU' : 'DISPATCH COORDINATOR'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`p-2.5 rounded-2xl leading-relaxed text-[10.5px] ${isUser ? 'bg-[#ff7a1a] text-white rounded-tr-none font-medium' : 'bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-tl-none font-medium'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Public Chat Entry Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-neutral-950/80 flex gap-2 shrink-0">
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask dispatch coordinates..."
              className="flex-1 bg-neutral-900 border border-white/5 hover:border-white/10 focus:border-[#ff7a1a] rounded-xl px-3.5 py-2 outline-none text-white text-xs font-medium transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2 bg-[#ff7a1a] hover:bg-[#e66c15] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>

        </div>
      )}

      {/* 2. CHAT BUBBLE TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-full bg-[#ff7a1a] hover:bg-[#e66c15] text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-350 cursor-pointer border border-[#ff7a1a]/30 relative group z-50"
        title="Open Support Chat"
      >
        {isOpen ? (
          <X size={20} className="transition-transform group-hover:rotate-90 duration-300" />
        ) : (
          <MessageSquare size={20} className="transition-transform group-hover:scale-110" />
        )}
        {!isOpen && messages.some(m => m.sender === 'admin') && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-neutral-950 animate-bounce" />
        )}
      </button>
    </div>
  );
}
