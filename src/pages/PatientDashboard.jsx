import React, { useState } from 'react';
import DirectChat from '../components/DirectChat';

function PatientDashboard({ appointments = [], onUpdate }) {
  // Local state for delay logic
  const [editingId, setEditingId] = useState(null);
  const [tempDate, setTempDate] = useState('Mon 16');
  const [tempTime, setTempTime] = useState('09:00 AM');
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="min-h-[85vh] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-teal-50">
          <div className="flex flex-col items-center text-center mb-6">
            <img src="https://i.pravatar.cc/150?img=44" alt="Profile" className="w-24 h-24 rounded-full border-4 border-teal-50 shadow-sm mb-4" />
            <h3 className="font-bold text-lg text-slate-800">Leqaa Bedair</h3>
            <p className="text-sm text-slate-500">Cairo, Egypt</p>
          </div>
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl">📋 My Appointments</button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">My Appointments 👋</h2>
          <p className="text-slate-500 mt-2">Manage your upcoming visits or propose a new time.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-teal-50">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Active Bookings</h3>
          
          <div className="space-y-4">
            {appointments && appointments.length > 0 ? (
              appointments.map((appt) => (
                <div key={appt.id} className="p-5 rounded-2xl border border-gray-100 hover:border-teal-100 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Doctor Info */}
                    <div className="flex items-center gap-4">
                      <img src={appt.doctor?.image} className="w-14 h-14 rounded-full object-cover border-2 border-teal-50" alt="Doctor" />
                      <div>
                        <h4 className="font-bold text-slate-800">{appt.doctor?.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{appt.date} • {appt.time}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          appt.status === 'Delayed' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveChat(appt.patientName)}
                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                      >
                        💬 Message
                      </button>
                    </div>

                    {/* Action Area */}
                    <div className="flex gap-2 items-center">
                      {editingId === appt.id ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-fade-in-up">
                          <select 
                            value={tempDate} 
                            onChange={(e) => setTempDate(e.target.value)} 
                            className="text-xs p-2 rounded-lg border border-gray-200 outline-none"
                          >
                            <option>Mon 16</option>
                            <option>Tue 17</option>
                            <option>Wed 18</option>
                            <option>Thu 19</option>
                          </select>
                          <select 
                            value={tempTime} 
                            onChange={(e) => setTempTime(e.target.value)} 
                            className="text-xs p-2 rounded-lg border border-gray-200 outline-none"
                          >
                            <option>09:00 AM</option>
                            <option>10:30 AM</option>
                            <option>01:00 PM</option>
                            <option>02:30 PM</option>
                            <option>04:00 PM</option>
                          </select>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { onUpdate(appt.id, 'Delayed', tempDate, tempTime); setEditingId(null); }}
                              className="bg-teal-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 px-3 py-2 text-xs font-bold hover:text-slate-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => setEditingId(appt.id)}
                            className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            Delay Visit
                          </button>
                          <button 
                            onClick={() => onUpdate(appt.id, 'Cancelled')}
                            className="px-4 py-2 text-xs font-bold text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-medium">No active appointments yet.</p>
              </div>
            )}
          </div>
        </div>

        <DirectChat 
          isOpen={!!activeChat} 
          onClose={() => setActiveChat(null)} 
          contactName={activeChat || ""} 
          contactRole="Doctor" 
        />
      </main>
    </div>
  );
}

export default PatientDashboard;