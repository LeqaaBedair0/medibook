import React, { useState } from 'react';
import DirectChat from '../components/DirectChat';

function Dashboard({ appointments, onUpdate, currentUser }) {
  
  // 🧠 SMART FILTERING
  const myAppointments = appointments.filter(appt => {
    const dbDoctorName = (appt.doctor?.name || appt.doctor || "").toLowerCase();
    const loggedInName = (currentUser?.name || "").toLowerCase();
    return dbDoctorName.includes(loggedInName) || loggedInName.includes(dbDoctorName);
  });

  // --- NEW: EDITING STATE ---
  const [editingApptId, setEditingApptId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  const startEditing = (appt) => {
    setEditingApptId(appt.id);
    setEditDate(appt.date);
    setEditTime(appt.time);
  };

  const saveEdit = (apptId) => {
    onUpdate(apptId, 'Delayed', editDate, editTime);
    setEditingApptId(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-teal-50 sticky top-24">
          <div className="flex flex-col items-center text-center mb-6">
            <img 
              src={currentUser?.image || "https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff"} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-teal-50 shadow-sm mb-4" 
            />
            <h3 className="font-bold text-lg text-slate-800">{currentUser?.name || "Doctor"}</h3>
            <p className="text-sm text-teal-600 font-bold">{currentUser?.specialty || "Specialist"}</p>
          </div>
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl cursor-pointer">📅 My Schedule</button>
            <button className="w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-teal-600 font-medium rounded-xl transition-colors cursor-pointer">👥 My Patients</button>
          </nav>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 space-y-8">
        
        <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-teal-50">
          <h2 className="text-3xl font-extrabold text-slate-800">Doctor's Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Welcome back, {currentUser?.name}. Here is your schedule.</p>
        </header>

        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Appointments</p>
            <h4 className="text-3xl font-extrabold text-teal-600">{myAppointments.length}</h4>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pending Confirmation</p>
            <h4 className="text-3xl font-extrabold text-amber-500">
              {myAppointments.filter(a => a.status === 'Pending').length}
            </h4>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Completed Today</p>
            <h4 className="text-3xl font-extrabold text-slate-800">0</h4>
          </div>
        </div>

        {/* --- APPOINTMENTS LIST --- */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-teal-50">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Upcoming Appointments</h3>
          
          <div className="space-y-4">
            {myAppointments.length > 0 ? (
              myAppointments.map(appt => (
                <div key={appt.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-teal-100 transition-colors">
                  
                  {/* NEW: Conditional Rendering for Edit Mode */}
                  {editingApptId === appt.id ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full animate-fade-in-up">
                      <select 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)} 
                        className="w-full sm:w-auto text-sm p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-400 bg-white"
                      >
                        <option>Mon 16</option><option>Tue 17</option><option>Wed 18</option><option>Thu 19</option>
                      </select>
                      <select 
                        value={editTime} 
                        onChange={(e) => setEditTime(e.target.value)} 
                        className="w-full sm:w-auto text-sm p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-400 bg-white"
                      >
                        <option>09:00 AM</option><option>10:30 AM</option><option>01:00 PM</option><option>02:30 PM</option>
                      </select>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => saveEdit(appt.id)}
                          className="flex-1 sm:flex-none bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-teal-600 transition-colors cursor-pointer"
                        >
                          Save Delay
                        </button>
                        <button 
                          onClick={() => setEditingApptId(null)}
                          className="flex-1 sm:flex-none text-slate-500 bg-slate-100 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setActiveChat(appt.patientName)}
                          className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                        >
                          💬 Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Normal View */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 font-bold rounded-full flex items-center justify-center text-lg shrink-0">
                          {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{appt.patientName}</h4>
                          <p className="text-sm text-slate-500 font-medium">{appt.date} • {appt.time}</p>
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            appt.status === 'Delayed' ? 'bg-amber-100 text-amber-700' : 
                            appt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>

                      {/* Doctor Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {appt.status !== 'Confirmed' && (
                          <button 
                            onClick={() => onUpdate(appt.id, 'Confirmed')}
                            className="bg-teal-500 text-white hover:bg-teal-600 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        
                        {/* THE NEW DELAY BUTTON */}
                        <button 
                          onClick={() => startEditing(appt)}
                          className="text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Delay
                        </button>

                        <button 
                          onClick={() => onUpdate(appt.id, 'Cancelled')}
                          className="text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-500 font-medium">No active appointments found.</p>
                <p className="text-xs text-slate-400 mt-1">When a patient or manager books you, it will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <DirectChat 
          isOpen={!!activeChat} 
          onClose={() => setActiveChat(null)} 
          contactName={activeChat || ""} 
          contactRole="Patient" 
        />

      </main>
    </div>
  );
}

export default Dashboard;