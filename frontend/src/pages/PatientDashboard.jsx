// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import DirectChat from '../components/DirectChat';
import RatingModal from '../components/RatingModal';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

const SPECIALTIES_LIST = [
  "Cardiology", "Pediatrics", "Dermatology", "General Surgery", "Orthopedics",
  "Gynecology & Obstetrics", "Ophthalmology", "ENT", "Neurology", "Psychiatry",
  "Internal Medicine", "Urology", "Radiology", "Anesthesiology", "Oncology", "Dentist"
];

function PatientDashboard({ currentUser }) {
  const [language, setLanguage] = useState('en');
  
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  // VIP Health Summary States
  const [patientHealthSummary, setPatientHealthSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showVipChat, setShowVipChat] = useState(false);
  const [currentImprovement, setCurrentImprovement] = useState(0);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [clinicsMap, setClinicsMap] = useState({});
  const [clinicsList, setClinicsList] = useState([]);

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsByType, setSlotsByType] = useState({ consultation: [], follow_up: [] });
  const [selectedSlotType, setSelectedSlotType] = useState('all');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingData, setBookingData] = useState({
    doctor_id: '',
    clinic_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    type: ''
  });

  // Reviews
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAppointmentForRating, setSelectedAppointmentForRating] = useState(null);
  const [patientReviews, setPatientReviews] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // Doctor Reviews Modal
  const [showDoctorReviewsModal, setShowDoctorReviewsModal] = useState(false);
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedDoctorForReviews, setSelectedDoctorForReviews] = useState(null);
  const [doctorStats, setDoctorStats] = useState({});

  // Translations
  const translations = {
    en: {
      loading: 'Loading...',
      welcome: 'Welcome',
      back: 'Back',
      patientAccount: 'Patient Account',
      myAppointments: 'My Appointments',
      findDoctor: 'Find a Doctor',
      myReviews: 'My Reviews',
      welcomeMessage: 'Manage your appointments or book a new one with top doctors',
      findDoctorTitle: 'Find a Doctor',
      specialty: 'Specialty',
      allSpecialties: 'All Specialties',
      clinic: 'Clinic',
      allClinics: 'All Clinics',
      availableDoctors: 'Available Doctors',
      noDoctorsMatch: 'No doctors match your filters',
      tryChanging: 'Try changing the specialty or clinic',
      dr: 'Dr.',
      generalPractitioner: 'General Practitioner',
      notAffiliated: 'Not affiliated with a clinic',
      unnamedClinic: 'Unnamed Clinic',
      reviews: 'Reviews',
      bookAppointment: 'Book Appointment',
      myAppointmentsTitle: 'My Appointments',
      noAppointments: 'No appointments booked yet',
      findDoctorNow: 'Find a doctor now →',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed',
      rateVisit: '⭐ Rate Visit',
      rated: 'Rated',
      messageDoctor: 'Message Doctor',
      cancelAppointment: 'Cancel Appointment',
      bookNewAppointment: 'Book New Appointment',
      selectDate: 'Select Date',
      availableSlots: 'Available Slots',
      loadingSlots: '(Loading...)',
      noSlots: 'No available slots for this date',
      tryAnotherDate: 'Try another date or contact the doctor',
      all: 'All',
      consultation: 'Consultation',
      followUp: 'Follow-up',
      min: 'min',
      price: '$',
      confirmBooking: 'Confirm Booking',
      booking: 'Booking...',
      selectTimeAndClinic: 'Please select a time and clinic',
      bookingSuccess: 'Appointment booked successfully!',
      bookingFailed: 'Booking failed',
      connectionFailed: 'Failed to connect to server',
      cancelConfirm: 'Are you sure you want to cancel this appointment?',
      cancelSuccess: 'Appointment cancelled',
      cancelFailed: 'Cancellation failed',
      loadFailed: 'Failed to load',
      myReviewsTitle: 'My Reviews',
      noReviewsYet: 'You haven\'t written any reviews yet',
      reviewsFor: 'Reviews for Dr.',
      noDoctorReviews: 'No reviews for this doctor yet',
      patient: 'Patient',
      languageToggle: 'العربية',
      consultation_type: 'Consultation',
      followup_type: 'Follow-up',
      status: 'Status',
      priceLabel: 'Price',
      rating: 'Rating',
      stars: 'stars',
      outOf5: 'out of 5',
      ratingDistribution: 'Rating Distribution',
      featured: '🌟 Featured',
      review: 'review'
    },
    ar: {
      loading: 'جاري التحميل...',
      welcome: 'مرحباً',
      back: 'مرحباً بعودتك',
      patientAccount: 'حساب مريض',
      myAppointments: 'مواعيدي',
      findDoctor: 'ابحث عن دكتور',
      myReviews: 'تقييماتي',
      welcomeMessage: 'إدارة مواعيدك أو حجز موعد جديد مع أفضل الأطباء',
      findDoctorTitle: 'ابحث عن طبيب',
      specialty: 'التخصص',
      allSpecialties: 'جميع التخصصات',
      clinic: 'العيادة',
      allClinics: 'جميع العيادات',
      availableDoctors: 'الأطباء المتاحين',
      noDoctorsMatch: 'لا يوجد أطباء مطابقين للفلاتر الحالية',
      tryChanging: 'جرب تغيير التخصص أو العيادة',
      dr: 'د.',
      generalPractitioner: 'أخصائي عام',
      notAffiliated: 'غير مرتبط بعيادة',
      unnamedClinic: 'عيادة غير مسماة',
      reviews: 'التقييمات',
      bookAppointment: 'حجز موعد',
      myAppointmentsTitle: 'مواعيدي',
      noAppointments: 'لا توجد مواعيد محجوزة حالياً',
      findDoctorNow: 'ابحث عن دكتور الآن ←',
      confirmed: 'محجوز',
      cancelled: 'ملغي',
      completed: 'مكتمل',
      rateVisit: '⭐ تقييم الزيارة',
      rated: 'تم التقييم',
      messageDoctor: 'مراسلة الدكتور',
      cancelAppointment: 'إلغاء الموعد',
      bookNewAppointment: 'حجز موعد جديد',
      selectDate: 'اختر التاريخ',
      availableSlots: 'المواعيد المتاحة',
      loadingSlots: '(جاري التحميل...)',
      noSlots: 'لا توجد مواعيد متاحة في هذا اليوم',
      tryAnotherDate: 'جرب تاريخ آخر أو تواصل مع الطبيب',
      all: 'الكل',
      consultation: 'كشف أولي',
      followUp: 'متابعة',
      min: 'د',
      price: 'ج.م',
      confirmBooking: 'تأكيد الحجز',
      booking: 'جاري الحجز...',
      selectTimeAndClinic: 'يرجى اختيار موعد وعيادة',
      bookingSuccess: 'تم حجز الموعد بنجاح!',
      bookingFailed: 'فشل الحجز',
      connectionFailed: 'فشل الاتصال بالخادم',
      cancelConfirm: 'هل أنت متأكد من إلغاء هذا الموعد؟',
      cancelSuccess: 'تم إلغاء الموعد',
      cancelFailed: 'فشل الإلغاء',
      loadFailed: 'فشل التحميل',
      myReviewsTitle: 'تقييماتي',
      noReviewsYet: 'لم تقم بكتابة أي تقييم بعد',
      reviewsFor: 'تقييمات د.',
      noDoctorReviews: 'لم يتم كتابة أي تقييم لهذا الدكتور بعد',
      patient: 'مريض',
      languageToggle: 'English',
      consultation_type: 'كشف أولي',
      followup_type: 'متابعة',
      status: 'الحالة',
      priceLabel: 'السعر',
      rating: 'التقييم',
      stars: 'نجوم',
      outOf5: 'من أصل 5',
      ratingDistribution: 'توزيع التقييمات',
      featured: '🌟 متميز',
      review: 'تقييم'
    }
  };

  const t = translations[language];
  const isRTL = language === 'ar';

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyAppointments();
      fetchAllDoctorsAndClinics();
      fetchPatientReviews();
      fetchHealthSummary();
    }
  }, [currentUser, language]);

  useEffect(() => {
    applyFilters();
  }, [doctors, selectedSpecialty, selectedClinic, clinicsMap]);

  // ─── Fetch My Appointments (SQLite compatible) ───
  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/patient/${currentUser.id}/appointments`);
      if (!res.ok) throw new Error('Failed to fetch appointments');

      const data = await res.json();
      const appointmentsWithReview = await Promise.all(
        (data.appointments || []).map(async (appt) => {
          if (appt.status === 'completed') {
            try {
              const reviewRes = await fetch(`${API_BASE}/appointments/${appt._id}/check-review`);
              const reviewData = await reviewRes.json();
              return { ...appt, hasReview: reviewData.has_review || false };
            } catch {
              return { ...appt, hasReview: false };
            }
          }
          return appt;
        })
      );
      setAppointments(appointmentsWithReview);
    } catch (err) {
      console.error('Appointments error:', err);
      toast.error(t.loadFailed + ' ' + t.myAppointments);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch VIP Health Summary (Smart Medical Coach) ───
  const fetchHealthSummary = async () => {
    if (!currentUser?.id) return;

    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/patient/${currentUser.id}/vip-health-summary`);
      
      if (res.ok) {
        const data = await res.json();
        setPatientHealthSummary(data);
        
        // Use previous improvement percentage if available
        if (data.improvement_percentage !== undefined) {
          setCurrentImprovement(data.improvement_percentage);
        }
      } else {
        // No history yet → show encouragement message
        setPatientHealthSummary({
          has_history: false,
          message: language === 'ar' 
            ? "ابدأ رحلة متابعتك الصحية مع المدرب الذكي" 
            : "Start your personalized health tracking journey"
        });
      }
    } catch (err) {
      console.error('Failed to fetch health summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // ─── Fetch Doctors + Clinics (SQLite compatible) ───
  const fetchAllDoctorsAndClinics = async () => {
    try {
      // 1. Fetch clinics
      const clinicsRes = await fetch(`${API_BASE}/manager/clinics`);
      if (!clinicsRes.ok) throw new Error('Failed to fetch clinics');
      const clinicsData = await clinicsRes.json();

      const clinicMap = {};
      const clinicNames = new Set();
      clinicsData.forEach(c => {
        const id = c._id || c.id;
        const name = c.name || (language === 'en' ? `Clinic ${id}` : `عيادة ${id}`);
        clinicMap[id] = name;
        clinicNames.add(name);
      });

      setClinicsMap(clinicMap);
      setClinicsList(Array.from(clinicNames));

      // 2. Fetch doctors
      const doctorsRes = await fetch(`${API_BASE}/manager/doctors`);
      if (!doctorsRes.ok) throw new Error('Failed to fetch doctors');
      const doctorsData = await doctorsRes.json();

      const enhancedDoctors = doctorsData.map(doc => {
        const affiliationsWithNames = (doc.clinic_affiliations || []).map(aff => ({
          ...aff,
          clinic_name: clinicMap[aff.clinic_id] || (language === 'en' ? 'Unknown Clinic' : 'عيادة غير معروفة')
        }));

        const prices = doc.clinic_affiliations?.[0]?.prices || {
          consultation: 0,
          follow_up: 0
        };

        return {
          ...doc,
          id: doc._id || doc.id,
          image: doc.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=0D9488&color=fff&size=128`,
          clinic_affiliations: affiliationsWithNames,
          prices: prices
        };
      });

      setDoctors(enhancedDoctors);
      setFilteredDoctors(enhancedDoctors);
    } catch (err) {
      console.error('Fetch doctors/clinics error:', err);
      toast.error(t.loadFailed + ' ' + t.findDoctor);
    }
  };

  const applyFilters = () => {
    let result = [...doctors];

    if (selectedSpecialty !== 'all') {
      result = result.filter(d => 
        d.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    if (selectedClinic !== 'all') {
      result = result.filter(d => 
        d.clinic_affiliations?.some(a => a.clinic_name === selectedClinic)
      );
    }

    setFilteredDoctors(result);
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSlotsByType({ consultation: [], follow_up: [] });

    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/available-slots?date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const slots = data.slots || [];

      const grouped = { consultation: [], follow_up: [] };
      slots.forEach(s => {
        if (s.type === 'consultation') grouped.consultation.push(s);
        if (s.type === 'follow_up') grouped.follow_up.push(s);
      });

      setAvailableSlots(slots);
      setSlotsByType(grouped);

      if (!slots.length) toast(t.noSlots, { icon: '📅' });
    } catch (err) {
      console.error(err);
      toast.error(t.loadFailed + ' ' + t.availableSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchPatientReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/patient/${currentUser.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setPatientReviews(data.reviews || []);
      }
    } catch (err) {
      console.warn('Patient reviews fetch failed', err);
    }
  };

  const fetchDoctorReviews = async (doctorId, doctorName) => {
    setReviewsLoading(true);
    setDoctorReviews([]);
    setSelectedDoctorForReviews(doctorName);
    setDoctorStats({});

    try {
      const res = await fetch(`${API_BASE}/doctor/${doctorId}/reviews`);
      if (!res.ok) throw new Error('Failed to load doctor reviews');
      const data = await res.json();
      setDoctorReviews(data.reviews || []);
      
      const reviews = data.reviews || [];
      const totalRatings = reviews.length;
      const averageRating = totalRatings > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : 0;
      
      setDoctorStats({
        average: averageRating,
        total: totalRatings,
        distribution: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length
        }
      });
    } catch (err) {
      toast.error(t.loadFailed + ' ' + t.reviews);
    } finally {
      setReviewsLoading(false);
    }
  };

  const openDoctorReviews = (doctor) => {
    fetchDoctorReviews(doctor.id, doctor.name);
    setShowDoctorReviewsModal(true);
  };

  const handleBookAppointment = async () => {
    if (!bookingData.start_time || !bookingData.clinic_id) {
      return toast.error(t.selectTimeAndClinic);
    }

    try {
      toast.loading(t.booking, { id: 'booking' });

      const res = await fetch(`${API_BASE}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: parseInt(currentUser.id),
          doctor_id: parseInt(selectedDoctor.id),
          clinic_id: parseInt(bookingData.clinic_id),
          date: bookingData.date,
          time_slot: bookingData.start_time,
          type: bookingData.type
        })
      });
      

      const result = await res.json();

      if (res.ok) {
        toast.success(t.bookingSuccess, { id: 'booking' });
        setShowBookingModal(false);
        fetchMyAppointments();
        setBookingData({
          doctor_id: '',
          clinic_id: '',
          date: new Date().toISOString().split('T')[0],
          start_time: '',
          type: ''
        });
        setAvailableSlots([]);
      } else {
        toast.error(result.error || t.bookingFailed, { id: 'booking' });
      }
    } catch (err) {
      toast.error(t.connectionFailed, { id: 'booking' });
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm(t.cancelConfirm)) return;

    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (res.ok) {
        toast.success(t.cancelSuccess);
        fetchMyAppointments();
      } else {
        const err = await res.json();
        toast.error(err.error || t.cancelFailed);
      }
    } catch (err) {
      toast.error(t.connectionFailed);
    }
  };

  const handleRateAppointment = (appt) => {
    setSelectedAppointmentForRating(appt);
    setShowRatingModal(true);
  };

  const getPrimaryClinicName = (doc) => {
    if (!doc.clinic_affiliations?.length) return t.notAffiliated;
    return doc.clinic_affiliations[0].clinic_name || t.unnamedClinic;
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getTypeInfo = (type) => ({
    consultation: { 
      label: language === 'en' ? 'Consultation' : 'كشف أولي', 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700',
      icon: '💬' 
    },
    follow_up: { 
      label: language === 'en' ? 'Follow-up' : 'متابعة', 
      bg: 'bg-amber-50', 
      text: 'text-amber-700',
      icon: '🔄' 
    }
  }[type] || { 
    label: language === 'en' ? 'Appointment' : 'موعد', 
    bg: 'bg-gray-50', 
    text: 'text-gray-700',
    icon: '📅' 
  });

  const formatPrice = (price) => {
    return price.toLocaleString() + ' ' + (language === 'en' ? 'EGP' : 'ج.م');
  };

  const maxDateStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Language Toggle Button */}
        <div className="flex justify-end mb-6 max-w-7xl mx-auto">
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
          >
            {t.languageToggle}
          </button>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow p-6 sticky top-6">
              <div className="text-center mb-6">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Patient')}&background=0D9488&color=fff&size=128`}
                  alt="Patient"
                  className="w-24 h-24 rounded-full mx-auto mb-4 shadow-md"
                />
                <h3 className="text-xl font-bold">{currentUser?.name || (language === 'en' ? 'Patient' : 'المريض')}</h3>
                <p className="text-xs font-bold text-teal-600 bg-teal-50 px-4 py-1 rounded-full mt-2 inline-block">
                  {t.patientAccount}
                </p>
              </div>

              <nav className="space-y-3">
                <button
                  onClick={() => document.getElementById('appointments-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-3 bg-teal-50 text-teal-700 rounded-xl font-bold hover:bg-teal-100 transition"
                >
                  {t.myAppointments}
                </button>
                <button
                  onClick={() => document.getElementById('doctors-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  {t.findDoctor}
                </button>
                <button
                  onClick={() => setShowReviewsModal(true)}
                  className="w-full py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition flex items-center justify-between"
                >
                  <span>{t.myReviews}</span>
                  {patientReviews.length > 0 && (
                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs">
                      {patientReviews.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            <header>
              <h1 className="text-3xl font-black text-slate-800">
                {t.welcome} {currentUser?.name?.split(' ')[0] || (language === 'en' ? 'Back' : 'بك')} 👋
              </h1>
              <p className="text-slate-600 mt-2">
                {t.welcomeMessage}
              </p>
            </header>

            {/* ====================== SMART MEDICAL COACH CARD ====================== */}
            <section className="bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 text-white rounded-3xl shadow-xl p-8 mb-8 overflow-hidden relative">
              <div className="absolute top-6 right-6 text-6xl opacity-20">🩺</div>
              
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2">
                      <span className="text-xl">🧠</span>
                      {language === 'ar' ? 'مدربك الطبي الذكي' : 'Smart Medical Coach'}
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-2">
                    {language === 'ar' ? `مرحباً ${currentUser?.name?.split(' ')[0] || ''}` : `Hi ${currentUser?.name?.split(' ')[0] || ''}`}
                  </h2>

                  {loadingSummary ? (
                    <p className="text-teal-100">{language === 'ar' ? 'جاري تحليل حالتك...' : 'Analyzing your health...'}</p>
                  ) : patientHealthSummary?.has_history ? (
                    <>
                      <p className="text-teal-100 text-lg mb-6">
                        {language === 'ar' ? 'آخر تشخيص:' : 'Last diagnosis:'}{' '}
                        <span className="font-semibold text-white">{patientHealthSummary.last_diagnosis}</span>
                      </p>

                      {/* Progress Bar for Improvement */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>{language === 'ar' ? 'معدل تحسنك' : 'Your Improvement Rate'}</span>
                          <span className="font-bold">{currentImprovement}%</span>
                        </div>
                        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-700 rounded-full"
                            style={{ width: `${currentImprovement}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-teal-100 mt-2">
                          {currentImprovement >= 70 
                            ? (language === 'ar' ? 'ممتاز! استمر كده 💪' : 'Excellent! Keep it up 💪')
                            : currentImprovement >= 40 
                            ? (language === 'ar' ? 'في تقدم جيد' : 'Good progress')
                            : (language === 'ar' ? 'نحتاج نتابع مع بعض' : 'We need to follow up together')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-teal-100 text-lg mb-6">
                      {patientHealthSummary?.message || 
                       (language === 'ar' ? "ابدأ متابعتك الصحية الشخصية الآن" : "Start your personalized health tracking now")}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 lg:w-80">
                  <button
                    onClick={() => setShowVipChat(true)}
                    className="w-full bg-white text-teal-700 hover:bg-teal-50 font-bold py-4 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                  >
                    <span>{language === 'ar' ? 'أخبرني عن حالتك اليوم' : "Tell me how you feel today"}</span>
                    <span className="text-2xl group-hover:rotate-12 transition-transform">💬</span>
                  </button>
                  
                  <p className="text-center text-xs text-teal-100 mt-3">
                    {language === 'ar' ? 'تحليل شخصي + متابعة دقيقة' : 'Personalized analysis & accurate follow-up'}
                  </p>
                </div>
              </div>
            </section>

            {/* Filters */}
            <section className="bg-white rounded-3xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">{t.findDoctorTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t.specialty}</label>
                  <select
                    value={selectedSpecialty}
                    onChange={e => setSelectedSpecialty(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">{t.allSpecialties}</option>
                    {SPECIALTIES_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t.clinic}</label>
                  <select
                    value={selectedClinic}
                    onChange={e => setSelectedClinic(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">{t.allClinics}</option>
                    {clinicsList.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Doctors List */}
            <section id="doctors-section">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                {t.availableDoctors} {filteredDoctors.length > 0 && `(${filteredDoctors.length})`}
              </h2>

              {filteredDoctors.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <p className="text-xl font-medium text-slate-600">{t.noDoctorsMatch}</p>
                  <p className="text-slate-500 mt-2">{t.tryChanging}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden group hover:-translate-y-1"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                          <img
                            src={doc.image}
                            alt={doc.name}
                            className="w-20 h-20 rounded-2xl object-cover shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xl group-hover:text-teal-700 transition truncate">
                              {t.dr} {doc.name}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">{doc.specialty || t.generalPractitioner}</p>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                              <span className="text-lg">🏥</span> {getPrimaryClinicName(doc)}
                            </p>

                            {doc.rating > 0 && (
                              <div className="flex items-center gap-2 mt-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-xl ${i < Math.round(doc.rating) ? 'text-yellow-400' : 'text-slate-200'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-slate-600">
                                  {doc.rating.toFixed(1)} ({doc.rating_count || 0})
                                </span>
                              </div>
                            )}
                            
                            {doc.rating >= 4.5 && (
                              <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                                {t.featured}
                              </span>
                            )}
                          </div>
                        </div>

                        {doc.prices && (
                          <div className="mt-4 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl border border-teal-100">
                            <h4 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                              <span className="text-lg">💰</span> {t.priceLabel}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl text-center border border-teal-200">
                                <span className="block text-xs text-teal-600 font-medium mb-1">{t.consultation}</span>
                                <span className="block text-lg font-bold text-teal-800">
                                  {formatPrice(doc.prices?.consultation || 0)}
                                </span>
                              </div>
                              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl text-center border border-teal-200">
                                <span className="block text-xs text-teal-600 font-medium mb-1">{t.followUp}</span>
                                <span className="block text-lg font-bold text-teal-800">
                                  {formatPrice(doc.prices?.follow_up || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="px-6 pb-6 flex gap-3">
                        <button
                          onClick={() => openDoctorReviews(doc)}
                          className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-amber-200"
                        >
                          <span>⭐</span>
                          <span>{t.reviews}</span>
                          {doc.rating_count > 0 && (
                            <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                              {doc.rating_count}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowBookingModal(true);
                            setBookingData(prev => ({
                              ...prev,
                              doctor_id: doc.id,
                              date: new Date().toISOString().split('T')[0],
                              start_time: '',
                              type: '',
                              clinic_id: ''
                            }));
                            fetchAvailableSlots(doc.id, new Date().toISOString().split('T')[0]);
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl font-bold transition-all shadow-md"
                        >
                          {t.bookAppointment}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* My Appointments */}
            <section id="appointments-section" className="bg-white rounded-3xl shadow p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                {t.myAppointmentsTitle}
              </h2>

              {appointments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed">
                  <p className="text-slate-500 font-medium">{t.noAppointments}</p>
                  <button
                    onClick={() => document.getElementById('doctors-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-4 text-teal-600 font-bold hover:underline"
                  >
                    {t.findDoctorNow}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {appointments.map(appt => {
                    const typeInfo = getTypeInfo(appt.type);
                    return (
                      <div key={appt._id} className="p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          <div className="flex items-center gap-4">
                            <img
                              src={appt.doctor_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctor_name || 'Doctor')}&background=0D9488&color=fff&size=64`}
                              alt={appt.doctor_name}
                              className="w-14 h-14 rounded-xl object-cover shadow-sm"
                            />
                            <div>
                              <h4 className="font-bold text-lg group-hover:text-teal-700 transition">
                                {t.dr} {appt.doctor_name}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {formatDate(appt.date)} • {appt.start_time} – {appt.end_time}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${typeInfo.bg} ${typeInfo.text}`}>
                                  {typeInfo.icon} {typeInfo.label}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                  appt.status === 'confirmed' ? 'bg-teal-100 text-teal-800' :
                                  appt.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                  appt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {appt.status === 'confirmed' ? t.confirmed :
                                   appt.status === 'cancelled' ? t.cancelled :
                                   appt.status === 'completed' ? t.completed : appt.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-end">
                            {appt.status === 'completed' && !appt.hasReview && (
                              <button
                                onClick={() => handleRateAppointment(appt)}
                                className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-100 transition"
                              >
                                {t.rateVisit}
                              </button>
                            )}

                            {appt.status === 'completed' && appt.hasReview && (
                              <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold">
                                {t.rated}
                              </span>
                            )}

                            <button
                              onClick={() => setActiveChat({ id: appt.doctor_id || appt.doctor?.id, name: appt.doctor_name })}
                              className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition"
                            >
                              {t.messageDoctor}
                            </button>

                            {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                              <button
                                onClick={() => handleCancelAppointment(appt._id)}
                                className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition"
                              >
                                {t.cancelAppointment}
                              </button>
                            )}
                          </div>
                        </div>

                        {appt.price > 0 && (
                          <div className="mt-3 text-sm text-teal-600 font-bold">
                            💰 {formatPrice(appt.price)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDoctor.image}
                    alt={selectedDoctor.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow"
                  />
                  <div>
                    <h3 className="text-2xl font-bold">{t.bookNewAppointment}</h3>
                    <p className="text-teal-600">{t.dr} {selectedDoctor.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-3xl text-slate-400 hover:text-rose-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">{t.selectDate}</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={maxDateStr}
                    value={bookingData.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setBookingData(prev => ({ ...prev, date: newDate, start_time: '', type: '', clinic_id: '' }));
                      fetchAvailableSlots(selectedDoctor.id, newDate);
                    }}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">
                    {t.availableSlots} {loadingSlots && t.loadingSlots}
                  </label>

                  {loadingSlots ? (
                    <div className="text-center py-12">
                      <div className="animate-spin h-10 w-10 border-4 border-teal-500 rounded-full border-t-transparent mx-auto"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium">{t.noSlots}</p>
                      <p className="text-sm text-slate-500 mt-2">{t.tryAnotherDate}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-5">
                        <button
                          onClick={() => setSelectedSlotType('all')}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                            selectedSlotType === 'all'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t.all} ({availableSlots.length})
                        </button>
                        <button
                          onClick={() => setSelectedSlotType('consultation')}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                            selectedSlotType === 'consultation'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t.consultation} ({slotsByType.consultation.length})
                        </button>
                        <button
                          onClick={() => setSelectedSlotType('follow_up')}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                            selectedSlotType === 'follow_up'
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t.followUp} ({slotsByType.follow_up.length})
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2">
                        {availableSlots
                          .filter(s => selectedSlotType === 'all' || s.type === selectedSlotType)
                          .map(slot => {
                            const isSelected =
                              bookingData.start_time === slot.start_time &&
                              bookingData.clinic_id === slot.clinic_id;

                            return (
                              <button
                                key={slot._id}
                                onClick={() => setBookingData({
                                  ...bookingData,
                                  start_time: slot.start_time,
                                  clinic_id: slot.clinic_id,
                                  type: slot.type
                                })}
                                className={`p-4 rounded-2xl text-center border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-teal-600 bg-teal-50 shadow-md'
                                    : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50/30'
                                }`}
                              >
                                <div className="font-bold text-lg">{slot.start_time}</div>
                                <div className="text-xs text-slate-600 mt-1 font-medium">
                                  {getTypeInfo(slot.type).label} • {slot.duration_minutes || '?'} {t.min}
                                </div>
                                {slot.price > 0 && (
                                  <div className="text-xs text-teal-700 mt-1 font-semibold">
                                    {formatPrice(slot.price)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleBookAppointment}
                  disabled={!bookingData.start_time || !bookingData.clinic_id}
                  className={`w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all ${
                    bookingData.start_time && bookingData.clinic_id
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t.confirmBooking}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedAppointmentForRating(null);
        }}
        appointment={selectedAppointmentForRating}
        currentUser={currentUser}
        language={language}
        onReviewSubmitted={() => {
          fetchPatientReviews();
          fetchMyAppointments();
        }}
      />

      {/* Patient Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold">{t.myReviewsTitle}</h3>
              <button onClick={() => setShowReviewsModal(false)} className="text-3xl text-slate-400 hover:text-rose-600">×</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {patientReviews.length > 0 ? (
                patientReviews.map(r => (
                  <div key={r._id} className="mb-6 pb-6 border-b last:border-0">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={r.doctor_image} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-bold">{t.dr} {r.doctor_name}</p>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-slate-200'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="text-slate-600">"{r.comment}"</p>}
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-slate-500">{t.noReviewsYet}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Reviews Modal */}
      {showDoctorReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-amber-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{t.reviewsFor} {selectedDoctorForReviews}</h3>
                {doctorStats.total > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-yellow-500">⭐</span>
                      <span className="text-xl font-bold text-slate-800">{doctorStats.average}</span>
                      <span className="text-sm text-slate-500">{t.outOf5}</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{doctorStats.total} {doctorStats.total === 1 ? t.review : t.reviews}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowDoctorReviewsModal(false)} className="text-3xl text-slate-400 hover:text-rose-600">×</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-4 border-teal-500 rounded-full border-t-transparent"></div>
                </div>
              ) : doctorReviews.length === 0 ? (
                <p className="text-center py-12 text-slate-500">{t.noDoctorReviews}</p>
              ) : (
                <>
                  {doctorStats.total > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                      <h4 className="font-bold text-lg mb-4">{t.ratingDistribution}</h4>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = doctorStats.distribution[stars] || 0;
                          const percentage = doctorStats.total > 0 ? (count / doctorStats.total) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm font-bold w-16">{stars} {t.stars}</span>
                              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600 w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {doctorReviews.map(r => (
                    <div key={r._id} className="mb-6 pb-6 border-b last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        {r.patient_image ? (
                          <img src={r.patient_image} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">
                            {r.patient_name?.charAt(0) || (language === 'en' ? 'P' : 'م')}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-lg">{r.patient_name || t.patient}</p>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < r.rating ? 'text-yellow-400 text-xl' : 'text-slate-200 text-xl'}>★</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(r.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-EG')}
                            </span>
                          </div>
                          {r.comment && (
                            <div className="mt-3 bg-slate-50 p-4 rounded-xl border-r-4 border-teal-400">
                              <p className="text-slate-700">"{r.comment}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat with Doctor */}
      {activeChat && (
        <DirectChat
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          contactName={activeChat.name}
          contactRole="Doctor"
          contactId={activeChat.id}
          currentUserId={currentUser?.id}
          language={language}
        />
      )}

      {/* VIP Personalized Medical Chat */}
      {showVipChat && (
        <DirectChat
          isOpen={true}
          onClose={() => setShowVipChat(false)}
          contactName={language === 'ar' ? "مدربك الطبي الذكي" : "Smart Medical Coach"}
          contactRole="VIP Medical Assistant"
          contactId="vip-coach"
          currentUserId={currentUser?.id}
          language={language}
          isVipMode={true}
          patientId={currentUser?.id}
        />
      )}
    </>
  );
}

export default PatientDashboard;