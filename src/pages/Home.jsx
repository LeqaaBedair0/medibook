import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';

const DUMMY_DOCTORS = [
  { id: 1, name: "Dr. Sarah Ahmed", specialty: "Cardiologist", clinic: "HeartCare Clinic", rating: "4.9", image: "https://i.pravatar.cc/150?img=47" },
  { id: 2, name: "Dr. Omar Hassan", specialty: "Dentist", clinic: "SmileBright Center", rating: "4.8", image: "https://i.pravatar.cc/150?img=11" },
  { id: 3, name: "Dr. Laila Mahmoud", specialty: "Dermatologist", clinic: "Skin & Beauty Hub", rating: "5.0", image: "https://i.pravatar.cc/150?img=5" },
  { id: 4, name: "Dr. Kareem Ali", specialty: "Pediatrician", clinic: "Happy Kids Hospital", rating: "4.7", image: "https://i.pravatar.cc/150?img=12" },
];

function Home() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // Safety: only navigate if navigate function exists
    if (navigate) {
      navigate(`/doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

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
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50">
            <div className="text-3xl mb-4">🔬</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Advance Technology</h3>
            <p className="text-slate-500 text-sm">State-of-the-art medical facilities.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50">
            <div className="text-3xl mb-4">🏥</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Comfortable Place</h3>
            <p className="text-slate-500 text-sm">Relaxing, modern waiting areas.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50">
            <div className="text-3xl mb-4">🩺</div>
            <h3 className="font-bold text-slate-800 uppercase text-sm mb-2">Quality Equipment</h3>
            <p className="text-slate-500 text-sm">Strict equipment safety standards.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl text-center border border-gray-50">
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
            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800" className="w-full h-full object-cover rounded-2xl" alt="Clinic" />
          </div>
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-6">Welcome to our clinic</h2>
            <p className="text-slate-500 mb-8">Experience healthcare designed around you. Our specialists are here to provide top-tier medical assistance with a personal touch.</p>
            <button className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold py-4 px-8 text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all cursor-pointer">Learn More</button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-10">Top Rated Specialists</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {DUMMY_DOCTORS.map((doc) => (
            <DoctorCard key={doc.id} {...doc} onBook={() => setSelectedDoctor(doc)} />
          ))}
        </div>
      </section>

      <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
    </>
  );
}

export default Home;