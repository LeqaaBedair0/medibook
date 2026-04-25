// components/AppointmentModal.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function AppointmentModal({ isOpen, onClose, onSave, slotDurations, doctorId }) {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    type: 'normal',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      // Fetch patients list - adjust endpoint as needed
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      toast.error('يرجى اختيار مريض');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800">إضافة موعد جديد</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">المريض</label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200"
                required
              >
                <option value="">اختر مريض</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">التاريخ</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">وقت البدء</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">نوع الموعد</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200"
              >
                <option value="normal">عادي ({slotDurations.normal} د)</option>
                <option value="consultation">استشارة ({slotDurations.consultation} د)</option>
                <option value="emergency">طوارئ ({slotDurations.emergency} د)</option>
                <option value="follow_up">متابعة ({slotDurations.follow_up} د)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200"
                rows="3"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <button type="submit" className="w-full bg-teal-500 text-white px-6 py-4 rounded-xl font-black text-lg">
              إضافة الموعد
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AppointmentModal;