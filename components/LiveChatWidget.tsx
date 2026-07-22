'use client';

import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiUser } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5009';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009/api';

interface ChatMessage {
  id: string;
  senderRole: string; // 'Customer' or 'Admin'
  messageText: string;
  timestamp: string;
  isRead?: boolean;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedSessionId = localStorage.getItem('sassy_chat_session_id');
      if (!storedSessionId) {
        storedSessionId = uuidv4().replace(/-/g, '');
        localStorage.setItem('sassy_chat_session_id', storedSessionId);
      }
      setTimeout(() => setSessionId(storedSessionId), 0);
    }
  }, []);

  // Fetch chat history when opened
  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      fetch(`/api/backend/LiveChat/${sessionId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
        .then((res) => res.json())
        .then((data: ChatMessage[]) => {
          if (data.length > 0) {
            setMessages(data);
          } else {
            setMessages([{ id: 'system-1', senderRole: 'Admin', messageText: 'Halo! Ada yang bisa kami bantu hari ini?', timestamp: new Date().toISOString() }]);
          }
        })
        .catch(err => console.error('Failed to load chat history', err));
    }
  }, [isOpen, sessionId, messages.length]);

  // Setup SignalR connection
  useEffect(() => {
    if (isOpen && !connection && sessionId) {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/support')
        .withAutomaticReconnect()
        .build();

      newConnection.on('ReceiveSupportMessage', (msgSessionId: string, messageId: string, senderRole: string, messageText: string, timestamp: string) => {
        if (msgSessionId === sessionId) {
          setMessages((prev) => {
            // Check if message already exists (prevent duplicates from echo)
            if (prev.some(m => m.id === messageId)) return prev;
            return [...prev, { id: messageId, senderRole, messageText, timestamp }];
          });
          if (senderRole === 'Admin') {
            setIsAdminTyping(false);
          }
        }
      });

      newConnection.on('TypingIndicator', (msgSessionId: string, senderRole: string, isTyping: boolean) => {
        if (msgSessionId === sessionId && senderRole === 'Admin') {
          setIsAdminTyping(isTyping);
        }
      });

      newConnection.start()
        .then(() => {
          newConnection.invoke('JoinSession', sessionId);
        })
        .catch(err => {
          console.error('SignalR Connection Error: ', err);
          setMessages(prev => [...prev, { id: 'system-error', senderRole: 'Admin', messageText: 'Sistem sedang offline. Coba beberapa saat lagi.', timestamp: new Date().toISOString() }]);
        });

      setConnection(newConnection);
      
      return () => {
        newConnection.stop();
        setConnection(null);
      };
    }
  }, [isOpen, sessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAdminTyping, isOpen]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (connection?.state === signalR.HubConnectionState.Connected) {
      connection.invoke('SendTypingIndicator', sessionId, e.target.value.length > 0);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !inputText.trim() || !connection || connection.state !== signalR.HubConnectionState.Connected) return;

    setIsSubmitting(true);
    const textToSend = inputText;
    // We don't add optimistically to avoid duplicate when server echoes back
    // The message will appear when the server broadcasts 'ReceiveSupportMessage'
    
    setInputText('');

    try {
      await connection.invoke('SendMessageToAdmin', sessionId, textToSend, "Guest");
      connection.invoke('SendTypingIndicator', sessionId, false);
    } catch (e) {
      console.error('Send failed', e);
      setMessages(prev => [...prev, { id: uuidv4(), senderRole: 'Admin', messageText: 'Gagal mengirim pesan. Silakan coba lagi.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-[#111] rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FiUser className="text-xl" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#111] rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold">SassyGurl Support</h3>
                  <p className="text-xs text-white/80">Membalas dengan cepat</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a] custom-scrollbar">
              {messages.map((msg) => {
                const isCustomer = msg.senderRole === 'Customer';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                      isCustomer 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm shadow-md' 
                        : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5'
                    }`}>
                      {msg.messageText}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
              
              {isAdminTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start"
                >
                  <div className="bg-white/10 p-3 rounded-2xl rounded-bl-sm flex gap-1 items-center border border-white/5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 border-t border-white/10 bg-[#111]">
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleTyping}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-full pl-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-2 p-2 bg-purple-600 hover:bg-pink-600 text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-purple-600"
                >
                  <FiSend />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[9px] text-gray-600">Powered by SassyGurl Enterprise</p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.5)] flex items-center justify-center text-white z-50 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <FiMessageSquare className="text-2xl relative z-10" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-black rounded-full shadow-lg"></span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
