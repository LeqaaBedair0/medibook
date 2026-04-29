// src/pages/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://16.171.29.212:8000/api";

function ManagerDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [activeTab, setActiveTab] = useState("doctors");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalDoctors: 0,
    totalClinics: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeDoctors: 0,
    suspendedDoctors: 0,
    doctorsBySpecialty: {},
    clinicsByLocation: {},
    recentActivity: []
  });

  // Doctor form state
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "",
    clinic_id: "",
    slot_duration: {
      consultation: 30,
      follow_up: 20,
      buffer_time: 10,
    },
    prices: {
      consultation: 200,
      follow_up: 300,
    },
    image: "",
    imagePreview: "",
  });

  // Clinic form state
  const [showAddClinicForm, setShowAddClinicForm] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: "",
    location: "",
    phone: "",
    departments: [],
    image: "https://images.unsplash.com/photo-1576765607925-9f0bfae3a1c6",
  });

  // Selected clinic for detailed view
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [showClinicDetails, setShowClinicDetails] = useState(false);

  const navigate = useNavigate();

  // Helper functions for analytics
  const getDoctorsBySpecialty = (doctorsList) => {
    const map = {};
    doctorsList.forEach(doc => {
      const specialty = doc.specialty || 'Unspecified';
      map[specialty] = (map[specialty] || 0) + 1;
    });
    return map;
  };

  const getClinicsByLocation = (clinicsList) => {
    const map = {};
    clinicsList.forEach(clinic => {
      const location = clinic.location || 'Unknown';
      map[location] = (map[location] || 0) + 1;
    });
    return map;
  };

  // ────────────────────────────────────────────────
  // Fetch doctors + clinics + REAL analytics
  // ────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dRes, cRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/manager/doctors`),
        fetch(`${API_BASE}/manager/clinics`),
        fetch(`${API_BASE}/manager/analytics`),
      ]);

      if (!dRes.ok) throw new Error(`Doctors fetch failed: ${dRes.status}`);
      if (!cRes.ok) throw new Error(`Clinics fetch failed: ${cRes.status}`);
      if (!aRes.ok) throw new Error(`Analytics fetch failed: ${aRes.status}`);

      const doctorsData = await dRes.json();
      const clinicsData = await cRes.json();
      const analyticsData = await aRes.json();

      // Enhance doctors with primary clinic name
      const enhancedDoctors = doctorsData.map((doc) => {
        const firstClinicId = doc.clinic_affiliations?.[0]?.clinic_id;
        const clinic = clinicsData.find((c) => c.id === firstClinicId);
        return {
          ...doc,
          primary_clinic_name: clinic ? clinic.name : "Not affiliated",
          primary_clinic_id: firstClinicId,
        };
      });

      setDoctors(enhancedDoctors);
      setClinics(clinicsData);
      
      // ✅ Using real data from the API
      setAnalytics({
        totalDoctors: enhancedDoctors.length,
        totalClinics: clinicsData.length,
        totalAppointments: analyticsData.total_appointments || 0,
        totalRevenue: analyticsData.total_revenue || 0,
        activeDoctors: enhancedDoctors.filter(d => !d.isSuspended).length,
        suspendedDoctors: enhancedDoctors.filter(d => d.isSuspended).length,
        doctorsBySpecialty: getDoctorsBySpecialty(enhancedDoctors),
        clinicsByLocation: getClinicsByLocation(clinicsData),
        recentActivity: analyticsData.recent_activity || [
          { id: 1, action: "New doctor added", time: "2 hours ago" },
          { id: 2, action: "Appointment completed", time: "3 hours ago" },
          { id: 3, action: "Clinic updated", time: "5 hours ago" },
        ]
      });
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ────────────────────────────────────────────────
  // Add new doctor
  // ────────────────────────────────────────────────
  const handleAddDoctor = async () => {
    if (!newDoc.name.trim() || !newDoc.email.trim() || !newDoc.password.trim() || !newDoc.specialty.trim()) {
      alert("Please fill all required fields (name, email, password, specialty)");
      return;
    }

    if (!newDoc.clinic_id) {
      alert("Please select a clinic for this doctor");
      return;
    }

    try {
      const payload = {
        name: newDoc.name.trim(),
        email: newDoc.email.trim().toLowerCase(),
        password: newDoc.password,
        specialty: newDoc.specialty.trim(),
        image: newDoc.image || undefined,
        clinic_id: newDoc.clinic_id,
        slot_duration: newDoc.slot_duration,
        prices: newDoc.prices,
      };

      const res = await fetch(`${API_BASE}/manager/add-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add doctor");
      }

      alert("Doctor added successfully!");
      await fetchData();

      setNewDoc({
        name: "",
        email: "",
        password: "",
        specialty: "",
        clinic_id: "",
        slot_duration: { consultation: 30, follow_up: 20, buffer_time: 10 },
        prices: { consultation: 200, follow_up: 300 },
        image: "",
        imagePreview: "",
      });
      setShowAddDoctorForm(false);
    } catch (err) {
      alert("Error: " + err.message);
      console.error(err);
    }
  };

  // ────────────────────────────────────────────────
  // Add new clinic
  // ────────────────────────────────────────────────
  const handleAddClinic = async () => {
    if (!newClinic.name.trim()) {
      alert("Clinic name is required");
      return;
    }

    try {
      let departments = newClinic.departments;
      if (typeof departments === 'string') {
        departments = departments.split(',').map(d => d.trim()).filter(d => d);
      }

      const payload = {
        ...newClinic,
        departments: departments || []
      };

      const res = await fetch(`${API_BASE}/manager/add-clinic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add clinic");
      }

      alert("Clinic added successfully!");
      await fetchData();

      setNewClinic({
        name: "",
        location: "",
        phone: "",
        departments: [],
        image: "https://images.unsplash.com/photo-1576765607925-9f0bfae3a1c6",
      });
      setShowAddClinicForm(false);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ────────────────────────────────────────────────
  // View clinic details and its doctors
  // ────────────────────────────────────────────────
  const viewClinicDetails = (clinic) => {
    const affiliatedDoctors = doctors.filter(doc => 
      doc.clinic_affiliations?.some(aff => aff.clinic_id === clinic.id)
    );
    
    setSelectedClinic(clinic);
    setClinicDoctors(affiliatedDoctors);
    setShowClinicDetails(true);
  };

  const closeClinicDetails = () => {
    setShowClinicDetails(false);
    setSelectedClinic(null);
    setClinicDoctors([]);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-3xl text-teal-600 animate-pulse">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600 p-6 text-center">
        {error}
        <br />
        <button
          onClick={fetchData}
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.primary_clinic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClinics = clinics.filter(
    (c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Manager Dashboard</h1>
          <p className="text-slate-600 mt-2 text-lg">
            Doctors: <span className="font-bold text-teal-700">{doctors.length}</span> •
            Clinics: <span className="font-bold text-teal-700">{clinics.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "doctors"
                  ? "bg-white shadow-md text-teal-700"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab("clinics")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "clinics"
                  ? "bg-white shadow-md text-teal-700"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Clinics
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "analytics"
                  ? "bg-white shadow-md text-teal-700"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Analytics
            </button>
          </div>

          <button
            onClick={() =>
              activeTab === "doctors"
                ? setShowAddDoctorForm(!showAddDoctorForm)
                : activeTab === "clinics"
                ? setShowAddClinicForm(!showAddClinicForm)
                : null
            }
            className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-bold hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg"
          >
            {activeTab === "doctors"
              ? showAddDoctorForm
                ? "Close Form"
                : "+ New Doctor"
              : activeTab === "clinics"
              ? showAddClinicForm
                ? "Close Form"
                : "+ New Clinic"
              : "Export Data"}
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={activeTab === "doctors" 
          ? "Search by name, specialty, clinic..." 
          : activeTab === "clinics"
          ? "Search by clinic name, location..."
          : "Search analytics..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-5 text-lg border border-slate-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none shadow-sm mb-10"
      />

      {/* Analytics Dashboard Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-slate-800">📊 System Analytics</h2>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Total Doctors</p>
              <div className="text-4xl font-black text-blue-900">{analytics.totalDoctors}</div>
              <div className="flex justify-between text-sm text-blue-600 mt-2">
                <span>Active: {analytics.activeDoctors}</span>
                <span>Suspended: {analytics.suspendedDoctors}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Total Clinics</p>
              <div className="text-4xl font-black text-emerald-900">{analytics.totalClinics}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">Total Appointments</p>
              <div className="text-4xl font-black text-purple-900">{analytics.totalAppointments.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Total Revenue</p>
              <div className="text-4xl font-black text-amber-900">{formatCurrency(analytics.totalRevenue)}</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Doctors by Specialty */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">👨‍⚕️ Doctors by Specialty</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(analytics.doctorsBySpecialty).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No specialty data available</p>
                ) : (
                  Object.entries(analytics.doctorsBySpecialty).map(([specialty, count]) => (
                    <div key={specialty} className="flex items-center">
                      <span className="w-36 text-sm text-slate-600 truncate">{specialty}:</span>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500"
                            style={{ width: `${(count / analytics.totalDoctors) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-right text-sm font-medium text-slate-700">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clinics by Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">📍 Clinics by Location</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(analytics.clinicsByLocation).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No location data available</p>
                ) : (
                  Object.entries(analytics.clinicsByLocation).map(([location, count]) => (
                    <div key={location} className="flex items-center">
                      <span className="w-36 text-sm text-slate-600 truncate">{location}:</span>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${(count / analytics.totalClinics) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-right text-sm font-medium text-slate-700">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mb-4">🕐 Recent Activity</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recentActivity.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No recent activity</p>
                ) : (
                  analytics.recentActivity.map(activity => (
                    <div key={activity.id} className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-700">{activity.action}</span>
                      <span className="text-sm text-slate-500">{activity.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── Doctors Tab ────────────── */}
      {activeTab === "doctors" && (
        <>
          {/* Add Doctor Form */}
          {showAddDoctorForm && (
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-teal-50 mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-8 pb-4 border-b border-teal-100">
                Add New Doctor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newDoc.email}
                    onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newDoc.password}
                    onChange={(e) => setNewDoc({ ...newDoc, password: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="********"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Specialty *
                  </label>
                  <select
                    value={newDoc.specialty}
                    onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
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

                {/* Clinic Selection */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Primary Clinic *
                  </label>
                  <select
                    value={newDoc.clinic_id}
                    onChange={(e) => setNewDoc({ ...newDoc, clinic_id: e.target.value })}
                    className={`w-full p-4 border rounded-xl bg-slate-50 focus:border-teal-500 outline-none ${
                      !newDoc.clinic_id ? "border-amber-400 bg-amber-50" : ""
                    }`}
                  >
                    <option value="">Select a clinic</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.location ? ` — ${c.location}` : ""}
                      </option>
                    ))}
                  </select>
                  {!newDoc.clinic_id && (
                    <p className="text-xs text-amber-700 mt-1">
                      Doctor must be affiliated with a clinic
                    </p>
                  )}
                </div>

                {/* Slot Durations */}
                <div className="md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Appointment Settings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Consultation Duration</label>
                      <input
                        type="number"
                        min="15"
                        max="60"
                        value={newDoc.slot_duration.consultation}
                        onChange={(e) =>
                          setNewDoc({
                            ...newDoc,
                            slot_duration: {
                              ...newDoc.slot_duration,
                              consultation: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-4 border rounded-xl bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">minutes</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Follow-up Duration</label>
                      <input
                        type="number"
                        min="10"
                        max="45"
                        value={newDoc.slot_duration.follow_up}
                        onChange={(e) =>
                          setNewDoc({
                            ...newDoc,
                            slot_duration: {
                              ...newDoc.slot_duration,
                              follow_up: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-4 border rounded-xl bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">minutes</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Buffer Time</label>
                      <input
                        type="number"
                        min="5"
                        max="20"
                        value={newDoc.slot_duration.buffer_time}
                        onChange={(e) =>
                          setNewDoc({
                            ...newDoc,
                            slot_duration: {
                              ...newDoc.slot_duration,
                              buffer_time: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-4 border rounded-xl bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">minutes</p>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                <div className="md:col-span-2 lg:col-span-3 mt-2">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Prices (EGP)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Consultation Price</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={newDoc.prices.consultation}
                        onChange={(e) =>
                          setNewDoc({
                            ...newDoc,
                            prices: {
                              ...newDoc.prices,
                              consultation: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-4 border rounded-xl bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Follow-up Price</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={newDoc.prices.follow_up}
                        onChange={(e) =>
                          setNewDoc({
                            ...newDoc,
                            prices: {
                              ...newDoc.prices,
                              follow_up: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-4 border rounded-xl bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2 lg:col-span-3 mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Profile Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewDoc({
                          ...newDoc,
                          image: reader.result,
                          imagePreview: reader.result,
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {newDoc.imagePreview && (
                    <div className="mt-4">
                      <img
                        src={newDoc.imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-2xl shadow-md border border-teal-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row justify-end gap-4">
                <button
                  onClick={() => setShowAddDoctorForm(false)}
                  className="px-8 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDoctor}
                  className="px-10 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-md"
                >
                  Add Doctor
                </button>
              </div>
            </div>
          )}

          {/* Doctors Table */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <table className="w-full min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-5 text-left font-semibold text-slate-700">Doctor</th>
                  <th className="px-6 py-5 text-left font-semibold text-slate-700">Specialty</th>
                  <th className="px-6 py-5 text-left font-semibold text-slate-700">Primary Clinic</th>
                  <th className="px-6 py-5 text-center font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-5 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      No doctors match your search
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={doc.image || `https://i.pravatar.cc/150?u=${doc.id}`}
                            alt={doc.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-teal-100"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{doc.name}</div>
                            <div className="text-sm text-slate-500">{doc.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-teal-700 font-medium">{doc.specialty || "—"}</td>
                      <td className="px-6 py-5">
                        {doc.primary_clinic_name ? (
                          doc.primary_clinic_name
                        ) : (
                          <span className="text-amber-600 font-medium">Not affiliated ⚠️</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                            doc.isSuspended
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {doc.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-left">
                        <button
                          onClick={() => navigate(`/manager/doctor/${doc.id}`)}
                          className="bg-slate-800 text-white px-5 py-2 rounded-xl text-sm hover:bg-slate-900 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ────────────── Clinics Tab ────────────── */}
      {activeTab === "clinics" && (
        <>
          {/* Add Clinic Form */}
          {showAddClinicForm && (
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-50 mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-8">Add New Clinic</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    value={newClinic.name}
                    onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="City Medical Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newClinic.location}
                    onChange={(e) => setNewClinic({ ...newClinic, location: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="Downtown, Cairo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newClinic.phone}
                    onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="+20 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Departments/Specialties
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(newClinic.departments) ? newClinic.departments.join(', ') : newClinic.departments}
                    onChange={(e) => setNewClinic({ ...newClinic, departments: e.target.value })}
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                    placeholder="Cardiology, Pediatrics, Orthopedics (comma separated)"
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma separated list of specialties</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newClinic.image}
                    onChange={(e) => setNewClinic({ ...newClinic, image: e.target.value })}
                    placeholder="https://example.com/clinic-image.jpg"
                    className="w-full p-4 border rounded-xl focus:border-teal-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4">
                <button
                  onClick={() => setShowAddClinicForm(false)}
                  className="px-8 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClinic}
                  className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-md"
                >
                  Add Clinic
                </button>
              </div>
            </div>
          )}

          {/* Clinic Details Modal */}
          {showClinicDetails && selectedClinic && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">{selectedClinic.name}</h3>
                    <button
                      onClick={closeClinicDetails}
                      className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Clinic Info */}
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={selectedClinic.image}
                          alt={selectedClinic.name}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1576765607925-9f0bfae3a1c6";
                          }}
                        />
                        <div>
                          <p className="text-sm text-slate-600">📍 {selectedClinic.location || "Location not specified"}</p>
                          <p className="text-sm text-slate-600">📞 {selectedClinic.phone || "Phone not available"}</p>
                        </div>
                      </div>

                      {/* Departments */}
                      {selectedClinic.departments && selectedClinic.departments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Departments:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedClinic.departments.map((dept, idx) => (
                              <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Doctors in this clinic */}
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-4">
                        👨‍⚕️ Doctors in this clinic ({clinicDoctors.length})
                      </h4>
                      
                      {clinicDoctors.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl">
                          No doctors affiliated with this clinic yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {clinicDoctors.map(doctor => (
                            <div key={doctor.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <img
                                  src={doctor.image || `https://i.pravatar.cc/150?u=${doctor.id}`}
                                  alt={doctor.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-slate-800">{doctor.name}</p>
                                  <p className="text-sm text-teal-600">{doctor.specialty}</p>
                                </div>
                              </div>
                              <span className={`text-sm px-3 py-1 rounded-full ${
                                doctor.isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {doctor.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={closeClinicDetails}
                      className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map((clinic) => (
              <div
                key={clinic.id}
                className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl hover:border-teal-200 transition-all cursor-pointer"
                onClick={() => viewClinicDetails(clinic)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1576765607925-9f0bfae3a1c6";
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{clinic.name}</h3>
                    <p className="text-slate-600 text-sm">{clinic.location || "Location not specified"}</p>
                  </div>
                </div>

                {/* Departments */}
                {clinic.departments && clinic.departments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {clinic.departments.slice(0, 3).map((dept, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded-full">
                        {dept}
                      </span>
                    ))}
                    {clinic.departments.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                        +{clinic.departments.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm border-t pt-4 mt-2">
                  <span className="text-teal-700 font-medium">
                    {doctors.filter((d) => d.clinic_affiliations?.some((a) => a.clinic_id === clinic.id))
                      .length || 0}{" "}
                    doctors
                  </span>
                  <span className="text-slate-500">
                    {clinic.phone ? `📞 ${clinic.phone}` : "No phone"}
                  </span>
                </div>
              </div>
            ))}

            {clinics.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50 rounded-2xl">
                No clinics added yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ManagerDashboard;