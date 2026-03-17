import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

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
import Chatbot from "./components/Chatbot"; // <-- AI Chatbot

const INITIAL_DOCTORS = [
  {
    id: 1,
    name: "Dr. Sarah Ahmed",
    specialty: "Cardiologist",
    clinic: "HeartCare Clinic",
    rating: "4.9",
    image: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: 2,
    name: "Dr. Omar Hassan",
    specialty: "Dentist",
    clinic: "SmileBright Center",
    rating: "4.8",
    image: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: 3,
    name: "Dr. Laila Mahmoud",
    specialty: "Dermatologist",
    clinic: "Skin & Beauty Hub",
    rating: "5.0",
    image: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 4,
    name: "Dr. Kareem Ali",
    specialty: "Pediatrician",
    clinic: "Happy Kids Hospital",
    rating: "4.7",
    image: "https://i.pravatar.cc/150?img=12",
  },
];

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [doctorsList, setDoctorsList] = useState(INITIAL_DOCTORS);

  // --- AUTH ---
  const handleAuth = (userData) => {
    setCurrentRole(userData.role);
    setCurrentUser(userData);
  };

  const handleSignup = (userData) => {
    setCurrentRole(userData.role);
    setCurrentUser(userData);
    if (userData.role === "doctor") {
      const newDocForGrid = {
        id: Date.now(),
        name: userData.name,
        specialty: userData.specialty,
        clinic: userData.clinic || "Independent Practice",
        image: userData.image,
        rating: "New",
      };
      setDoctorsList([...doctorsList, newDocForGrid]);
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    setIsMenuOpen(false);
  };

  // --- APPOINTMENTS ---
  const handleNewBooking = (bookingData) => {
    const newAppointment = {
      id: Date.now(),
      patientName:
        bookingData.patientName ||
        (currentUser ? currentUser.name : "Guest Patient"),
      doctor: bookingData.doctor,
      date: bookingData.date,
      time: bookingData.time,
      status: "Pending",
    };
    setAppointments([...appointments, newAppointment]);
  };

  const updateAppointmentStatus = (
    id,
    newStatus,
    newDate = null,
    newTime = null,
  ) => {
    if (newStatus === "Cancelled") {
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
            : appt,
        ),
      );
    }
  };

  // --- ADMIN SETTINGS ---
  const removeDoctor = (id) =>
    setDoctorsList(doctorsList.filter((doc) => doc.id !== id));
  const addDoctor = (newDoc) =>
    setDoctorsList([
      ...doctorsList,
      { ...newDoc, id: Date.now(), rating: "5.0" },
    ]);
  const toggleDoctorSuspension = (id) => {
    setDoctorsList(
      doctorsList.map((doc) =>
        doc.id === id ? { ...doc, isSuspended: !doc.isSuspended } : doc,
      ),
    );
  };

  // --- REVIEWS & RATINGS LOGIC (This calculates the stars!) ---
  const submitReview = (doctorId, rating, comment) => {
    setDoctorsList((prevDoctors) =>
      prevDoctors.map((doc) => {
        if (doc.id === doctorId) {
          const currentReviews = doc.reviews || [];
          const newReview = {
            id: Date.now(),
            patientName: currentUser ? currentUser.name : "Anonymous",
            rating: rating,
            comment: comment,
          };
          const updatedReviews = [newReview, ...currentReviews];

          // Calculate new average
          const totalStars = updatedReviews.reduce(
            (sum, rev) => sum + rev.rating,
            0,
          );
          const newAvg = (totalStars / updatedReviews.length).toFixed(1);

          return { ...doc, reviews: updatedReviews, rating: newAvg };
        }
        return doc;
      }),
    );
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans relative flex flex-col">
        {/* NAVBAR */}
        <nav className="bg-white p-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 border-b border-teal-50 shadow-sm relative">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl font-bold text-teal-600"
          >
            MediBook 🩺
          </Link>

          {/* DESKTOP MENU (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/clinics"
              className="text-slate-600 font-semibold hover:text-teal-600 transition-colors"
            >
              Clinics
            </Link>
            <Link
              to="/doctors"
              className="text-slate-600 font-semibold hover:text-teal-600 transition-colors"
            >
              Doctors
            </Link>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

            {!currentRole ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-teal-600 font-bold hover:underline"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-teal-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-teal-400 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {currentRole === "manager" && (
                  <Link
                    to="/manager-dashboard"
                    className="text-purple-700 font-bold bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
                  >
                    Admin Portal 👑
                  </Link>
                )}
                {currentRole === "doctor" && (
                  <Link
                    to="/dashboard"
                    className="text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors"
                  >
                    Doc Portal
                  </Link>
                )}
                {currentRole === "patient" && (
                  <Link
                    to="/patient-dashboard"
                    className="text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors"
                  >
                    My Portal
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
                  title="Logout"
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
              <Link
                onClick={() => setIsMenuOpen(false)}
                to="/clinics"
                className="text-lg font-bold text-slate-700"
              >
                Clinics
              </Link>
              <Link
                onClick={() => setIsMenuOpen(false)}
                to="/doctors"
                className="text-lg font-bold text-slate-700"
              >
                Doctors
              </Link>
              <hr className="border-slate-100" />

              {!currentRole ? (
                <div className="flex flex-col gap-4">
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/login"
                    className="text-lg font-bold text-teal-600 text-center py-3 bg-teal-50 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/signup"
                    className="text-lg font-bold text-white text-center py-3 bg-teal-500 rounded-xl shadow-md transition-colors hover:bg-teal-400"
                  >
                    Sign Up
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
                      Admin Portal 👑
                    </Link>
                  )}
                  {currentRole === "doctor" && (
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      to="/dashboard"
                      className="text-teal-700 font-bold text-center bg-teal-50 py-3 rounded-xl"
                    >
                      Doctor Portal
                    </Link>
                  )}
                  {currentRole === "patient" && (
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      to="/patient-dashboard"
                      className="text-teal-700 font-bold text-center bg-teal-50 py-3 rounded-xl"
                    >
                      My Portal
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-center text-lg font-bold text-rose-500 bg-rose-50 py-3 rounded-xl"
                  >
                    Logout 🚪
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

            {/* ⚠️ DOCTORS ROUTE: Must pass onAddReview here! ⚠️ */}
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
    </BrowserRouter>
  );
}

export default App;
