// frontend/src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Chatbot({ doctorsList, onBookSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      isBot: true, 
      text: "مرحباً! 👋 أنا مساعد MediBook الذكي. يمكنني تحليل الأعراض واقتراح الدكاترة المناسبين. كيف يمكنني مساعدتك اليوم؟" 
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.63.47.45:8000';
  const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isThinking]);

  const speakText = (text) => {
    if (!voiceMode || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = 'ar-EG';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isOpen && messages.length === 1) speakText(messages[0].text);
  }, [isOpen]);

  const toggleMicrophone = (e) => {
    e.preventDefault();
    if (!recognition) return alert("المتصفح لا يدعم التعرف على الصوت.");

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.lang = 'ar-EG';
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
    }
  };

  // ==========================================
  // SPECIALTY NORMALIZATION
  // ==========================================
  const normalizeSpecialty = (spec) => {
    if (!spec) return null;
    
    const s = spec.toLowerCase().trim();
    
    const specialtyMap = {
      'internal medicine': 'Internal Medicine',
      'internal': 'Internal Medicine',
      'باطنة': 'Internal Medicine',
      'طب باطني': 'Internal Medicine',
      'طب عام': 'Internal Medicine',
      'general medicine': 'Internal Medicine',

      'pediatrics': 'Pediatrics',
      'pediatric': 'Pediatrics',
      'اطفال': 'Pediatrics',
      'أطفال': 'Pediatrics',

      'cardiology': 'Cardiology',
      'قلب': 'Cardiology',
      'قلبية': 'Cardiology',

      'dermatology': 'Dermatology',
      'جلدية': 'Dermatology',

      'neurology': 'Neurology',
      'مخ وأعصاب': 'Neurology',
      'اعصاب': 'Neurology',

      'ent': 'ENT',
      'انف واذن وحنجرة': 'ENT',

      'ophthalmology': 'Ophthalmology',
      'عيون': 'Ophthalmology',

      'orthopedics': 'Orthopedics',
      'عظام': 'Orthopedics',

      'psychiatry': 'Psychiatry',
      'نفسي': 'Psychiatry',
    };

    for (const [key, value] of Object.entries(specialtyMap)) {
      if (s === key || s.includes(key) || key.includes(s)) {
        console.log(`🔄 Normalized: "${spec}" → "${value}"`);
        return value;
      }
    }
    return spec;
  };

  // ==========================================
  // FILTER VALID DOCTORS
  // ==========================================
  const isValidRealDoctor = (doctor) => {
    if (!doctor || (!doctor.id && !doctor._id)) return false;
    
    const fakeNames = ['Dr. Kareem Ali', 'د. كريم', 'Happy Kids Hospital'];
    if (doctor.name && fakeNames.some(fake => doctor.name.includes(fake))) {
      return false;
    }
    return true;
  };

  // ==========================================
  // MATCH DOCTORS BY SPECIALTY
  // ==========================================
  const matchDoctorsBySpecialty = (targetSpecialty) => {
    if (!targetSpecialty || !doctorsList || doctorsList.length === 0) return [];

    const normalizedTarget = normalizeSpecialty(targetSpecialty);
    if (!normalizedTarget) return [];

    console.log(`🎯 Searching for doctors in: "${normalizedTarget}"`);

    const matched = doctorsList.filter(doctor => {
      if (!doctor.specialty) return false;
      const doctorSpec = doctor.specialty.toLowerCase().trim();
      const target = normalizedTarget.toLowerCase().trim();

      return (
        doctorSpec === target ||
        doctorSpec.includes(target) ||
        target.includes(doctorSpec)
      );
    }).filter(isValidRealDoctor);

    console.log(`📊 Found ${matched.length} doctors for ${normalizedTarget}`);
    return matched;
  };

  // ==========================================
  // CALL AI - النسخة المحدثة والأكثر دقة
  // ==========================================
  const askRealAI = async (userSymptoms, conversationHistory) => {
    try {
      console.log("📤 Sending to AI:", userSymptoms);

      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userSymptoms,
          history: conversationHistory 
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("✅ AI Full Response:", data);

      let specialty = null;
      const responseType = data.type || "general";

      // استخراج التخصص بطريقة أكثر شمولاً
      if (responseType === "doctor_request") {
        specialty = data.recommended_specialty 
                 || data.analysis?.specialty 
                 || data.specialty;
      } 
      else if (responseType === "medical") {
        specialty = data.analysis?.specialty 
                 || data.specialty_detected 
                 || data.specialty;
      }

      return {
        specialty: specialty,
        response: data.response || data.reply || data.message || "شكراً لرسالتك.",
        type: responseType,
        rawData: data   // للتصحيح فقط
      };

    } catch (error) {
      console.error("API Error:", error);
      return {
        specialty: null,
        response: "عذراً، حدث خطأ في الاتصال بالمساعد الذكي.",
        type: "error"
      };
    }
  };

  // ==========================================
  // MAIN MESSAGE HANDLER
  // ==========================================
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), isBot: false, text: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      const aiResult = await askRealAI(text, messages);
      setIsThinking(false);

      let botMsg = { 
        id: Date.now() + 1, 
        isBot: true, 
        text: aiResult.response 
      };

      const rawSpecialty = aiResult.specialty || "";

      // معالجة doctor_request
      if (aiResult.type === "doctor_request" && rawSpecialty) {
        const matchedDoctors = matchDoctorsBySpecialty(rawSpecialty);

        if (matchedDoctors.length > 0) {
          botMsg.suggestedDoctors = matchedDoctors;
          
          botMsg.text = `${aiResult.response}\n\n👨‍⚕️ **الأطباء المتاحون في تخصص ${rawSpecialty}:**\n` +
                        matchedDoctors.map(d => `• ${d.name} (${d.specialty})`).join('\n') +
                        `\n\nاضغط على زر "حجز" أسفل الطبيب الذي تريده.`;
        } else {
          botMsg.text = `${aiResult.response}\n\n❌ للأسف لا يوجد أطباء متاحون حالياً في تخصص ${rawSpecialty}.`;
        }
      }

      setMessages(prev => [...prev, botMsg]);
      speakText(botMsg.text.replace(/<[^>]+>/g, ''));

    } catch (error) {
      console.error("Error processing message:", error);
      setIsThinking(false);
      
      const errorReply = {
        id: Date.now() + 1,
        isBot: true,
        text: "عذراً، حدث خطأ في الاتصال بالخدمة. يرجى المحاولة مرة أخرى."
      };
      setMessages(prev => [...prev, errorReply]);
      speakText(errorReply.text);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    handleSendMessage(inputText);
  };

  const handleBookDoctor = (doctorName) => {
    const doctor = doctorsList?.find(doc => doc.name === doctorName);
    if (doctor && onBookSelect) {
      onBookSelect(doctor);
      setIsOpen(false);
      window.speechSynthesis.cancel();
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 cursor-pointer ${
          isOpen ? 'bg-rose-500 text-white rotate-90' : 'bg-teal-500 text-white hover:bg-teal-400 hover:scale-110 animate-bounce'
        }`}
      >
        <span className="text-3xl">{isOpen ? '✕' : '💬'}</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-teal-100 flex flex-col overflow-hidden z-50 animate-fade-in-up h-[550px]">
          
          <div className="bg-gradient-to-r from-teal-500 to-emerald-400 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">🧠</div>
              <div>
                <h3 className="font-bold text-sm">AI Triage Assistant</h3>
                <p className="text-[10px] text-teal-50 font-medium">{isListening ? "جاري الاستماع..." : "مدعوم بالذكاء الاصطناعي"}</p>
              </div>
            </div>
            <button 
              onClick={() => setVoiceMode(!voiceMode)}
              className="text-2xl bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors cursor-pointer"
              title={voiceMode ? "كتم الصوت" : "تشغيل الصوت"}
            >
              {voiceMode ? '🔊' : '🔇'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  msg.isBot ? 'bg-white border border-teal-50 text-slate-700 rounded-tl-none' : 'bg-teal-500 text-white rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-wrap" 
                     dangerouslySetInnerHTML={{ 
                       __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                     }} 
                  />
                </div>

                {/* عرض كروت الدكاترة */}
                {msg.suggestedDoctors && msg.suggestedDoctors.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 w-full">
                    <p className="text-xs font-bold text-teal-700">👨‍⚕️ الأطباء المتاحون في هذا التخصص:</p>
                    {msg.suggestedDoctors.map((doc, index) => (
                      <div key={doc.id || doc._id || index} 
                           className="bg-white border border-teal-100 p-3 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          {doc.image ? (
                            <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-lg">👨‍⚕️</div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{doc.name}</h4>
                            <p className="text-xs text-teal-600 font-medium">{doc.specialty}</p>
                            {doc.rating && <p className="text-xs text-amber-500">⭐ {doc.rating}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBookDoctor(doc.name)}
                          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-teal-600 transition-colors cursor-pointer shadow-sm"
                        >
                          حجز
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isThinking && (
              <div className="flex flex-col items-start">
                <div className="p-4 rounded-2xl bg-white border border-teal-50 text-slate-400 rounded-tl-none flex gap-1 shadow-sm">
                  <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <button 
              type="button"
              onClick={toggleMicrophone}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm ${
                isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎤
            </button>
            <input 
              type="text" 
              placeholder="اكتب الأعراض أو اطلب الدكاترة..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isListening || isThinking}
              className="flex-1 bg-slate-50 px-4 py-2 text-sm rounded-full border border-slate-200 outline-none focus:border-teal-400 transition-colors disabled:opacity-50"
              dir="rtl"
            />
            <button 
              type="submit" 
              disabled={isListening || isThinking || !inputText.trim()}
              className="bg-teal-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-teal-400 transition-colors shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;