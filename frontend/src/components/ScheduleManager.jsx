// components/ScheduleManager.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

function ScheduleManager({ isOpen, onClose, schedule, onAdd, onDelete, slotDurations, onUpdateDurations, doctorId }) {
  const [newSchedule, setNewSchedule] = useState({
    day: 'Monday',
    clinic: '',
    start_time: '09:00',
    end_time: '17:00'
  });

  const [durations, setDurations] = useState(slotDurations);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSchedule.clinic) {
      toast.error('يرجى إدخاسم العيادة');
      return;
    }
    onAdd(newSchedule);
    setNewSchedule({
      day: 'Monday',
      clinic: '',
      start_time: '09:00',
      end_time: '17:00'
    });
  };

  const handleDurationUpdate = async () => {
    try {
      const response = await fetch(`/api/doctor/${doctorId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_duration: durations })
      });

      if (response.ok) {
        toast.success('تم تحديث مدة المواعيد');
        onUpdateDurations(durations);
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800">إدارة الجدول الأسبوعي</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          {/* Add New Schedule */}
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-2xl">
            <h3 className="font-black text-lg mb-4">إضافة موعد أسبوعي جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={newSchedule.day}
                onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
                className="p-3 rounded-xl border border-slate-200"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="اسم العيادة"
                value={newSchedule.clinic}
                onChange={(e) => setNewSchedule({...newSchedule, clinic: e.target.value})}
                className="p-3 rounded-xl border border-slate-200"
              />
              <input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                className="p-3 rounded-xl border border-slate-200"
              />
              <input
                type="time"
                value={newSchedule.end_time}
                onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                className="p-3 rounded-xl border border-slate-200"
              />
            </div>
            <button type="submit" className="mt-4 bg-teal-500 text-white px-6 py-3 rounded-xl font-black">
              إضافة
            </button>
          </form>

          {/* Slot Durations */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl">
            <h3 className="font-black text-lg mb-4">مدة المواعيد (بالدقائق)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">عادي</label>
                <input
                  type="number"
                  value={durations.normal}
                  onChange={(e) => setDurations({...durations, normal: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">استشارة</label>
                <input
                  type="number"
                  value={durations.consultation}
                  onChange={(e) => setDurations({...durations, consultation: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">طوارئ</label>
                <input
                  type="number"
                  value={durations.emergency}
                  onChange={(e) => setDurations({...durations, emergency: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">متابعة</label>
                <input
                  type="number"
                  value={durations.follow_up}
                  onChange={(e) => setDurations({...durations, follow_up: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  min="5"
                  max="120"
                />
              </div>
            </div>
            <button 
              onClick={handleDurationUpdate}
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl font-black"
            >
              حفظ المدد
            </button>
          </div>

          {/* Current Schedule */}
          <div>
            <h3 className="font-black text-lg mb-4">الجدول الحالي</h3>
            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold">{item.day}</p>
                    <p className="text-sm text-slate-500">{item.clinic}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{item.start_time} - {item.end_time}</span>
                    <button 
                      onClick={() => onDelete(item._id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleManager;