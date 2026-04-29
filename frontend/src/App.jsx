import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/PatientDashboard";
import Clinics from "./pages/Clinics";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDoctorProfile from "./pages/AdminDoctorProfile";

// Components
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";
import LanguageSwitcher from "./components/LanguageSwitcher";

// ✅ API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://16.171.29.212:8000';

function App() {
  const { t, i18n } = useTranslation();
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ جلب الأطباء الحقيقيين من الـ Backend
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/manager/doctors`);
      
      if (response.ok) {
        const doctors = await response.json();
        console.log('📋 Doctors loaded from API:', doctors);
        
        // تحويل البيانات لتتناسب مع تنسيق التطبيق
        const formattedDoctors = doctors.map(doc => ({
          id: doc.id || doc._id,
          name: doc.name,
          specialty: doc.specialty,
          clinic: doc.clinic_affiliations?.[0]?.clinic_name || "Independent Clinic",
          rating: doc.rating || 0,
          image: doc.image || "https://i.pravatar.cc/150",
          isSuspended: doc.isSuspended || false,
          reviews: doc.reviews || [],
          price: doc.price || 200
        }));
        
        setDoctorsList(formattedDoctors);
      } else {
        console.error('Failed to fetch doctors:', response.status);
        setDoctorsList([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctorsList([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ جلب المواعيد الحقيقية للمستخدم الحالي
  const fetchAppointments = async (userId, role) => {
    if (!userId) return;
    
    try {
      let endpoint = '';
      if (role === 'patient') {
        endpoint = `${API_BASE_URL}/api/patient/${userId}/appointments`;
      } else if (role === 'doctor') {
        endpoint = `${API_BASE_URL}/api/doctor/${userId}/all-appointments`;
      } else {
        return;
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const appointmentsList = data.appointments || data || [];
        
        // تحويل البيانات
        const formattedAppointments = appointmentsList.map(apt => ({
          id: apt._id || apt.id,
          patientName: apt.patient_name || apt.patientName || "Patient",
          doctor: apt.doctor_name || apt.doctorName,
          doctorId: apt.doctor_id,
          date: apt.date,
          time: apt.start_time || apt.time,
          status: apt.status || "pending",
          type: apt.type,
          price: apt.price
        }));
        
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // ✅ تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    fetchDoctors();
  }, []);

  // ✅ تحميل المواعيد عند تسجيل الدخول
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchAppointments(currentUser.id, currentRole);
    }
  }, [currentUser, currentRole]);

  // --- AUTH ---
  const handleAuth = async (userData) => {
    setCurrentRole(userData.role);
    setCurrentUser(userData);
    
    // تحديث قائمة الأطباء بعد تسجيل الدخول (للتأكد من أحدث البيانات)
    await fetchDoctors();
  };

  const handleSignup = async (userData) => {
    setCurrentRole(userData.role);
    setCurrentUser(userData);
    
    // تحديث قائمة الأطباء بعد إضافة دكتور جديد
    if (userData.role === "doctor") {
      await fetchDoctors();
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    setAppointments([]);
    setIsMenuOpen(false);
  };

  // --- APPOINTMENTS ---
  const handleNewBooking = async (bookingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: currentUser?.id,
          doctor_id: bookingData.doctorId,
          clinic_id: bookingData.clinicId,
          date: bookingData.date,
          start_time: bookingData.time,
          type: bookingData.type || "consultation",
          price: bookingData.price
        })
      });
      
      if (response.ok) {
        // إعادة تحميل المواعيد بعد الحجز
        if (currentUser?.id) {
          await fetchAppointments(currentUser.id, currentRole);
        }
        
        // إظهار رسالة نجاح للمستخدم
        alert("تم حجز الموعد بنجاح!");
      } else {
        const error = await response.json();
        alert(`خطأ في الحجز: ${error.error}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert("حدث خطأ أثناء حجز الموعد");
    }
  };

  const updateAppointmentStatus = async (id, newStatus, newDate = null, newTime = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // تحديث المواعيد محلياً
        if (newStatus === "cancelled") {
          setAppointments(appointments.filter((appt) => appt.id !== id));
        } else {
          setAppointments(
            appointments.map((appt) =>
              appt.id === id
                ? {
                    ...appt,
                    status: newStatus,
                    date: newDate || appt.date,
                    time: newTime || appt.time,
                  }
                : appt
            )
          );
        }
        
        // إعادة تحميل المواعيد من الـ API
        if (currentUser?.id) {
          await fetchAppointments(currentUser.id, currentRole);
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  // --- ADMIN SETTINGS ---
  const removeDoctor = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/doctor/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchDoctors(); // إعادة تحميل القائمة
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
    }
  };
  
  const addDoctor = async (newDoc) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/add-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      
      if (response.ok) {
        await fetchDoctors(); // إعادة تحميل القائمة
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
    }
  };
  
  const toggleDoctorSuspension = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/doctor/${id}/toggle-suspend`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        await fetchDoctors(); // إعادة تحميل القائمة
      }
    } catch (error) {
      console.error('Error toggling doctor suspension:', error);
    }
  };

  // --- REVIEWS & RATINGS LOGIC ---
  const submitReview = async (doctorId, rating, comment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: currentUser?.id,
          rating: rating,
          comment: comment,
          appointment_id: null // يمكن تعديلها حسب الحاجة
        })
      });
      
      if (response.ok) {
        await fetchDoctors(); // إعادة تحميل الأطباء لتحديث التقييمات
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 font-sans relative flex flex-col ${i18n.language === 'ar' ? 'font-cairo' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* NAVBAR */}
      <nav className="bg-white p-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 border-b border-teal-50 shadow-sm relative">
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl font-bold text-teal-600"
        >
          MediBook 🩺
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/clinics"
            className="text-slate-600 font-semibold hover:text-teal-600 transition-colors"
          >
            {t('nav.clinics')}
          </Link>
          <Link
            to="/doctors"
            className="text-slate-600 font-semibold hover:text-teal-600 transition-colors"
          >
            {t('nav.doctors')}
          </Link>
          
          <LanguageSwitcher />
          
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

          {!currentRole ? (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-teal-600 font-bold hover:underline"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="bg-teal-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-teal-400 transition-colors"
              >
                {t('nav.signup')}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {currentRole === "manager" && (
                <Link
                  to="/manager-dashboard"
                  className="text-purple-700 font-bold bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  {t('nav.adminPortal')} 👑
                </Link>
              )}
              {currentRole === "doctor" && (
                <Link
                  to="/dashboard"
                  className="text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors"
                >
                  {t('nav.docPortal')}
                </Link>
              )}
              {currentRole === "patient" && (
                <Link
                  to="/patient-dashboard"
                  className="text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors"
                >
                  {t('nav.myPortal')}
                </Link>
              )}
              {currentUser?.image && (
                <img
                  src={currentUser.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                />
              )}
              <button
                onClick={handleLogout}
                className="bg-rose-50 text-rose-500 p-2 rounded-full hover:bg-rose-100 cursor-pointer transition-colors"
                title={t('nav.logout')}
              >
                🚪
              </button>
            </div>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-800 text-3xl focus:outline-none cursor-pointer transition-transform duration-200"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>

        {/* MOBILE DROPDOWN MENU */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-teal-100 flex flex-col p-6 gap-6 md:hidden shadow-2xl z-40 animate-fade-in-down">
            <div className="flex justify-between items-center">
              <Link
                onClick={() => setIsMenuOpen(false)}
                to="/clinics"
                className="text-lg font-bold text-slate-700"
              >
                {t('nav.clinics')}
              </Link>
              <Link
                onClick={() => setIsMenuOpen(false)}
                to="/doctors"
                className="text-lg font-bold text-slate-700"
              >
                {t('nav.doctors')}
              </Link>
              <LanguageSwitcher />
            </div>
            <hr className="border-slate-100" />

            {!currentRole ? (
              <div className="flex flex-col gap-4">
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/login"
                  className="text-lg font-bold text-teal-600 text-center py-3 bg-teal-50 rounded-xl transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/signup"
                  className="text-lg font-bold text-white text-center py-3 bg-teal-500 rounded-xl shadow-md transition-colors hover:bg-teal-400"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {currentRole === "manager" && (
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/manager-dashboard"
                    className="text-purple-700 font-bold text-center bg-purple-50 py-3 rounded-xl"
                  >
                    {t('nav.adminPortal')} 👑
                  </Link>
                )}
                {currentRole === "doctor" && (
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/dashboard"
                    className="text-teal-700 font-bold text-center bg-teal-50 py-3 rounded-xl"
                  >
                    {t('nav.docPortal')}
                  </Link>
                )}
                {currentRole === "patient" && (
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/patient-dashboard"
                    className="text-teal-700 font-bold text-center bg-teal-50 py-3 rounded-xl"
                  >
                    {t('nav.myPortal')}
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-center text-lg font-bold text-rose-500 bg-rose-50 py-3 rounded-xl"
                >
                  {t('nav.logout')} 🚪
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ROUTES */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route
            path="/doctors"
            element={
              <Doctors
                onBookAppointment={handleNewBooking}
                doctorsData={doctorsList}
                onAddReview={submitReview}
              />
            }
          />
          <Route path="/login" element={<Login onLogin={handleAuth} />} />
          <Route
            path="/signup"
            element={<Signup onSignup={handleSignup} />}
          />
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute userRole={currentRole} requiredRole="manager">
                <ManagerDashboard
                  doctors={doctorsList}
                  appointments={appointments}
                  onRemoveDoc={removeDoctor}
                  onAddDoc={addDoctor}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/doctor/:id"
            element={
              <ProtectedRoute userRole={currentRole} requiredRole="manager">
                <AdminDoctorProfile
                  doctors={doctorsList}
                  appointments={appointments}
                  onUpdateAppt={updateAppointmentStatus}
                  onRemoveDoc={removeDoctor}
                  onToggleSuspend={toggleDoctorSuspension}
                  onAddAppt={handleNewBooking}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute userRole={currentRole} requiredRole="doctor">
                <Dashboard
                  appointments={appointments}
                  onUpdate={updateAppointmentStatus}
                  currentUser={currentUser}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute userRole={currentRole} requiredRole="patient">
                <PatientDashboard
                  appointments={appointments}
                  onUpdate={updateAppointmentStatus}
                  currentUser={currentUser}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      <Footer />
      <Chatbot doctorsList={doctorsList} />
    </div>
  );
}

export default App;