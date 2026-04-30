// components/AvailabilityManager.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'https://mediibook.duckdns.org/api';

function AvailabilityManager({ isOpen, onClose, doctorId, allClinics, onUpdate }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [doctorClinics, setDoctorClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const [formData, setFormData] = useState({
    clinic_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '16:00',
    type_preference: 'mix'
  });

  // جلب عيادات الدكتور المرتبط بها فقط
  const fetchDoctorClinics = async () => {
    setLoadingClinics(true);
    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/clinics`);
      if (res.ok) {
        const data = await res.json();
        setDoctorClinics(data);
        
        // اختيار أول عيادة تلقائيًا
        if (data.length > 0 && !formData.clinic_id) {
          setFormData(prev => ({ ...prev, clinic_id: data[0].id || data[0]._id }));
        }
      } else {
        console.error('Failed to fetch doctor clinics');
        toast.error('فشل في تحميل العيادات المرتبطة');
      }
    } catch (err) {
      console.error('Error fetching doctor clinics:', err);
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchDoctorClinics();
      fetchAvailableSlots();
    }
  }, [isOpen, doctorId]);

  const fetchAvailableSlots = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/available-slots`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleGenerateSlots = async (e) => {
    e.preventDefault();
    
    if (!formData.clinic_id) return toast.error('اختر العيادة');
    if (!formData.date) return toast.error('اختر التاريخ');
    if (!formData.start_time || !formData.end_time) return toast.error('حدد البداية والنهاية');  // ✅ تم التصحيح هنا
    if (formData.start_time >= formData.end_time) return toast.error('النهاية يجب أن تكون بعد البداية');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/generate-slots-range`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `تم إنشاء ${data.count || '?'} موعد`);
        fetchAvailableSlots();
        if (onUpdate) onUpdate();
      } else {
        if (res.status === 403) {
          toast.error('⚠️ أنت غير مرتبط بهذه العيادة. برجاء التواصل مع الإدارة');
          console.error('Affiliation error:', data.debug);
          // تحديث قائمة العيادات
          fetchDoctorClinics();
        } else {
          toast.error(data.error || 'حدث خطأ أثناء الإنشاء');
        }
      }
    } catch (err) {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('متأكد من حذف الموعد ده؟')) return;

    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/available-slots/${slotId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('تم حذف الموعد');
        fetchAvailableSlots();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في الحذف');
      }
    } catch (err) {
      toast.error('فشل الاتصال');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b bg-teal-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-teal-800">إدارة المواعيد المتاحة</h2>
            <p className="text-teal-700 mt-1">حدد الفترة اللي أنت فاضي فيها والنظام هيقسمها لمواعيد</p>
          </div>
          <button onClick={onClose} className="text-3xl text-slate-500 hover:text-rose-600">×</button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          {/* Form - Generate Range */}
          <form onSubmit={handleGenerateSlots} className="space-y-6 bg-slate-50 p-6 rounded-2xl mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">
                  العيادة
                  {doctorClinics.length === 0 && !loadingClinics && (
                    <span className="text-xs text-rose-500 block mt-1">أنت غير مرتبط بأي عيادة حالياً</span>
                  )}
                </label>
                <select
                  value={formData.clinic_id}
                  onChange={e => setFormData({...formData, clinic_id: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  required
                  disabled={loadingClinics || doctorClinics.length === 0}
                >
                  {loadingClinics ? (
                    <option>جاري تحميل العيادات...</option>
                  ) : doctorClinics.length === 0 ? (
                    <option>لا توجد عيادات مرتبطة</option>
                  ) : (
                    <>
                      <option value="">اختر العيادة</option>
                      {doctorClinics.map(c => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">التاريخ</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">من الساعة</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">إلى الساعة</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData({...formData, end_time: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={loading || doctorClinics.length === 0}
                className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'جاري إنشاء المواعيد...' : 'إنشاء المواعيد المتاحة'}
              </button>
            </div>
          </form>

          {/* List of Generated Slots */}
          <div>
            <h3 className="text-xl font-bold mb-4">المواعيد المتاحة الحالية</h3>
            
            {fetching ? (
              <p className="text-center py-8">جاري التحميل...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-center py-12 text-slate-500">لم تقم بإضافة أي فترات متاحة بعد</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSlots.map(slot => (
                  <div key={slot._id} className="border rounded-xl p-4 bg-white shadow-sm">
                    <div className="font-medium">{slot.start_time} – {slot.end_time}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {slot.type === 'consultation' ? 'كشف أولي' : 'متابعة'} • {slot.price} ج.م
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(slot.date).toLocaleDateString('ar-EG')}
                    </div>
                    <button
                      onClick={() => handleDelete(slot._id)}
                      className="mt-3 text-sm text-rose-600 hover:underline"
                    >
                      حذف
                    </button>
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

export default AvailabilityManager;