import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Chatbot({ doctorsList }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isThinking, setIsThinking] = useState(false); // New state for AI loading
  
  const [messages, setMessages] = useState([
    { id: 1, isBot: true, text: "Hi! I'm your MediBook AI. I am trained to analyze your symptoms. How can I help you today?" }
  ]);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

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
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isOpen && messages.length === 1) speakText(messages[0].text);
  }, [isOpen]);

  const toggleMicrophone = (e) => {
    e.preventDefault();
    if (!recognition) return alert("Browser doesn't support voice recognition.");

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        processUserMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
    }
  };

  // ==========================================
  // 🧠 NEW: THE AI INTEGRATION BLOCK
  // ==========================================
  
  // This is where you "Train" the AI by giving it a persona and rules.
  const SYSTEM_PROMPT = `
    You are an expert medical triage assistant. 
    Read the user's symptoms and determine which medical specialty they need.
    You must ONLY reply with ONE of these exact words: 
    Cardiologist, Dentist, Dermatologist, Pediatrician, Neurologist.
    If the symptoms don't match or are unclear, reply with the exact word: Unknown.
  `;

  const askRealAI = async (userSymptoms) => {
    // ⚠️ NOTE: In a real app, you never put API keys in the frontend! 
    // This fetch request will eventually go to your Java Spring Boot backend, 
    // and Spring Boot will talk to OpenAI or Gemini securely.
    
    /* --- REAL API CALL STRUCTURE ---
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_API_KEY` 
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userSymptoms }
          ]
        })
      });
      const data = await response.json();
      return data.choices[0].message.content.trim(); // E.g., Returns "Cardiologist"
    } catch (error) {
      console.error("AI Error:", error);
      return "Unknown";
    }
    --------------------------------- */

    // For now, we simulate the AI's "thought process" and response time (1.5 seconds)
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerText = userSymptoms.toLowerCase();
        if (lowerText.match(/heart|chest|palpitation|blood pressure/)) resolve("Cardiologist");
        else if (lowerText.match(/tooth|teeth|gum|jaw|cavity/)) resolve("Dentist");
        else if (lowerText.match(/skin|rash|acne|itchy|mole|spot/)) resolve("Dermatologist");
        else if (lowerText.match(/child|baby|kid|fever|cough/)) resolve("Pediatrician");
        else if (lowerText.match(/headache|migraine|dizzy|nerve|numb|brain/)) resolve("Neurologist");
        else resolve("Unknown");
      }, 1500); // 1.5 second simulated API delay
    });
  };

  // ==========================================

  const processUserMessage = async (text) => {
    if (!text.trim()) return;

    // 1. Show user message
    const userMessage = { id: Date.now(), isBot: false, text: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText(''); 
    
    // 2. Turn on "AI is thinking..." animation
    setIsThinking(true);

    // 3. Ask the AI Model! (Awaits the promise)
    const detectedSpecialty = await askRealAI(text);
    
    // 4. Turn off thinking animation
    setIsThinking(false);

    let botReply = {};
    let spokenText = "";

    if (detectedSpecialty !== "Unknown") {
      const recommendedDoctors = doctorsList.filter(doc => doc.specialty === detectedSpecialty);
      
      if (recommendedDoctors.length > 0) {
        spokenText = `I recommend a ${detectedSpecialty}. I found ${recommendedDoctors.length} available doctors for you. I have displayed them on your screen.`;
        botReply = {
          id: Date.now() + 1,
          isBot: true,
          text: `Based on your symptoms, my AI analysis suggests a **${detectedSpecialty}**. Here are our top specialists:`,
          suggestedDoctors: recommendedDoctors
        };
      } else {
        spokenText = `It sounds like you need a ${detectedSpecialty}, but we don't have any registered right now.`;
        botReply = {
          id: Date.now() + 1,
          isBot: true,
          text: `My AI analysis suggests a **${detectedSpecialty}**, but currently, we don't have any registered in our system. Please check back later!`
        };
      }
    } else {
      spokenText = "I couldn't confidently match your symptoms to a specific specialty. Could you provide more details?";
      botReply = {
        id: Date.now() + 1,
        isBot: true,
        text: spokenText
      };
    }

    setMessages(prev => [...prev, botReply]);
    speakText(spokenText);
  };

  const handleSend = (e) => {
    e.preventDefault();
    processUserMessage(inputText);
  };

  const handleBookDoctor = (docName) => {
    setIsOpen(false); 
    window.speechSynthesis.cancel(); 
    navigate(`/doctors?search=${encodeURIComponent(docName)}`);
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
                <p className="text-[10px] text-teal-50 font-medium">{isListening ? "Listening..." : "Powered by AI"}</p>
              </div>
            </div>
            <button 
              onClick={() => setVoiceMode(!voiceMode)}
              className="text-2xl bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors cursor-pointer"
              title={voiceMode ? "Mute Bot" : "Unmute Bot"}
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
                  <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>

                {msg.suggestedDoctors && (
                  <div className="mt-2 space-y-2 w-[85%]">
                    {msg.suggestedDoctors.map(doc => (
                      <div key={doc.id} className="bg-white p-2 rounded-xl border border-teal-100 shadow-sm flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img src={doc.image} alt={doc.name} className="w-8 h-8 rounded-full shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                            <p className="text-[10px] text-teal-600 truncate">{doc.clinic}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBookDoctor(doc.name)}
                          className="bg-teal-50 text-teal-700 text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors shrink-0 cursor-pointer"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* NEW: AI "Thinking" Animation */}
            {isThinking && (
              <div className="flex flex-col items-start animate-fade-in-up">
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
              placeholder={isListening ? "Listening..." : "Describe your symptoms..."} 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isListening || isThinking}
              className="flex-1 bg-slate-50 px-4 py-2 text-sm rounded-full border border-slate-200 outline-none focus:border-teal-400 transition-colors disabled:opacity-50"
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