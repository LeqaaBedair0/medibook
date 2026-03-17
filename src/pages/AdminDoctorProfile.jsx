import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AdminDoctorProfile({ doctors, appointments, onUpdateAppt, onRemoveDoc, onToggleSuspend, onAddAppt }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const doctor = doctors.find(d => d.id === parseInt(id) || d.id === id);
  
  // States for adding a NEW appointment
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [newApptData, setNewApptData] = useState({ date: 'Mon 16', time: '09:00 AM' });

  // NEW: States for EDITING an existing appointment
  const [editingApptId, setEditingApptId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  if (!doctor) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Doctor Not Found</h2>
        <button onClick={() => navigate('/manager-dashboard')} className="text-teal-600 font-bold hover:underline cursor-pointer">← Back to Dashboard</button>
      </div>
    );
  }

  const docAppointments = appointments.filter(appt => appt.doctor.name === doctor.name);
  const uniquePatients = [...new Set(docAppointments.map(a => a.patientName))];

  // --- FINANCIAL MATH ---
  const consultationFee = 150;
  const dailyRevenue = docAppointments.length * consultationFee;
  const weeklyRevenue = dailyRevenue + (12 * consultationFee); 
  const monthlyRevenue = weeklyRevenue * 4 + (8 * consultationFee);
  const yearlyRevenue = monthlyRevenue * 11 + dailyRevenue;

  const handleForceDelete = () => {
    if(window.confirm(`Are you sure you want to completely delete ${doctor.name} from the system?`)) {
      onRemoveDoc(doctor.id);
      navigate('/manager-dashboard');
    }
  };

  const handleAdminAddAppt = (e) => {
    e.preventDefault();
    onAddAppt({ doctor: doctor, date: newApptData.date, time: newApptData.time });
    setShowAddAppt(false);
  };

  // NEW: Handlers for modifying existing appointments
  const startEditing = (appt) => {
    setEditingApptId(appt.id);
    setEditDate(appt.date);
    setEditTime(appt.time);
  };

  const saveEdit = (apptId) => {
    onUpdateAppt(apptId, 'Delayed', editDate, editTime);
    setEditingApptId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      <button onClick={() => navigate('/manager-dashboard')} className="text-slate-500 font-bold hover:text-teal-600 mb-6 flex items-center gap-2 cursor-pointer transition-colors">
        ← Back to Admin Hub
      </button>

      {/* --- HEADER --- */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
        {doctor.isSuspended && (
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <img 
              src={doctor.image} 
              alt={doctor.name} 
              className={`w-24 h-24 rounded-full object-cover border-4 shrink-0 ${doctor.isSuspended ? 'border-amber-100 opacity-75' : 'border-teal-50'}`} 
            />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{doctor.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doctor.isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {doctor.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
              <p className="text-teal-600 font-bold text-lg">{doctor.specialty}</p>
              <p className="text-sm text-slate-500 mt-1">📍 {doctor.clinic} &nbsp;|&nbsp; ⭐ {doctor.rating} Rating</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => onToggleSuspend(doctor.id)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${doctor.isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
            >
              {doctor.isSuspended ? '▶ Restore' : '⏸ Suspend'}
            </button>
            <button 
              onClick={handleForceDelete}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {/* --- FINANCIAL DASHBOARD --- */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Today's Revenue</p>
            <h4 className="text-3xl font-extrabold text-slate-800">${dailyRevenue.toLocaleString()}</h4>
            <p className="text-xs text-emerald-500 font-bold mt-2">↑ Based on {docAppointments.length} bookings</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-teal-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">This Week</p>
            <h4 className="text-3xl font-extrabold text-slate-800">${weeklyRevenue.toLocaleString()}</h4>
            <p className="text-xs text-emerald-500 font-bold mt-2">↑ +12% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">This Month</p>
            <h4 className="text-3xl font-extrabold text-slate-800">${monthlyRevenue.toLocaleString()}</h4>
            <p className="text-xs text-emerald-500 font-bold mt-2">↑ +5% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Year to Date</p>
            <h4 className="text-3xl font-extrabold text-slate-800">${yearlyRevenue.toLocaleString()}</h4>
            <p className="text-xs text-slate-400 font-bold mt-2">On track for annual goal</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* --- LEFT COL: APPOINTMENTS --- */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Master Schedule</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Consultation Fee: ${consultationFee} / session</p>
              </div>
              <button onClick={() => setShowAddAppt(!showAddAppt)} className="w-full sm:w-auto text-teal-600 font-bold text-sm bg-teal-50 px-5 py-2.5 rounded-xl hover:bg-teal-100 cursor-pointer transition-colors">
                + Force Booking
              </button>
            </div>

            {showAddAppt && (
              <form onSubmit={handleAdminAddAppt} className="bg-slate-50 p-5 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 sm:items-end border border-slate-200">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Date</label>
                  <select value={newApptData.date} onChange={e => setNewApptData({...newApptData, date: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-400 bg-white">
                    <option>Mon 16</option><option>Tue 17</option><option>Wed 18</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Time</label>
                  <select value={newApptData.time} onChange={e => setNewApptData({...newApptData, time: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-400 bg-white">
                    <option>09:00 AM</option><option>10:30 AM</option><option>02:00 PM</option>
                  </select>
                </div>
                <button type="submit" className="bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-slate-700 transition-colors w-full sm:w-auto">Book Slot</button>
              </form>
            )}

            <div className="space-y-3">
              {docAppointments.length > 0 ? (
                docAppointments.map(appt => (
                  <div key={appt.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-teal-100 transition-colors bg-white">
                    
                    {/* NEW: Conditional Rendering for Edit Mode */}
                    {editingApptId === appt.id ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full animate-fade-in-up">
                        <select 
                          value={editDate} 
                          onChange={(e) => setEditDate(e.target.value)} 
                          className="w-full sm:w-auto text-sm p-2 rounded-lg border border-slate-200 outline-none focus:border-teal-400"
                        >
                          <option>Mon 16</option><option>Tue 17</option><option>Wed 18</option><option>Thu 19</option>
                        </select>
                        <select 
                          value={editTime} 
                          onChange={(e) => setEditTime(e.target.value)} 
                          className="w-full sm:w-auto text-sm p-2 rounded-lg border border-slate-200 outline-none focus:border-teal-400"
                        >
                          <option>09:00 AM</option><option>10:30 AM</option><option>01:00 PM</option><option>02:30 PM</option>
                        </select>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => saveEdit(appt.id)}
                            className="flex-1 sm:flex-none bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors cursor-pointer"
                          >
                            Save Delay
                          </button>
                          <button 
                            onClick={() => setEditingApptId(null)}
                            className="flex-1 sm:flex-none text-slate-500 bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Normal View */}
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{appt.time} <span className="text-slate-400 text-sm mx-1">•</span> <span className="text-base font-semibold">{appt.date}</span></p>
                          <p className="text-sm text-slate-500 mt-0.5">Patient: <span className="font-bold text-teal-600">{appt.patientName}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full ${appt.status === 'Delayed' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {appt.status}
                          </span>
                          
                          {/* NEW Delay Button */}
                          <button 
                            onClick={() => startEditing(appt)}
                            className="text-amber-600 hover:text-amber-700 text-xs font-bold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            Delay
                          </button>

                          <button 
                            onClick={() => onUpdateAppt(appt.id, 'Cancelled')}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <p className="text-slate-400 font-medium">No appointments on schedule.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COL: PATIENT RECORDS --- */}
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Patient Roster</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Unique patients treated by this doctor.</p>
            
            <div className="space-y-3">
              {uniquePatients.length > 0 ? (
                uniquePatients.map((patient, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 text-lg font-extrabold rounded-full flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      {patient.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-sm truncate">{patient}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">View Record →</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400 text-sm font-medium">No patient history.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDoctorProfile;