// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import DirectChat from '../components/DirectChat';
import WeeklyScheduleManager from '../components/WeeklyScheduleManager';
import ExceptionManager from '../components/ExceptionManager';
import AvailabilityManager from '../components/AvailabilityManager';
import { toast } from 'react-hot-toast';

function Dashboard({ currentUser }) {
  // State
  const [appointments, setAppointments] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({});
  const [todayException, setTodayException] = useState(null);
  
  // State for ALL appointments
  const [allAppointments, setAllAppointments] = useState([]);
  const [allAppointmentsPagination, setAllAppointmentsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    clinic_id: '',
    from_date: '',
    to_date: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loadingAllAppointments, setLoadingAllAppointments] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showExceptionManager, setShowExceptionManager] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [editingAvailableSlot, setEditingAvailableSlot] = useState(null);
  const [stats, setStats] = useState({
    today_appointments: 0,
    month_appointments: 0,
    pending_appointments: 0,
    average_rating: 0,
    clinics_count: 0
  });

  // ================================================
  // جلب كل العيادات المتاحة
  // ================================================
  const fetchAllClinics = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/manager/clinics`);
      const data = await response.json();
      if (response.ok) {
        setAllClinics(data);
        console.log('✅ All clinics loaded:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching clinics:', error);
      toast.error('Failed to load clinics');
    }
  };

  // ================================================
  // جلب الإحصائيات
  // ================================================
  const fetchStats = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/quick-stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data);
        console.log('✅ Stats loaded:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  // ================================================
  // جلب مواعيد اليوم
  // ================================================
  const fetchTodayAppointments = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/appointments/today`);
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments || []);
        setTodayException(data.today_exceptions || null);
        console.log('✅ Today appointments loaded:', data.appointments?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  // ================================================
  // جلب الجدول الأسبوعي (لكل عيادة)
  // ================================================
  const fetchWeeklySchedule = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/clinics`);
      const data = await response.json();
      
      if (response.ok) {
        const schedulesWithDetails = await Promise.all(
          data.map(async (clinic) => {
            try {
              const scheduleResponse = await fetch(
                `http://16.171.29.212:8000/api/doctor/${currentUser.id}/clinics/${clinic._id}/weekly-schedule`
              );
              if (scheduleResponse.ok) {
                const scheduleData = await scheduleResponse.json();
                return {
                  ...clinic,
                  schedule: scheduleData.weekly_schedule || [],
                  slot_duration: scheduleData.slot_duration || 30
                };
              }
            } catch (error) {
              console.error(`Error fetching schedule for clinic ${clinic._id}:`, error);
            }
            return {
              ...clinic,
              schedule: [],
              slot_duration: 30
            };
          })
        );
        
        setWeeklySchedule(schedulesWithDetails);
        console.log('✅ Weekly schedule loaded:', schedulesWithDetails.length, 'clinics');
      }
    } catch (error) {
      console.error('❌ Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    }
  };

  // ================================================
  // جلب الاستثناءات
  // ================================================
  const fetchExceptions = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/exceptions`);
      const data = await response.json();
      if (response.ok) {
        setExceptions(data.exceptions || []);
        console.log('✅ Exceptions loaded:', data.exceptions?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching exceptions:', error);
      setExceptions([]);
    }
  };

  // ================================================
  // جلب المواعيد الفاضية
  // ================================================
  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/available-slots`);
      const data = await response.json();
      if (response.ok) {
        // تجميع المواعيد حسب التاريخ
        const groupedSlots = data.slots.reduce((acc, slot) => {
          if (!acc[slot.date]) {
            acc[slot.date] = [];
          }
          acc[slot.date].push(slot);
          return acc;
        }, {});
        
        setAvailableSlots(groupedSlots);
        console.log('✅ Available slots loaded:', groupedSlots);
      }
    } catch (error) {
      console.error('❌ Error fetching available slots:', error);
    }
  };

  // ================================================
  // جلب جميع المواعيد (مع الفلاتر)
  // ================================================
  const fetchAllAppointments = async (page = 1) => {
    setLoadingAllAppointments(true);
    try {
      // بناء query string من الفلاتر
      const params = new URLSearchParams({
        page: page,
        limit: allAppointmentsPagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.clinic_id && { clinic_id: filters.clinic_id }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date })
      });

      const response = await fetch(
        `http://16.171.29.212:8000/api/doctor/${currentUser.id}/all-appointments?${params}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setAllAppointments(data.appointments || []);
        setAllAppointmentsPagination(data.pagination);
      } else {
        toast.error(data.error || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('❌ Error fetching all appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoadingAllAppointments(false);
    }
  };

  // ================================================
  // حذف موعد فاضي
  // ================================================
  const handleDeleteAvailableSlot = async (slotId) => {
    if (!window.confirm('Delete this available slot?')) return;
    
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/doctor/${currentUser.id}/available-slots/${slotId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('✅ Slot deleted');
        fetchAvailableSlots();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error deleting slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete slot');
    }
  };

  // ================================================
  // فتح مودال التعديل لموعد فاضي
  // ================================================
  const handleEditAvailableSlot = (slot) => {
    setEditingAvailableSlot(slot);
    setShowAvailabilityManager(true);
  };

  // ================================================
  // تحديث حالة الموعد
  // ================================================
  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      const response = await fetch(`http://16.171.29.212:8000/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Appointment ${status} successfully`);
        await Promise.all([
          fetchTodayAppointments(),
          fetchStats(),
          fetchAllAppointments(allAppointmentsPagination.page) // تحديث قائمة كل المواعيد
        ]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred');
    }
  };

  // ================================================
  // Handle filter change
  // ================================================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setAllAppointmentsPagination(prev => ({ ...prev, page: 1 }));
  };

  // ================================================
  // Apply filters
  // ================================================
  const applyFilters = () => {
    fetchAllAppointments(1);
    setShowFilters(false);
  };

  // ================================================
  // Clear filters
  // ================================================
  const clearFilters = () => {
    setFilters({
      status: '',
      clinic_id: '',
      from_date: '',
      to_date: ''
    });
    // Fetch with cleared filters
    setTimeout(() => {
      fetchAllAppointments(1);
    }, 100);
  };

  // ================================================
  // تحميل كل البيانات عند تحميل الصفحة
  // ================================================
  useEffect(() => {
    if (currentUser?.id) {
      const loadAllData = async () => {
        setLoading(true);
        try {
          await fetchAllClinics();
          
          await Promise.all([
            fetchStats(),
            fetchTodayAppointments(),
            fetchWeeklySchedule(),
            fetchExceptions(),
            fetchAvailableSlots(),
            fetchAllAppointments(1)
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      };

      loadAllData();

      const interval = setInterval(fetchTodayAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // ================================================
  // Helper functions
  // ================================================
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'confirmed': return 'bg-emerald-100 text-emerald-600';
      case 'delayed': return 'bg-orange-100 text-orange-600';
      case 'cancelled': return 'bg-rose-100 text-rose-600';
      case 'completed': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const translateStatus = (status) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'delayed': return 'Delayed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Stats calculations (fallback if API fails)
  const calculatedStats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-teal-50 sticky top-24">
          {/* Profile */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative">
              <img 
                src={currentUser?.image || "https://ui-avatars.com/api/?name=Doctor&background=0D8ABC&color=fff"} 
                className="w-28 h-28 rounded-full border-4 border-white shadow-xl mb-4 object-cover" 
                alt="Profile" 
              />
              <div className="absolute bottom-5 right-2 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <h3 className="font-black text-xl text-slate-800">Dr. {currentUser?.name || 'Ahmed'}</h3>
            <p className="text-sm text-teal-600 font-bold uppercase tracking-wider">{currentUser?.specialty || 'Specialist'}</p>
            
            {/* Quick clinic stats */}
            <div className="mt-4 w-full">
              <p className="text-xs text-slate-500 font-bold mb-2">
                Working at {stats.clinics_count || allClinics.length} clinic(s):
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allClinics.slice(0, 3).map(clinic => (
                  <span key={clinic._id} className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                    {clinic.name}
                  </span>
                ))}
                {allClinics.length > 3 && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    +{allClinics.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            {stats.average_rating > 0 && (
              <div className="mt-3 text-sm">
                <span className="text-amber-500">★</span>
                <span className="text-slate-600 ml-1">{stats.average_rating}</span>
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="space-y-3">
            <button 
              onClick={() => setShowScheduleManager(true)}
              className="w-full text-left px-5 py-4 bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-100 flex items-center gap-3 hover:bg-teal-600 transition-colors"
            >
              <span>📅</span> Weekly Schedule
            </button>

            <button 
              onClick={() => setShowAvailabilityManager(true)}
              className="w-full text-left px-5 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-3 hover:bg-emerald-600 transition-colors"
            >
              <span>⏰</span> Available Times
            </button>
            
            <button 
              onClick={() => setShowExceptionManager(true)}
              className="w-full text-left px-5 py-4 text-slate-600 hover:bg-slate-50 font-bold rounded-2xl transition-all flex items-center gap-3"
            >
              <span>⚠️</span> Schedule Exceptions
            </button>
          </nav>

          {/* Today's Exception Alert */}
          {todayException && Object.keys(todayException).length > 0 && (
            <div className={`mt-6 p-4 rounded-2xl ${
              todayException.status === 'unavailable' 
                ? 'bg-rose-50 border border-rose-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <p className="font-black text-sm mb-1">🔔 Today's Alert</p>
              <p className="text-xs font-bold">
                {todayException.status === 'unavailable' 
                  ? 'Clinic closed today (Leave)' 
                  : `Modified hours: ${todayException.new_start_time} - ${todayException.new_end_time}`}
              </p>
              {todayException.reason && (
                <p className="text-xs text-slate-500 mt-1">{todayException.reason}</p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8">
        
        {/* Header */}
        <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-teal-50">
          <h2 className="text-3xl font-black text-slate-800">Welcome back, Dr. {currentUser?.name || 'Ahmed'}! 👋</h2>
          <p className="text-slate-500 font-medium">
            {stats.pending_appointments > 0 
              ? `You have ${stats.pending_appointments} new ${stats.pending_appointments === 1 ? 'request' : 'requests'} today`
              : calculatedStats.pending > 0
              ? `You have ${calculatedStats.pending} new ${calculatedStats.pending === 1 ? 'request' : 'requests'} today`
              : 'No new requests today'}
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-emerald-500 p-7 rounded-[2rem] shadow-lg shadow-emerald-100 text-white">
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Today's Total</p>
            <h4 className="text-4xl font-black">{stats.today_appointments || calculatedStats.total}</h4>
          </div>
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pending</p>
            <h4 className="text-4xl font-black text-amber-500">{stats.pending_appointments || calculatedStats.pending}</h4>
          </div>
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">This Month</p>
            <h4 className="text-4xl font-black text-teal-500">{stats.month_appointments || 0}</h4>
          </div>
        </div>

        {/* Weekly Schedule Preview */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-teal-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Weekly Schedule</h3>
            <button 
              onClick={() => setShowScheduleManager(true)}
              className="text-teal-600 font-bold text-sm hover:underline"
            >
              Edit Schedule
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
            </div>
          ) : weeklySchedule.length > 0 ? (
            <div className="space-y-6">
              {weeklySchedule.map((clinic) => (
                <div key={clinic._id} className="border-b border-slate-100 pb-4 last:border-0">
                  <h4 className="font-bold text-teal-600 mb-3">{clinic.name}</h4>
                  {clinic.schedule?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clinic.schedule.map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-black text-slate-800">{item.day}</p>
                          </div>
                          <div className="text-sm font-black bg-white px-4 py-2 rounded-xl border border-slate-200">
                            {item.start_time} - {item.end_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No schedule for this clinic</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No weekly schedule - Please add your available times per clinic
            </p>
          )}
        </section>

        {/* Available Times Section */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800">⏰ Your Available Times</h3>
              <p className="text-sm text-slate-500 mt-1">Slots you've set for patients to book</p>
            </div>
            <button 
              onClick={() => {
                setEditingAvailableSlot(null);
                setShowAvailabilityManager(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
            >
              <span>➕</span> Add New Slot
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : Object.keys(availableSlots).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(availableSlots)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, slots]) => (
                  <div key={date} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="text-xs text-slate-400">{slots.length} slots</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots.map((slot) => (
                        <div 
                          key={slot._id} 
                          className="group relative p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-emerald-200 hover:bg-white transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-black text-emerald-600">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              </div>
                              {slot.clinic_name && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <span>🏥</span> {slot.clinic_name}
                                </p>
                              )}
                            </div>
                            
                            {/* Control buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditAvailableSlot(slot)}
                                className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteAvailableSlot(slot._id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-slate-400 font-bold text-lg">No available times set</p>
              <p className="text-slate-300 text-sm mt-2">Click "Add New Slot" to set your availability</p>
            </div>
          )}
        </section>

        {/* Today's Appointments */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-teal-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Today's Appointments</h3>
            <p className="text-sm font-bold text-teal-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
              <p className="text-slate-400 mt-4">Loading...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map(appt => (
                <div key={appt._id} className="p-6 rounded-[2rem] border border-slate-100 hover:border-teal-200 transition-all bg-white hover:shadow-md">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    
                    {/* Patient Info */}
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-teal-50 text-teal-600 font-black rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                        {appt.patient_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">{appt.patient_name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-slate-400 font-bold">
                            {appt.start_time} - {appt.end_time}
                          </p>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getStatusColor(appt.status)}`}>
                            {translateStatus(appt.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-teal-50 text-teal-600 px-2 py-1 rounded-lg">
                            {appt.clinic_name || 'Main Clinic'}
                          </span>
                          <p className="text-xs text-teal-600 font-bold">
                            {appt.type === 'normal' ? 'Regular' : 
                             appt.type === 'consultation' ? 'Consultation' :
                             appt.type === 'emergency' ? 'Emergency' : 'Follow-up'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => setActiveChat({
                          name: appt.patient_name,
                          id: appt.patient_id
                        })}
                        className="bg-indigo-50 text-indigo-600 p-3 rounded-xl hover:bg-indigo-100 transition-colors"
                        title="Message"
                      >
                        💬
                      </button>
                      
                      {appt.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(appt._id, 'confirmed')} 
                          className="bg-emerald-500 text-white text-xs font-black px-5 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {appt.status === 'confirmed' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(appt._id, 'delayed')} 
                            className="bg-amber-500 text-white text-xs font-black px-5 py-3 rounded-xl hover:bg-amber-600 transition-colors"
                          >
                            Delay
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(appt._id, 'completed')} 
                            className="bg-blue-500 text-white text-xs font-black px-5 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      
                      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusUpdate(appt._id, 'cancelled')} 
                          className="bg-rose-500 text-white text-xs font-black px-5 py-3 rounded-xl hover:bg-rose-600 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-slate-50 rounded-[3rem]">
              <p className="text-slate-400 font-black text-xl">No appointments today</p>
              <p className="text-slate-300 font-bold">You will be notified when a patient books</p>
            </div>
          )}
        </section>

        {/* All Appointments History */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800">📋 All Appointments History</h3>
              <p className="text-sm text-slate-500 mt-1">Complete history of all your appointments</p>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              <span>🔍</span> {showFilters ? 'Hide Filters' : 'Filter'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-black text-sm text-slate-700 mb-3">Filter Appointments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="delayed">Delayed</option>
                </select>

                {/* Clinic Filter */}
                <select
                  value={filters.clinic_id}
                  onChange={(e) => handleFilterChange('clinic_id', e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">All Clinics</option>
                  {allClinics.map(clinic => (
                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                  ))}
                </select>

                {/* Date From */}
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 text-sm"
                  placeholder="From Date"
                />

                {/* Date To */}
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 text-sm"
                  placeholder="To Date"
                />
              </div>

              {/* Filter Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={applyFilters}
                  className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {loadingAllAppointments ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-slate-400 mt-4">Loading appointments...</p>
            </div>
          ) : allAppointments.length > 0 ? (
            <>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {allAppointments.map(appt => (
                  <div key={appt._id} className="p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all bg-white hover:shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                      
                      {/* Patient Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 font-black rounded-xl flex items-center justify-center text-xl shadow-inner">
                          {appt.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{appt.patient_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-400 font-bold">
                              {appt.date} | {appt.start_time} - {appt.end_time}
                            </p>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${getStatusColor(appt.status)}`}>
                              {translateStatus(appt.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">
                              {appt.clinic_name}
                            </span>
                            <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-lg">
                              {appt.type}
                            </span>
                            {appt.price > 0 && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg">
                                ${appt.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveChat({
                            name: appt.patient_name,
                            id: appt.patient_id
                          })}
                          className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
                          title="Message Patient"
                        >
                          💬
                        </button>
                        {appt.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(appt._id, 'confirmed')} 
                            className="bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {allAppointmentsPagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => fetchAllAppointments(allAppointmentsPagination.page - 1)}
                    disabled={allAppointmentsPagination.page === 1}
                    className={`px-4 py-2 rounded-xl font-bold text-sm ${
                      allAppointmentsPagination.page === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Page {allAppointmentsPagination.page} of {allAppointmentsPagination.pages}
                  </span>
                  <button
                    onClick={() => fetchAllAppointments(allAppointmentsPagination.page + 1)}
                    disabled={allAppointmentsPagination.page === allAppointmentsPagination.pages}
                    className={`px-4 py-2 rounded-xl font-bold text-sm ${
                      allAppointmentsPagination.page === allAppointmentsPagination.pages
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-slate-50 rounded-[3rem]">
              <p className="text-slate-400 font-black text-xl">No appointments found</p>
              <p className="text-slate-300 font-bold">Try adjusting your filters</p>
            </div>
          )}
        </section>

        {/* Exceptions Preview */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Upcoming Exceptions</h3>
            <button 
              onClick={() => setShowExceptionManager(true)}
              className="text-rose-600 font-bold text-sm hover:underline"
            >
              Manage Exceptions
            </button>
          </div>
          
          {exceptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exceptions
                .filter(ex => ex.date >= new Date().toISOString().split('T')[0])
                .slice(0, 3)
                .map((ex) => (
                  <div key={ex._id} className={`p-5 rounded-2xl border ${
                    ex.status === 'unavailable' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-800">{ex.date}</p>
                        {ex.clinic_name && (
                          <p className="text-xs text-teal-600 mt-1">{ex.clinic_name}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-2">
                      {ex.status === 'unavailable' 
                        ? '🚫 Leave - Clinic Closed' 
                        : `🕐 Modified: ${ex.new_start_time} - ${ex.new_end_time}`}
                    </p>
                    {ex.reason && (
                      <p className="text-xs text-slate-400 mt-1">{ex.reason}</p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No upcoming exceptions</p>
          )}
        </section>

        {/* Modals */}
        {showScheduleManager && (
          <WeeklyScheduleManager
            isOpen={showScheduleManager}
            onClose={() => setShowScheduleManager(false)}
            doctorId={currentUser?.id}
            allClinics={allClinics}
            onUpdate={fetchWeeklySchedule}
          />
        )}

        {showAvailabilityManager && (
          <AvailabilityManager
            isOpen={showAvailabilityManager}
            onClose={() => {
              setShowAvailabilityManager(false);
              setEditingAvailableSlot(null);
            }}
            doctorId={currentUser?.id}
            allClinics={allClinics}
            editingSlot={editingAvailableSlot}
            onUpdate={() => {
              fetchAvailableSlots();
              console.log('Availability updated');
            }}
          />
        )}

        {showExceptionManager && (
          <ExceptionManager
            isOpen={showExceptionManager}
            onClose={() => setShowExceptionManager(false)}
            doctorId={currentUser?.id}
            allClinics={allClinics}
            onUpdate={fetchExceptions}
          />
        )}

        {/* Chat */}
        {activeChat && (
          <DirectChat 
            isOpen={!!activeChat} 
            onClose={() => setActiveChat(null)} 
            contactName={activeChat.name} 
            contactRole="Patient"
            contactId={activeChat.id}
            currentUserId={currentUser?.id}
          />
        )}

      </main>
    </div>
  );
}

export default Dashboard;