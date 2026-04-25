// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';
import { toast } from 'react-hot-toast';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

function Home() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch top-rated doctors from real API
  useEffect(() => {
    const fetchTopDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch clinics to get names
        const clinicsRes = await API.get('/manager/clinics');
        const clinicsData = clinicsRes.data || [];
        
        const clinicMap = {};
        clinicsData.forEach(c => {
          const id = c._id || c.id;
          clinicMap[id] = c.name || `Clinic ${id.slice(-6)}`;
        });
        
        // Fetch doctors
        const doctorsRes = await API.get('/manager/doctors');
        let doctors = doctorsRes.data || [];
        
        // Enhance doctor data with clinic names and format
        let enhancedDoctors = doctors.map(doc => {
          const primaryClinic = doc.clinic_affiliations?.[0];
          const clinicName = primaryClinic
            ? clinicMap[primaryClinic.clinic_id] || 'Unknown'
            : 'Not Assigned';
            
          const prices = primaryClinic?.prices || {
            consultation: 0,
            follow_up: 0
          };
          
          return {
            ...doc,
            id: doc._id || doc.id,
            name: doc.name,
            specialty: doc.specialty,
            clinic_name: clinicName,
            rating: doc.rating || 0,
            rating_count: doc.rating_count || 0,
            image: doc.image || `https://ui-avatars.com/api/?name=${doc.name}&background=0D9488&color=fff&size=128`,
            prices: prices,
            isSuspended: doc.isSuspended || false
          };
        });
        
        // Filter out suspended doctors and sort by rating (highest first)
        const activeDoctors = enhancedDoctors.filter(doc => !doc.isSuspended);
        const topRated = activeDoctors
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4); // Get top 4 doctors for homepage
        
        setTopDoctors(topRated);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again later.');
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const formatRating = (rating) => {
    if (!rating || rating === 0) return 'New';
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <>
        {/* Hero Section with loading state */}
        <main className="bg-teal-50 flex flex-col items-center justify-center text-center py-24 px-4 rounded-b-[3rem] shadow-sm">
          <h2 className="text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
            Find Your Doctor. <br/> <span className="text-teal-500">Book in Seconds.</span>
          </h2>
          
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-full shadow-lg flex w-full max-w-3xl border border-teal-100 mt-8">
            <input 
              type="text" 
              placeholder="Search doctors, clinics, or specialties..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow px-6 py-3 outline-none rounded-l-full text-gray-700 bg-transparent" 
            />
            <button type="submit" className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-teal-400 transition-all cursor-pointer">
              Search
            </button>
          </form>
        </main>

        {/* Loading state for doctors section */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-10">Top Rated Specialists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-28"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (error && topDoctors.length === 0) {
    return (
      <>
        {/* Hero Section */}
        <main className="bg-teal-50 flex flex-col items-center justify-center text-center py-24 px-4 rounded-b-[3rem] shadow-sm">
          <h2 className="text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
            Find Your Doctor. <br/> <span className="text-teal-500">Book in Seconds.</span>
          </h2>
          
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-full shadow-lg flex w-full max-w-3xl border border-teal-100 mt-8">
            <input 
              type="text" 
              placeholder="Search doctors, clinics, or specialties..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow px-6 py-3 outline-none rounded-l-full text-gray-700 bg-transparent" 
            />
            <button type="submit" className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-teal-400 transition-all cursor-pointer">
              Search
            </button>
          </form>
        </main>

        {/* Error state */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-10">Top Rated Specialists</h2>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-teal-500 text-white px-6 py-2 rounded-full font-medium hover:bg-teal-600 transition"
            >
              Try Again
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <main className="bg-teal-50 flex flex-col items-center justify-center text-center py-24 px-4 rounded-b-[3rem] shadow-sm">
        <h2 className="text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
          Find Your Doctor. <br/> <span className="text-teal-500">Book in Seconds.</span>
        </h2>
        
        <form onSubmit={handleSearch} className="bg-white p-2 rounded-full shadow-lg flex w-full max-w-3xl border border-teal-100 mt-8">
          <input 
            type="text" 
            placeholder="Search doctors, clinics, or specialties..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-6 py-3 outline-none rounded-l-full text-gray-700 bg-transparent" 
          />
          <button type="submit" className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-teal-400 transition-all cursor-pointer">
            Search
          </button>
        </form>
      </main>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🔬</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Advance Technology</h3>
            <p className="text-slate-500 text-sm">State-of-the-art medical facilities.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🏥</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Comfortable Place</h3>
            <p className="text-slate-500 text-sm">Relaxing, modern waiting areas.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🩺</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Quality Equipment</h3>
            <p className="text-slate-500 text-sm">Strict equipment safety standards.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">👨‍⚕️</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Friendly Staff</h3>
            <p className="text-slate-500 text-sm">Compassionate professionals.</p>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16 items-center bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-teal-50">
          <div className="w-full lg:w-1/2 h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800" 
              className="w-full h-full object-cover rounded-2xl" 
              alt="Clinic" 
            />
          </div>
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-6">Welcome to our clinic</h2>
            <p className="text-slate-500 mb-8">Experience healthcare designed around you. Our specialists are here to provide top-tier medical assistance with a personal touch.</p>
            <button 
              onClick={() => navigate('/doctors')}
              className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold py-4 px-8 text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Top Rated Specialists Section - Using Real Data */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800">Top Rated Specialists</h2>
          <button 
            onClick={() => navigate('/doctors')}
            className="text-teal-600 font-medium hover:text-teal-700 transition flex items-center gap-1"
          >
            View All Doctors
            <span className="text-lg">→</span>
          </button>
        </div>
        
        {topDoctors.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <p className="text-slate-500">No doctors available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {topDoctors.map((doc) => (
              <DoctorCard 
                key={doc.id} 
                id={doc.id}
                name={doc.name}
                specialty={doc.specialty}
                clinic={doc.clinic_name}
                rating={formatRating(doc.rating)}
                rating_count={doc.rating_count}
                image={doc.image}
                prices={doc.prices}
                onBook={() => handleBookClick(doc)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      <BookingModal 
        doctor={selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
        onConfirm={(bookingInfo) => {
          console.log('Booking confirmed:', bookingInfo);
          toast.success('Appointment booked successfully!');
        }}
      />
    </>
  );
}

export default Home;