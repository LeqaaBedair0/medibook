// src/components/DirectChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://16.171.29.212:8000/api';

function DirectChat({ 
  isOpen, 
  onClose, 
  contactName, 
  contactRole, 
  contactId, 
  currentUserId,
  language = 'en',
  isVipMode = false,
  patientId = null
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const translations = {
    en: {
      typeMessage: 'Type your message...',
      send: 'Send',
      loading: 'Sending...',
      welcomeDoctor: 'How can I help you today?',
      welcomeVip: "Hello! I'm your Smart Medical Coach. How are you feeling today? Let me help you track your health progress. 🩺",
      error: 'Failed to send message',
      aiThinking: 'AI is thinking...',
      consultationTitle: 'Medical Consultation',
      vipTitle: 'Smart Medical Coach',
      noMessages: 'No messages yet. Start a conversation!',
      close: 'Close'
    },
    ar: {
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      loading: 'جاري الإرسال...',
      welcomeDoctor: 'كيف يمكنني مساعدتك اليوم؟',
      welcomeVip: "مرحباً! أنا مدربك الطبي الذكي. كيف تشعر اليوم؟ دعني أساعدك في متابعة حالتك الصحية 🩺",
      error: 'فشل إرسال الرسالة',
      aiThinking: 'الذكاء الاصطناعي يفكر...',
      consultationTitle: 'استشارة طبية',
      vipTitle: 'المدرب الطبي الذكي',
      noMessages: 'لا توجد رسائل بعد. ابدأ المحادثة!',
      close: 'إغلاق'
    }
  };

  const t = translations[language];
  const isRTL = language === 'ar';

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize chat session and load history
  useEffect(() => {
    if (isOpen && currentUserId && contactId) {
      initializeChat();
    }
  }, [isOpen, currentUserId, contactId, isVipMode]);

  const initializeChat = async () => {
    try {
      let endpoint;
      if (isVipMode) {
        endpoint = `${API_BASE}/vip-chat/${patientId || currentUserId}/session`;
      } else {
        endpoint = `${API_BASE}/chat/session?user_id=${currentUserId}&role=patient&contact_id=${contactId}`;
      }
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setChatSessionId(data.session_id);
        
        // Load chat history
        const historyRes = await fetch(`${API_BASE}/chat/${data.session_id}/messages`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.messages && historyData.messages.length > 0) {
            setMessages(historyData.messages);
          } else {
            // Add welcome message
            const welcomeMsg = {
              id: Date.now(),
              role: 'assistant',
              content: isVipMode ? t.welcomeVip : t.welcomeDoctor,
              timestamp: new Date().toISOString()
            };
            setMessages([welcomeMsg]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      // Fallback: start with welcome message
      const welcomeMsg = {
        id: Date.now(),
        role: 'assistant',
        content: isVipMode ? t.welcomeVip : t.welcomeDoctor,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;
      
      if (isVipMode) {
        // VIP Mode: Use personalized health coach endpoint
        response = await fetch(`${API_BASE}/vip-chat/${patientId || currentUserId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            session_id: chatSessionId,
            language: language
          })
        });
      } else {
        // Regular doctor chat mode
        response = await fetch(`${API_BASE}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            session_id: chatSessionId,
            user_id: currentUserId,
            role: 'patient',
            contact_id: contactId,
            language: language
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.reply || data.message || (isVipMode ? "I'm here to help you track your health!" : "I'm here to help you with your medical concerns."),
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(t.error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: language === 'en' 
          ? 'Sorry, I encountered an error. Please try again.' 
          : 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className={`p-6 ${isVipMode ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : 'bg-slate-800'} text-white flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isVipMode ? 'bg-white/20' : 'bg-teal-500'}`}>
              {isVipMode ? '🧠' : '👨‍⚕️'}
            </div>
            <div>
              <h3 className="text-xl font-bold">{contactName}</h3>
              <p className="text-sm opacity-90">
                {isVipMode ? t.vipTitle : `${contactRole} • ${t.consultationTitle}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-3xl hover:text-rose-300 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : msg.isError
                      ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-200'
                      : isVipMode
                      ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-slate-800 rounded-bl-none border border-teal-100'
                      : 'bg-white text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {new Date(msg.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-slate-500 ml-2">{t.aiThinking}</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.typeMessage}
              rows="2"
              className="flex-1 p-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`px-6 rounded-2xl font-bold transition-all ${
                !inputMessage.trim() || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isVipMode
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-teal-700 text-white'
              }`}
            >
              {isLoading ? t.loading : t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectChat;