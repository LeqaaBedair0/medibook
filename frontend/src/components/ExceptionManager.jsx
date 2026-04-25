// components/ExceptionManager.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

function ExceptionManager({ isOpen, onClose, exceptions, onUpdate, doctorId, allClinics }) {
  const [newException, setNewException] = useState({
    date: new Date().toISOString().split('T')[0],
    clinic_id: 'all', // 'all' means all clinics, otherwise specific clinic ID
    clinic_name: 'All Clinics',
    status: 'unavailable',
    reason: '',
    new_start_time: '09:00',
    new_end_time: '17:00'
  });

  const handleClinicChange = (clinicId) => {
    if (clinicId === 'all') {
      setNewException({
        ...newException,
        clinic_id: 'all',
        clinic_name: 'All Clinics'
      });
    } else {
      const selectedClinic = allClinics.find(c => c._id === clinicId);
      setNewException({
        ...newException,
        clinic_id: clinicId,
        clinic_name: selectedClinic?.name || ''
      });
    }
  };

  const handleAddException = async () => {
    try {
      // Prepare the payload
      const payload = {
        date: newException.date,
        status: newException.status,
        reason: newException.reason,
        clinic_id: newException.clinic_id === 'all' ? null : newException.clinic_id
      };

      if (newException.status === 'modified') {
        payload.new_start_time = newException.new_start_time;
        payload.new_end_time = newException.new_end_time;
      }

      const response = await fetch(`http://localhost:5000/api/doctor/${doctorId}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Exception added for ${newException.clinic_name}`);
        onUpdate();
        setNewException({
          date: new Date().toISOString().split('T')[0],
          clinic_id: 'all',
          clinic_name: 'All Clinics',
          status: 'unavailable',
          reason: '',
          new_start_time: '09:00',
          new_end_time: '17:00'
        });
      } else {
        toast.error(data.error || 'Error adding exception');
      }
    } catch (error) {
      toast.error('Failed to add exception');
    }
  };

  const handleDeleteException = async (exceptionId) => {
    if (!window.confirm('Are you sure you want to delete this exception?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/doctor/${doctorId}/exceptions/${exceptionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Exception deleted');
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to delete exception');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800">Manage Exceptions</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          {/* Add New Exception */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl">
            <h3 className="font-black text-lg mb-4">Add New Exception</h3>
            <div className="space-y-4">
              {/* Clinic Selection */}
              <div>
                <label className="block text-sm font-bold mb-1">Select Clinic</label>
                <select
                  value={newException.clinic_id}
                  onChange={(e) => handleClinicChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200"
                >
                  <option value="all">🏥 All Clinics</option>
                  {allClinics?.map(clinic => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name} - {clinic.location || 'No location'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={newException.date}
                  onChange={(e) => setNewException({...newException, date: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold mb-1">Exception Type</label>
                <select
                  value={newException.status}
                  onChange={(e) => setNewException({...newException, status: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                >
                  <option value="unavailable">🚫 Leave - Clinic Closed</option>
                  <option value="modified">🕐 Modified Hours</option>
                </select>
              </div>

              {/* Modified times */}
              {newException.status === 'modified' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">From</label>
                    <input
                      type="time"
                      value={newException.new_start_time}
                      onChange={(e) => setNewException({...newException, new_start_time: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">To</label>
                    <input
                      type="time"
                      value={newException.new_end_time}
                      onChange={(e) => setNewException({...newException, new_end_time: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-bold mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={newException.reason}
                  onChange={(e) => setNewException({...newException, reason: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  placeholder="e.g., Conference, Emergency, Vacation..."
                />
              </div>

              <button 
                onClick={handleAddException}
                className="w-full bg-teal-500 text-white px-6 py-3 rounded-xl font-black"
                disabled={!newException.clinic_id}
              >
                Add Exception
              </button>
            </div>
          </div>

          {/* Current Exceptions */}
          <div>
            <h3 className="font-black text-lg mb-4">Current Exceptions</h3>
            <div className="space-y-3">
              {exceptions.length > 0 ? (
                exceptions.map((ex) => {
                  const clinic = allClinics.find(c => c._id === ex.clinic_id);
                  return (
                    <div key={ex._id} className={`p-4 rounded-xl ${
                      ex.status === 'unavailable' ? 'bg-rose-50' : 'bg-amber-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold">{ex.date}</p>
                            {ex.clinic_id && (
                              <span className="text-xs bg-white px-2 py-1 rounded-full">
                                {clinic?.name || 'Unknown Clinic'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">
                            {ex.status === 'unavailable' 
                              ? '🚫 Leave - Clinic Closed' 
                              : `🕐 Modified: ${ex.new_start_time} - ${ex.new_end_time}`}
                          </p>
                          {ex.reason && (
                            <p className="text-xs text-slate-500 mt-1">{ex.reason}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDeleteException(ex._id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-center py-4">No exceptions added</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExceptionManager;