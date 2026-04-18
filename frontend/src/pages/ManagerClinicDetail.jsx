import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

function ManagerClinicDetail() {
  const { id } = useParams();           // clinic_id من الـ URL
  const navigate = useNavigate();

  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);   // الأطباء المرتبطين بهذه العيادة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // نموذج التعديل
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    image: '',
    imagePreview: '',
  });

  // ────────────────────────────── جلب بيانات العيادة + الأطباء ──────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. جلب العيادة بالـ ID
        const clinicRes = await fetch(`${API_BASE}/clinics/${id}`);
        if (!clinicRes.ok) throw new Error('العيادة غير موجودة');
        const clinicData = await clinicRes.json();

        // 2. جلب كل الأطباء
        const doctorsRes = await fetch(`${API_BASE}/manager/doctors`);
        const allDoctors = await doctorsRes.json();

        // 3. تصفية الأطباء المرتبطين بهذه العيادة فقط
        const clinicDoctors = allDoctors.filter(doc =>
          doc.clinic_affiliations?.some(aff => aff.clinic_id === id)
        );

        setClinic(clinicData);
        setDoctors(clinicDoctors);

        // تهيئة نموذج التعديل
        setFormData({
          name: clinicData.name || '',
          location: clinicData.location || '',
          phone: clinicData.phone || '',
          image: clinicData.image || '',
          imagePreview: clinicData.image || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ────────────────────────────── حفظ تعديل العيادة ──────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        image: formData.image || undefined,
      };

      const res = await fetch(`${API_BASE}/manager/clinic/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحفظ');
      }

      // تحديث البيانات محليًا
      setClinic(prev => ({ ...prev, ...payload }));
      setIsEditing(false);
      alert('تم حفظ تعديلات العيادة بنجاح ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        image: reader.result,
        imagePreview: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // ────────────────────────────── Loading & Error ──────────────────────────────
  if (loading) return <div className="min-h-screen flex items-center justify-center text-3xl text-teal-600">جاري تحميل العيادة...</div>;
  if (error || !clinic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold text-red-600">العيادة غير موجودة</h2>
        <button onClick={() => navigate('/manager')} className="mt-6 bg-teal-600 text-white px-8 py-3 rounded-xl">
          العودة للوحة التحكم
        </button>
      </div>
    );
  }

  const totalDoctors = doctors.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans">
      <button
        onClick={() => navigate('/manager')}
        className="mb-8 text-slate-600 hover:text-teal-700 font-medium flex items-center gap-2"
      >
        ← العودة للوحة التحكم
      </button>

      {/* بطاقة العيادة الرئيسية */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="relative shrink-0">
              <img
                src={isEditing ? formData.imagePreview : (clinic.image || 'https://images.unsplash.com/photo-1576765607925-9f0bfae3a1c6')}
                alt={clinic.name}
                className="w-40 h-40 md:w-52 md:h-52 rounded-3xl object-cover border-4 border-teal-100 shadow-lg"
              />
              {isEditing && (
                <label className="absolute -bottom-3 -right-3 bg-teal-600 text-white text-sm px-5 py-2 rounded-2xl cursor-pointer hover:bg-teal-700">
                  تغيير الصورة
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-6">
                  <input
                    className="text-4xl font-bold border-b-2 border-teal-400 w-full focus:border-teal-600 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    className="text-xl border-b border-slate-300 w-full focus:border-teal-500 outline-none"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="الموقع"
                  />
                  <input
                    className="text-xl border-b border-slate-300 w-full focus:border-teal-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-extrabold text-slate-900">{clinic.name}</h1>
                  <p className="text-xl text-slate-600 mt-2">{clinic.location || 'الموقع غير محدد'}</p>
                  <p className="text-teal-700 font-medium mt-1">☎ {clinic.phone || 'لا يوجد رقم'}</p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-6 md:mt-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 disabled:bg-teal-400"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700"
                  >
                    تعديل العيادة
                  </button>
                  <button
                    onClick={() => alert('سيتم إضافة خاصية الحذف قريبًا')}
                    className="px-8 py-3 bg-rose-50 text-rose-700 rounded-2xl font-bold hover:bg-rose-100"
                  >
                    حذف العيادة
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* التحليلات والإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-3xl text-center border border-teal-200">
          <p className="text-teal-700 font-semibold text-sm">عدد الأطباء</p>
          <div className="text-6xl font-black text-teal-900 mt-3">{totalDoctors}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl text-center border border-blue-200">
          <p className="text-blue-700 font-semibold text-sm">مواعيد اليوم</p>
          <div className="text-6xl font-black text-blue-900 mt-3">0</div>
          <p className="text-xs text-slate-500 mt-2">(سيتم ربطها لاحقًا)</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-3xl text-center border border-amber-200">
          <p className="text-amber-700 font-semibold text-sm">إيرادات اليوم</p>
          <div className="text-6xl font-black text-amber-900 mt-3">0 EGP</div>
        </div>
      </div>

      {/* قائمة الأطباء في العيادة */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">الأطباء في هذه العيادة ({totalDoctors})</h2>
          <button
            onClick={() => navigate('/manager')}
            className="text-teal-600 hover:underline text-sm font-medium"
          >
            + إضافة طبيب جديد
          </button>
        </div>

        {doctors.length === 0 ? (
          <p className="text-slate-500 py-12 text-center">لا يوجد أطباء مرتبطين بهذه العيادة بعد</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => (
              <div
                key={doc.id}
                onClick={() => navigate(`/manager/doctor/${doc.id}`)}
                className="bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md flex gap-5 items-center"
              >
                <img
                  src={doc.image || 'https://i.pravatar.cc/150'}
                  alt={doc.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-300"
                />
                <div>
                  <p className="font-semibold text-lg">{doc.name}</p>
                  <p className="text-teal-700 text-sm">{doc.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerClinicDetail;