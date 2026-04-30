// AdminDoctorProfile.jsx (Frontend - Complete Updated Component)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = 'https://mediibook.duckdns.org/api';

function AdminDoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State Variables ---
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    image: '',
    imagePreview: '',
    slot_duration: {
      consultation: 30,
      follow_up: 20,
      buffer_time: 10,
    },
    prices: {
      consultation: 200,
      follow_up: 300,
    },
  });

  // --- Helper Functions ---
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'EGP 0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // --- Data Fetching ---
  const fetchDoctor = useCallback(async () => {
    if (!id) {
      setError('Doctor ID not specified');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First try: Get all doctors and find by id
      const res = await fetch(`${API_BASE}/manager/doctors`);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

      const doctors = await res.json();
      // Improved find logic to handle both 'id' and '_id'
      const found = doctors.find(d => d.id == id || d._id == id); // Use == for type coercion

      if (!found) {
        // Second try: If not found, attempt direct fetch (if endpoint exists)
        try {
          const directRes = await fetch(`${API_BASE}/manager/doctor/${id}`);
          if (directRes.ok) {
            const directDoctor = await directRes.json();
            setDoctor(directDoctor);
            initializeFormData(directDoctor);
            return;
          }
        } catch (directErr) {
          console.warn('Direct fetch failed, using fallback');
        }
        throw new Error(`Doctor with ID "${id}" not found. Please check the ID and try again.`);
      }

      setDoctor(found);
      initializeFormData(found);
      
    } catch (err) {
      console.error('Fetch Doctor Error:', err);
      setError(err.message || 'Failed to load doctor data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const initializeFormData = (doctorData) => {
    setFormData({
      name: doctorData.name || '',
      specialty: doctorData.specialty || '',
      image: doctorData.image || '',
      imagePreview: doctorData.image || 'https://i.pravatar.cc/150',
      slot_duration: {
        consultation: doctorData.clinic_affiliations?.[0]?.slot_duration?.consultation || 30,
        follow_up: doctorData.clinic_affiliations?.[0]?.slot_duration?.follow_up || 20,
        buffer_time: doctorData.clinic_affiliations?.[0]?.slot_duration?.buffer_time || 10,
      },
      prices: {
        consultation: doctorData.clinic_affiliations?.[0]?.prices?.consultation || 200,
        follow_up: doctorData.clinic_affiliations?.[0]?.prices?.follow_up || 300,
      },
    });
  };

  const fetchAnalytics = useCallback(async () => {
    if (!id) return;
    
    try {
      setAnalyticsLoading(true);
      const res = await fetch(`${API_BASE}/doctor/${id}/analytics?period=${selectedPeriod}`);
      
      if (!res.ok) {
        throw new Error(`Analytics API Error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.warn('Analytics API returned success=false');
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [id, selectedPeriod]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // --- CRUD Operations ---
  const handleSave = async () => {
    if (saving) return;
    if (!formData.name.trim() || !formData.specialty.trim()) {
      alert('⚠️ Name and specialty are required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        image: formData.image || undefined,
        slot_duration: formData.slot_duration,
        prices: formData.prices,
      };

      const res = await fetch(`${API_BASE}/manager/doctor/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed (${res.status})`);
      }

      // Refresh local state
      const updatedDoctor = { ...doctor, ...payload };
      setDoctor(updatedDoctor);
      setIsEditing(false);
      alert('✅ Changes saved successfully');
      
    } catch (err) {
      alert('❌ Error while saving: ' + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async () => {
    const newStatus = !doctor.isSuspended;
    const action = newStatus ? 'suspend' : 'activate';
    const confirmMessage = newStatus 
      ? `⚠️ Are you sure you want to SUSPEND Dr. ${doctor.name}?\n\nSuspended doctors will not be available for booking.`
      : `✅ Are you sure you want to ACTIVATE Dr. ${doctor.name}?\n\nThe doctor will be available for booking again.`;
    
    if (!window.confirm(confirmMessage)) return;

    setSuspending(true);
    try {
      const res = await fetch(`${API_BASE}/manager/doctor/${id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: newStatus }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} doctor`);

      // Update local state
      setDoctor(prev => ({ ...prev, isSuspended: newStatus }));
      alert(`✅ Doctor ${action}d successfully`);
      
    } catch (err) {
      alert(`❌ Error while ${action}ing doctor: ${err.message}`);
      console.error(err);
    } finally {
      setSuspending(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = '⚠️ PERMANENT DELETE WARNING ⚠️\n\n' +
                          `Are you sure you want to permanently delete Dr. ${doctor?.name}?\n\n` +
                          'This will also delete ALL related data:\n' +
                          '• All appointments for this doctor\n' +
                          '• All available time slots\n' +
                          '• All patient reviews and ratings\n' +
                          '• All clinic affiliations\n\n' +
                          'THIS ACTION CANNOT BE UNDONE!';
    
    if (!window.confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/manager/doctor/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`);

      alert('✅ Doctor and all related data deleted successfully');
      navigate('/manager');
      
    } catch (err) {
      alert('❌ Error while deleting: ' + err.message);
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

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

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xl text-teal-700 animate-pulse">Loading doctor data...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Doctor Not Found</h2>
        <p className="text-slate-500 mb-8">ID: {id}</p>
        {error && <p className="text-red-600 mb-6 max-w-md bg-red-50 p-4 rounded-xl">{error}</p>}
        <button
          onClick={() => navigate('/manager')}
          className="bg-teal-600 text-white px-8 py-3 rounded-xl hover:bg-teal-700 transition font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Button */}
      <button
        onClick={() => navigate('/manager')}
        className="mb-8 text-slate-600 hover:text-teal-700 font-medium flex items-center gap-2 transition"
      >
        ← Back to Manager Dashboard
      </button>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10">
        {doctor.isSuspended && (
          <div className="bg-amber-400 h-2 w-full" />
        )}

        <div className="p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Avatar + basic info */}
            <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
              <div className="relative">
                <img
                  src={isEditing ? formData.imagePreview : (doctor.image || 'https://i.pravatar.cc/150')}
                  alt={doctor.name}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-teal-100 shadow-md"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-teal-600 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-teal-700 transition shadow">
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-5">
                    <input
                      className="text-3xl md:text-4xl font-extrabold border-b-2 border-teal-400 focus:border-teal-600 outline-none w-full pb-1 bg-transparent"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Doctor name"
                    />
                    <select
                      className="text-lg font-semibold text-teal-700 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 w-full md:w-auto"
                      value={formData.specialty}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                    >
                      <option value="">Select specialty</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="General Surgery">General Surgery</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                      <option value="ENT">ENT</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Internal Medicine">Internal Medicine</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                        {doctor.name}
                      </h1>
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${
                          doctor.isSuspended
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {doctor.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xl font-semibold text-teal-700">
                      {doctor.specialty || 'Not specified'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6 lg:mt-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-7 py-3 rounded-xl font-medium text-white transition min-w-[140px] ${
                      saving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      initializeFormData(doctor);
                    }}
                    className="px-7 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    Edit Profile
                  </button>

                  <button
                    onClick={handleToggleSuspend}
                    disabled={suspending}
                    className={`px-6 py-3 rounded-xl font-medium transition shadow-sm min-w-[120px] ${
                      suspending ? 'opacity-50 cursor-not-allowed' :
                      doctor.isSuspended
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {suspending ? 'Processing...' : (doctor.isSuspended ? 'Activate' : 'Suspend')}
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-6 py-3 rounded-xl font-medium transition shadow-sm min-w-[120px] ${
                      deleting
                        ? 'bg-rose-200 text-rose-400 cursor-not-allowed'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    {deleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📊 Doctor Analytics Dashboard</h2>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">📅 All Time</option>
            <option value="day">📅 Today</option>
            <option value="week">📅 This Week</option>
            <option value="month">📅 This Month</option>
            <option value="year">📅 This Year</option>
          </select>
        </div>

        {analyticsLoading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="text-teal-600 animate-pulse">Loading analytics data...</div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">📋 Total Appointments</p>
                <div className="text-4xl font-black text-blue-900 mb-2">{analytics.total_appointments || 0}</div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>✓ Completed: {analytics.appointments_by_status?.completed || 0}</span>
                  <span>⏳ Pending: {analytics.appointments_by_status?.pending || 0}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600 mt-1">
                  <span>✗ Cancelled: {analytics.appointments_by_status?.cancelled || 0}</span>
                  <span>✓ Confirmed: {analytics.appointments_by_status?.confirmed || 0}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">💰 Total Revenue</p>
                <div className="text-4xl font-black text-emerald-900 mb-2">{formatCurrency(analytics.revenue?.total)}</div>
                <p className="text-sm text-emerald-600">📊 Average: {formatCurrency(analytics.average_revenue_per_appointment)} per visit</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">📈 Completion Rate</p>
                <div className="text-4xl font-black text-purple-900 mb-2">{analytics.completion_rate || 0}%</div>
                <p className="text-sm text-purple-600">{analytics.appointments_by_status?.completed || 0} completed out of {analytics.total_appointments || 0} total</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">👥 Unique Patients</p>
                <div className="text-4xl font-black text-amber-900 mb-2">{analytics.patient_analytics?.unique_patients || 0}</div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>🆕 New: {analytics.patient_analytics?.new_patients || 0}</span>
                  <span>🔄 Returning: {analytics.patient_analytics?.returning_patients || 0}</span>
                </div>
              </div>
            </div>

            {/* Charts/Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointments by Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Appointments by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.appointments_by_status || {}).map(([status, count]) => {
                    const total = analytics.total_appointments || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={status} className="flex items-center">
                        <span className="w-24 text-sm text-slate-600 capitalize">
                          {status === 'completed' ? '✓ Completed' :
                           status === 'pending' ? '⏳ Pending' :
                           status === 'cancelled' ? '✗ Cancelled' :
                           status === 'confirmed' ? '✓ Confirmed' : status}:
                        </span>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                status === 'completed' ? 'bg-emerald-500' :
                                status === 'pending' ? 'bg-amber-500' :
                                status === 'cancelled' ? 'bg-rose-500' :
                                status === 'confirmed' ? 'bg-blue-500' : 'bg-slate-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-16 text-right text-sm font-medium text-slate-700">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Appointments by Type */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Appointments by Type</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.appointments_by_type || {}).map(([type, count]) => {
                    const total = analytics.total_appointments || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={type} className="flex items-center">
                        <span className="w-24 text-sm text-slate-600 capitalize">
                          {type === 'consultation' ? '🩺 Consultation' :
                           type === 'follow_up' ? '📋 Follow-up' : type}:
                        </span>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                        <span className="w-16 text-right text-sm font-medium text-slate-700">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue by Type */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">💰 Revenue by Type</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.revenue?.by_type || {}).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 capitalize">
                        {type === 'consultation' ? '🩺 Consultation' :
                         type === 'follow_up' ? '📋 Follow-up' : type}:
                      </span>
                      <span className="font-medium text-emerald-600">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Daily Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📅 Recent Daily Activity (Last 30 Days)</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(analytics.time_analytics?.daily || {})
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 15)
                    .map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-sm text-slate-600">{date}:</span>
                        <span className="font-medium text-slate-800">{count} appointment{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">📆 Monthly Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analytics.time_analytics?.monthly || {})
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .slice(0, 6)
                  .map(([month, count]) => {
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });
                    const monthlyRevenue = (count * (analytics.average_revenue_per_appointment || 0));
                    return (
                      <div key={month} className="bg-slate-50 rounded-xl p-4">
                        <p className="text-sm font-semibold text-slate-600">{monthName} {year}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-2">{count} appointments</p>
                        <p className="text-sm text-emerald-600 mt-1">{formatCurrency(monthlyRevenue)}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">No analytics data available for this doctor</p>
          </div>
        )}
      </div>

      {/* Clinics & Schedule Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Schedule & Pricing */}
          <div className="bg-white rounded-3xl shadow border border-slate-100 p-7 md:p-9">
            <h3 className="text-2xl font-bold text-slate-800 mb-7">
              {isEditing ? '✏️ Edit Appointment Settings & Prices' : '⚙️ Appointment Settings & Prices'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Consultation Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    step="5"
                    value={formData.slot_duration.consultation}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        slot_duration: { ...formData.slot_duration, consultation: Number(e.target.value) },
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-4 border rounded-xl bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Follow-up Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={formData.slot_duration.follow_up}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        slot_duration: { ...formData.slot_duration, follow_up: Number(e.target.value) },
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-4 border rounded-xl bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Buffer Time (between patients)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="5"
                    value={formData.slot_duration.buffer_time}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        slot_duration: { ...formData.slot_duration, buffer_time: Number(e.target.value) },
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-4 border rounded-xl bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Consultation Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={formData.prices.consultation}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        prices: { ...formData.prices, consultation: Number(e.target.value) },
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-4 border rounded-xl bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Follow-up Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={formData.prices.follow_up}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        prices: { ...formData.prices, follow_up: Number(e.target.value) },
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-4 border rounded-xl bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connected Clinics */}
          <div className="bg-white rounded-3xl shadow border border-slate-100 p-7 md:p-9">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">🏥 Connected Clinics</h3>
            {doctor.clinic_affiliations?.length > 0 ? (
              <div className="space-y-4">
                {doctor.clinic_affiliations.map((aff, index) => (
                  <div
                    key={aff.clinic_id || index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 gap-4"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        Clinic ID: {aff.clinic_id}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Joined: {formatDate(aff.joined_at)}
                      </p>
                      {aff.slot_duration && (
                        <p className="text-xs text-slate-400 mt-2">
                          Slots: {aff.slot_duration.consultation}min consult, {aff.slot_duration.follow_up}min follow-up
                        </p>
                      )}
                    </div>
                    <span className="px-4 py-1.5 bg-teal-100 text-teal-800 rounded-full text-sm font-medium text-center sm:text-left">
                      ✅ Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-10">
                Doctor is not affiliated with any clinics
              </p>
            )}
          </div>
        </div>

        {/* Right sidebar – stats / quick info */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8 border border-teal-200 text-center shadow-sm">
            <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-3">
              📋 Total Appointments
            </p>
            <div className="text-5xl font-black text-teal-900">
              {analytics?.total_appointments || 0}
            </div>
            {analytics && (
              <div className="mt-4 text-sm text-teal-600">
                <div className="flex justify-between">
                  <span>✓ Completed:</span>
                  <span className="font-semibold">{analytics.appointments_by_status?.completed || 0}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>✗ Cancelled:</span>
                  <span className="font-semibold">{analytics.appointments_by_status?.cancelled || 0}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>⏳ Pending:</span>
                  <span className="font-semibold">{analytics.appointments_by_status?.pending || 0}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>✓ Confirmed:</span>
                  <span className="font-semibold">{analytics.appointments_by_status?.confirmed || 0}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow border border-slate-100 p-7">
            <h4 className="text-lg font-bold text-slate-800 mb-5">ℹ️ Additional Information</h4>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Created At:</dt>
                <dd className="font-medium text-slate-800">{formatDate(doctor.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Last Updated:</dt>
                <dd className="font-medium text-slate-800">{formatDate(doctor.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Email:</dt>
                <dd className="font-medium text-slate-800">{doctor.email || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Doctor ID:</dt>
                <dd className="font-medium text-slate-800 text-xs break-all">{id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Rating:</dt>
                <dd className="font-medium text-slate-800">
                  {doctor.rating ? `${doctor.rating} ⭐ (${doctor.rating_count || 0} reviews)` : 'No ratings yet'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Clinics Count:</dt>
                <dd className="font-medium text-slate-800">{doctor.clinic_affiliations?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDoctorProfile;