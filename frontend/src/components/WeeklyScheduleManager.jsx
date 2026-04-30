// components/WeeklyScheduleManager.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'https://mediibook.duckdns.org/api';

function WeeklyScheduleManager({ isOpen, onClose, doctorId, allClinics, onUpdate }) {
  const [schedules, setSchedules] = useState([]);           // كل الجداول لكل العيادات
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // نموذج إضافة/تعديل
  const [newSlot, setNewSlot] = useState({
    clinic_id: '',
    clinic_name: '',
    day: 'Monday',
    start_time: '09:00',
    end_time: '17:00'
  });

  const [editingSlot, setEditingSlot] = useState(null);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // جلب الجداول لكل العيادات المرتبطة بالدكتور
  const fetchAllSchedules = async () => {
    if (!doctorId) return;
    
    setFetching(true);
    try {
      // 1. جلب العيادات المرتبطة بالدكتور
      const clinicsRes = await fetch(`${API_BASE}/doctor/${doctorId}/clinics`);
      if (!clinicsRes.ok) throw new Error('Failed to fetch doctor clinics');
      
      const doctorClinics = await clinicsRes.json();
      
      if (doctorClinics.length === 0) {
        setSchedules([]);
        return;
      }

      // 2. لكل عيادة جلب الجدول الأسبوعي
      const schedulePromises = doctorClinics.map(async (clinic) => {
        const clinicId = clinic.id || clinic._id;
        
        try {
          const schedRes = await fetch(
            `${API_BASE}/doctor/${doctorId}/clinics/${clinicId}/weekly-schedule`
          );
          
          let scheduleData = { weekly_schedule: [], slot_duration: null };
          if (schedRes.ok) {
            scheduleData = await schedRes.json();
          }

          return {
            clinic_id: clinicId,
            clinic_name: clinic.name,
            clinic_location: clinic.location || 'غير محدد',
            schedule: scheduleData.weekly_schedule || [],
            slot_duration: scheduleData.slot_duration || {
              consultation: 30,
              follow_up: 20,
              buffer_time: 10
            }
          };
        } catch (err) {
          console.warn(`Failed to fetch schedule for clinic ${clinic.name}`);
          return {
            clinic_id: clinicId,
            clinic_name: clinic.name,
            clinic_location: clinic.location || 'غير محدد',
            schedule: [],
            slot_duration: { consultation: 30, follow_up: 20, buffer_time: 10 }
          };
        }
      });

      const results = await Promise.all(schedulePromises);
      setSchedules(results);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      toast.error('تعذر تحميل الجداول الأسبوعية');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchAllSchedules();
      
      // اختيار أول عيادة تلقائيًا
      if (allClinics.length > 0 && !newSlot.clinic_id) {
        const first = allClinics[0];
        setNewSlot(prev => ({
          ...prev,
          clinic_id: first.id || first._id,
          clinic_name: first.name
        }));
      }
    }
  }, [isOpen, doctorId, allClinics]);

  // تغيير العيادة
  const handleClinicChange = (clinicId) => {
    const selected = allClinics.find(c => (c.id || c._id) === clinicId);
    if (selected) {
      setNewSlot({
        ...newSlot,
        clinic_id: clinicId,
        clinic_name: selected.name
      });
    }
  };

  // إضافة موعد جديد لعيادة معينة
  const handleAddSlot = async () => {
    if (!newSlot.clinic_id) return toast.error('اختر العيادة أولاً');
    
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/doctor/${doctorId}/clinics/${newSlot.clinic_id}/weekly-schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: newSlot.day,
            start_time: newSlot.start_time,
            end_time: newSlot.end_time
          })
        }
      );

      if (res.ok) {
        toast.success(`تم إضافة موعد يوم ${newSlot.day} لـ ${newSlot.clinic_name}`);
        fetchAllSchedules();
        if (onUpdate) onUpdate();
        
        // reset form
        setNewSlot(prev => ({
          ...prev,
          day: 'Monday',
          start_time: '09:00',
          end_time: '17:00'
        }));
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل الإضافة');
      }
    } catch (err) {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // بدء تعديل
  const startEdit = (clinicId, slot) => {
    setEditingSlot({
      clinic_id: clinicId,
      slot_id: slot._id,
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
  };

  // حفظ التعديل
  const handleUpdateSlot = async () => {
    if (!editingSlot) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/doctor/${doctorId}/clinics/${editingSlot.clinic_id}/weekly-schedule/${editingSlot.slot_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: editingSlot.day,
            start_time: editingSlot.start_time,
            end_time: editingSlot.end_time
          })
        }
      );

      if (res.ok) {
        toast.success('تم تعديل الموعد بنجاح');
        setEditingSlot(null);
        fetchAllSchedules();
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل التعديل');
      }
    } catch (err) {
      toast.error('فشل الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // حذف
  const handleDeleteSlot = async (clinicId, slotId) => {
    if (!window.confirm('متأكد من حذف هذا الموعد؟')) return;

    try {
      const res = await fetch(
        `${API_BASE}/doctor/${doctorId}/clinics/${clinicId}/weekly-schedule/${slotId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('تم حذف الموعد');
        fetchAllSchedules();
        if (onUpdate) onUpdate();
      } else {
        toast.error('فشل الحذف');
      }
    } catch (err) {
      toast.error('فشل الاتصال');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-cyan-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-teal-900">
              إدارة الجدول الأسبوعي
            </h2>
            <p className="text-teal-700 mt-1">
              حدد أوقات عملك في كل عيادة
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-3xl text-slate-500 hover:text-rose-600 transition"
          >
            ×
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {/* Add / Edit Form */}
          <div className="mb-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
              <span className="bg-teal-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-lg">
                {editingSlot ? '✏️' : '＋'}
              </span>
              {editingSlot ? 'تعديل موعد' : 'إضافة موعد جديد'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Clinic */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  العيادة
                </label>
                <select
                  value={editingSlot ? editingSlot.clinic_id : newSlot.clinic_id}
                  onChange={e => {
                    const val = e.target.value;
                    const clinic = allClinics.find(c => (c.id || c._id) === val);
                    if (editingSlot) {
                      setEditingSlot({...editingSlot, clinic_id: val});
                    } else {
                      setNewSlot({...newSlot, clinic_id: val, clinic_name: clinic?.name || ''});
                    }
                  }}
                  className="w-full p-3 border rounded-xl focus:border-teal-500"
                  disabled={editingSlot}
                >
                  <option value="">اختر العيادة</option>
                  {allClinics.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  اليوم
                </label>
                <select
                  value={editingSlot ? editingSlot.day : newSlot.day}
                  onChange={e => {
                    const val = e.target.value;
                    if (editingSlot) {
                      setEditingSlot({...editingSlot, day: val});
                    } else {
                      setNewSlot({...newSlot, day: val});
                    }
                  }}
                  className="w-full p-3 border rounded-xl focus:border-teal-500"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  من
                </label>
                <input
                  type="time"
                  value={editingSlot ? editingSlot.start_time : newSlot.start_time}
                  onChange={e => {
                    const val = e.target.value;
                    if (editingSlot) {
                      setEditingSlot({...editingSlot, start_time: val});
                    } else {
                      setNewSlot({...newSlot, start_time: val});
                    }
                  }}
                  className="w-full p-3 border rounded-xl focus:border-teal-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  إلى
                </label>
                <input
                  type="time"
                  value={editingSlot ? editingSlot.end_time : newSlot.end_time}
                  onChange={e => {
                    const val = e.target.value;
                    if (editingSlot) {
                      setEditingSlot({...editingSlot, end_time: val});
                    } else {
                      setNewSlot({...newSlot, end_time: val});
                    }
                  }}
                  className="w-full p-3 border rounded-xl focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {editingSlot ? (
                <>
                  <button
                    onClick={handleUpdateSlot}
                    disabled={loading}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديل'}
                  </button>
                  <button
                    onClick={() => setEditingSlot(null)}
                    className="px-8 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddSlot}
                  disabled={loading}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة موعد'}
                </button>
              )}
            </div>
          </div>

          {/* Schedules List */}
          <div>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
              <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-sm">جداولك الحالية</span>
              <span className="text-slate-500 text-sm">
                ({schedules.reduce((sum, c) => sum + c.schedule.length, 0)} موعد)
              </span>
            </h3>

            {fetching ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate-500">جاري تحميل الجداول...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed">
                <p className="text-slate-500 font-medium">لا توجد جداول أسبوعية مضافة بعد</p>
              </div>
            ) : (
              <div className="space-y-6">
                {schedules.map(clinic => (
                  <div key={clinic.clinic_id} className="border rounded-2xl p-6 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b">
                      <div>
                        <h4 className="text-xl font-bold">{clinic.clinic_name}</h4>
                        <p className="text-sm text-slate-500">{clinic.clinic_location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-teal-700">
                          مدة الكشف: {clinic.slot_duration.consultation} د
                        </p>
                        <p className="text-xs text-slate-500">
                          متابعة: {clinic.slot_duration.follow_up} د • استراحة: {clinic.slot_duration.buffer_time} د
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clinic.schedule.length > 0 ? (
                        clinic.schedule.map(slot => (
                          <div 
                            key={slot._id}
                            className="bg-slate-50 p-4 rounded-xl border hover:border-teal-200 transition-all group"
                          >
                            {editingSlot?.slot_id === slot._id ? (
                              <div className="space-y-3">
                                <select
                                  value={editingSlot.day}
                                  onChange={e => setEditingSlot({...editingSlot, day: e.target.value})}
                                  className="w-full p-2 border rounded-lg text-sm"
                                >
                                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="time"
                                    value={editingSlot.start_time}
                                    onChange={e => setEditingSlot({...editingSlot, start_time: e.target.value})}
                                    className="p-2 border rounded-lg"
                                  />
                                  <input
                                    type="time"
                                    value={editingSlot.end_time}
                                    onChange={e => setEditingSlot({...editingSlot, end_time: e.target.value})}
                                    className="p-2 border rounded-lg"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateSlot}
                                    className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm hover:bg-teal-700"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    onClick={() => setEditingSlot(null)}
                                    className="flex-1 bg-slate-200 py-2 rounded-lg text-sm hover:bg-slate-300"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold">{slot.day}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {slot.start_time} – {slot.end_time}
                                  </p>
                                </div>
                                <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => startEdit(clinic.clinic_id, slot)}
                                    className="p-2 hover:bg-teal-100 rounded-lg text-teal-600"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(clinic.clinic_id, slot._id)}
                                    className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-slate-400">
                          لا توجد مواعيد محددة لهذه العيادة
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyScheduleManager;