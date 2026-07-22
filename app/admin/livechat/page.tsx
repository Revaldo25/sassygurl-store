'use client';

import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend,
  FiUser,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreHorizontal,
  FiPaperclip,
  FiSmile
} from 'react-icons/fi';
import { FaRobot, FaWhatsapp, FaTelegramPlane, FaGlobe } from 'react-icons/fa';
import { getActiveChatSessions, getChatHistory } from '@/app/actions/livechat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
const HUB_URL = "/hubs/support";

interface ChatMessage {
  id: string;
  senderRole: string;
  messageText: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatSession {
  id: string;
  guestName: string;
  userId: string | null;
  status: string;
  lastUpdatedAt: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export default function AdminLiveChat() {
  const { data: session } = useSession();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use a ref to access the latest activeSessionId inside SignalR callbacks without reconnecting
  const activeSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Fetch active sessions
  useEffect(() => {
    getActiveChatSessions().then(res => {
      if (res.success) setSessions(res.data);
      else console.error("Failed to fetch sessions", res.error);
    });
  }, []);

  // Fetch messages when a session is selected
  useEffect(() => {
    if (activeSessionId) {
      getChatHistory(activeSessionId).then(res => {
        if (res.success) setMessages(res.data);
        else console.error("Failed to fetch messages", res.error);
      });
      
      // Clear unread count for this session
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, unreadCount: 0 } : s))
      );
    }
  }, [activeSessionId]);

  // Connect to SignalR
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          // @ts-ignore
          return session?.user?.apiToken || "";
        }
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveSupportMessage', (sessionId: string, messageId: string, senderRole: string, messageText: string, timestamp: string) => {
      // Update session list with new message
      setSessions(prev => {
        const existingSession = prev.find(s => s.id === sessionId);
        const newMsg = { id: messageId, senderRole, messageText, timestamp, isRead: false };
        
        if (existingSession) {
          return [
            { ...existingSession, lastUpdatedAt: timestamp, lastMessage: newMsg, unreadCount: activeSessionIdRef.current === sessionId ? 0 : existingSession.unreadCount + 1 },
            ...prev.filter(s => s.id !== sessionId)
          ];
        } else {
          // If brand new session, fetch all sessions again to get guest name
          getActiveChatSessions().then(res => { if (res.success) setSessions(res.data); });
          return prev;
        }
      });

      // If this message is for the active session, add it to the chat window
      if (activeSessionIdRef.current === sessionId) {
        setMessages(prev => {
          if (prev.some(m => m.id === messageId)) return prev;
          return [...prev, { id: messageId, senderRole, messageText, timestamp, isRead: false }];
        });
      }
    });

    newConnection.on('TypingIndicator', (sessionId: string, senderRole: string, isTyping: boolean) => {
      if (activeSessionIdRef.current === sessionId && senderRole === 'Customer') {
        setIsCustomerTyping(isTyping);
      }
    });

    newConnection.start()
      .then(() => console.log('Admin connected to Live CS Hub'))
      .catch((err) => console.error('Hub Error:', err));

    setConnection(newConnection);

    return () => {
      newConnection.stop();
      setConnection(null);
    };
  }, []); // Run only once on mount

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCustomerTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !connection || !activeSessionId) return;

    try {
      await connection.invoke('ReplyToCustomer', activeSessionId, inputText);
      setInputText('');
      connection.invoke('SendTypingIndicator', activeSessionId, false);
    } catch (err) {
      console.error('Failed to send reply', err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (connection && activeSessionId) {
      connection.invoke('SendTypingIndicator', activeSessionId, e.target.value.length > 0);
    }
  };

  const activeSessionData = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex pt-20 pb-10 px-4 sm:px-8 items-center justify-center">
      <div className="w-full max-w-[1400px] flex flex-col bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-[85vh]">
        
        {/* Top Header Window Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1C1C1E] border-b border-white/5">
          <div className="flex items-center gap-6">
            {/* Mac OS Window Controls */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-pink-500 text-white rounded-lg p-1.5 font-bold text-sm leading-none flex items-center justify-center w-8 h-8">
                G
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">SassyGurl</span>
                <span className="text-[10px] text-gray-400 leading-none mt-0.5">Store</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
             <h1 className="text-sm font-semibold text-gray-200">Admin Live Chat Command Center</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Online</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-400">
               <FiMoreHorizontal className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
               <img src="https://ui-avatars.com/api/?name=Admin+Sarah&background=F472B6&color=fff" alt="Admin" className="w-7 h-7 rounded-full" />
               <span className="text-sm text-gray-300">Admin Sarah</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sessions Sidebar */}
          <div className="w-1/3 max-w-[400px] border-r border-white/5 bg-[#141414] flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Left Sessions</h2>
              <FiMoreHorizontal className="text-gray-500 cursor-pointer hover:text-white" />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center p-10 text-gray-500 flex flex-col items-center">
                  <FiClock className="text-3xl mb-3 opacity-50" />
                  <p className="text-sm">No active sessions.</p>
                </div>
              ) : (
                sessions.map(s => {
                  const isActive = activeSessionId === s.id;
                  
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setActiveSessionId(s.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-[#1C1C1E] border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="relative">
                           <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.guestName)}&background=random`} alt={s.guestName} className="w-full h-full object-cover" />
                           </div>
                           <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#141414] ${isActive ? 'bg-green-500' : 'bg-green-500'}`}></div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-0.5">
                            <h3 className="font-semibold text-[15px] text-gray-100 flex items-center gap-1.5">
                              {s.guestName}
                              {s.guestName.includes('Bot') && <FaRobot className="text-gray-400 text-xs" />}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {s.lastUpdatedAt ? new Date(s.lastUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'New'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-400 truncate w-40">
                              {s.lastMessage?.messageText || 'Menunggu balasan...'}
                            </p>
                            {s.unreadCount > 0 ? (
                              <div className="bg-pink-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {s.unreadCount}
                              </div>
                            ) : (
                               <div className="flex items-center gap-1 text-xs">
                                  {(s as any).channel === 'WA' ? <FaWhatsapp className="text-green-500" /> : 
                                   (s as any).channel === 'Telegram' ? <FaTelegramPlane className="text-blue-400" /> : 
                                   <FaGlobe className="text-blue-500" />}
                               </div>
                            )}
                          </div>

                          <div className="mt-2 flex">
                            {isActive ? (
                               <span className="text-[10px] px-2 py-0.5 rounded-full border border-pink-500/50 text-pink-400 bg-pink-500/10 font-medium">Active</span>
                            ) : (
                               <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/50 text-red-400 bg-red-500/10 font-medium">Waiting</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-[#111]">
            {activeSessionId && activeSessionData ? (
              <>
                {/* Chat Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full overflow-hidden relative">
                         <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeSessionData.guestName)}&background=random`} alt="User" className="w-full h-full object-cover" />
                         <div className="absolute bottom-0 right-0 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-[#111] flex items-center justify-center">
                             {(activeSessionData as any).channel === 'WA' && <FaWhatsapp className="text-white text-[8px]" />}
                         </div>
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                           <h2 className="text-lg font-bold text-gray-100">{activeSessionData.guestName}</h2>
                           <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full border border-white/10 font-medium">WA</span>
                       </div>
                       <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                         <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            WAITING
                         </span>
                         MLBB Top-Up #{activeSessionData.id.slice(0,8).toUpperCase()}
                       </p>
                     </div>
                  </div>
                  <FiMoreHorizontal className="text-gray-500 text-xl cursor-pointer hover:text-white" />
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  {messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'Admin';
                    
                    // As per mockup: Admin (SassyBot) is on the left, Customer is on the right
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || idx} 
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex gap-3 max-w-[70%]">
                           {isAdmin && (
                             <div className="h-8 w-8 rounded-full bg-pink-500/20 flex-shrink-0 flex items-center justify-center text-pink-400 mt-1 border border-pink-500/20">
                               <FaRobot className="text-sm" />
                             </div>
                           )}

                          <div className="flex flex-col">
                            {isAdmin && <span className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">SassyBot <span className="bg-white/10 text-[9px] px-1 rounded text-gray-400">AI</span></span>}
                            {!isAdmin && <span className="text-xs font-semibold text-gray-400 mb-1 text-right flex justify-end">{activeSessionData.guestName}</span>}
                            
                            <div className={`p-3.5 px-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                              isAdmin 
                                ? 'bg-pink-300 text-zinc-900 rounded-tl-sm font-medium shadow-pink-900/10' 
                                : 'bg-[#1C1C1E] text-gray-200 rounded-tr-sm border border-white/5'
                            }`}>
                              {msg.messageText}
                            </div>
                            
                            <span className={`text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 ${isAdmin ? 'justify-start pl-1' : 'justify-end pr-1'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {!isAdmin && <FiCheckCircle className="text-gray-400" />}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isCustomerTyping && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-end"
                    >
                      <div className="flex gap-3 max-w-[70%]">
                        <div className="flex flex-col items-end">
                           <span className="text-xs font-semibold text-gray-400 mb-1 text-right">{activeSessionData.guestName}</span>
                           <div className="bg-[#1C1C1E] p-4 rounded-2xl rounded-tr-sm flex gap-1.5 items-center border border-white/5">
                             <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                             <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                             <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 pb-6 border-t border-white/5">
                  <form onSubmit={handleSendMessage} className="flex flex-col border border-white/10 rounded-2xl bg-[#1C1C1E] focus-within:border-pink-500/50 transition-colors overflow-hidden">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={handleTyping}
                      placeholder="Type your message or use commands (/resolve, /faq)..." 
                      className="w-full bg-transparent border-none px-5 py-4 focus:outline-none text-white placeholder-gray-500 text-sm"
                      autoFocus
                    />
                    <div className="flex justify-between items-center px-4 pb-3 pt-1">
                       <div className="flex items-center gap-3 text-gray-400">
                          <FiPaperclip className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                          <FiSmile className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                       </div>
                       <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="h-8 w-12 rounded-full bg-pink-400 hover:bg-pink-300 text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <FiSend className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                <FiClock className="text-5xl opacity-20" />
                <p>Pilih sesi dari sidebar kiri untuk memulai percakapan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
