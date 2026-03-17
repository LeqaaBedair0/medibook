import React, { useState, useEffect, useRef } from 'react';

function DirectChat({ isOpen, onClose, contactName, contactRole }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: contactName, text: `Hello! This is a secure channel. How can I help you today?`, isMe: false }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Add my message
    setMessages([...messages, { id: Date.now(), sender: 'Me', text, isMe: true }]);
    setText('');

    // Simulate the other person replying after 1.5 seconds!
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: contactName, 
        text: `Thank you for your message. I will check on this right away.`, 
        isMe: false 
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-teal-100 flex flex-col overflow-hidden z-[60] h-[450px] animate-fade-in-up">
      
      {/* Chat Header */}
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center font-bold">
            {contactName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm">{contactName}</h3>
            <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">{contactRole}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-slate-400 font-bold mb-1 mx-1">{msg.isMe ? 'You' : msg.sender}</span>
            <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
              msg.isMe ? 'bg-teal-500 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-50 px-4 py-2 text-sm rounded-full border border-slate-200 outline-none focus:border-teal-400"
        />
        <button type="submit" disabled={!text.trim()} className="bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-700 cursor-pointer disabled:opacity-50">
          ➤
        </button>
      </form>
    </div>
  );
}

export default DirectChat;