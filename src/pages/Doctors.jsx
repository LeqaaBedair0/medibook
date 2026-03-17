import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';

const SPECIALTIES_LIST = ['Cardiologist', 'Dentist', 'Dermatologist', 'Pediatrician', 'Neurologist'];

// ⚠️ We MUST receive onAddReview as a prop here! ⚠️
function Doctors({ onBookAppointment, doctorsData, onAddReview }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const handleFilterToggle = (specialty) => {
    setSelectedFilters(prev => 
      prev.includes(specialty) ? prev.filter(i => i !== specialty) : [...prev, specialty]
    );
  };

  const filteredDoctors = doctorsData.filter(doc => {
    const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(doc.specialty);
    const nameStr = doc.name || "";
    const specStr = doc.specialty || "";
    const clinStr = doc.clinic || "";

    const matchesSearch = 
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinStr.toLowerCase().includes(searchTerm.toLowerCase());

    // Hide suspended doctors from the public patient view!
    return matchesFilter && matchesSearch && !doc.isSuspended;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-teal-50 sticky top-24">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Filters</h3>
          <div className="mb-6">
            <h4 className="font-medium text-slate-700 mb-3">Specialty</h4>
            <div className="space-y-2">
              {SPECIALTIES_LIST.map((spec, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedFilters.includes(spec)}
                    onChange={() => handleFilterToggle(spec)}
                    className="w-4 h-4 text-teal-500 rounded border-gray-200 cursor-pointer" 
                  />
                  <span className="text-slate-600 group-hover:text-teal-600 transition-colors">{spec}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800">
              {searchTerm ? `Results for "${searchTerm}"` : 'Find a Specialist'}
            </h2>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="text-teal-600 text-xs font-bold mt-1 text-left hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
          <span className="text-slate-500 text-sm font-medium">Showing {filteredDoctors.length} doctors</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <DoctorCard 
                key={doc.id} 
                {...doc} 
                onBook={() => setSelectedDoctor(doc)} 
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-teal-50">
              <p className="text-slate-400 font-medium text-lg">No specialists found matching your search.</p>
              <button onClick={() => {setSearchTerm(""); setSelectedFilters([]);}} className="text-teal-500 font-bold mt-2 hover:underline cursor-pointer">Reset all</button>
            </div>
          )}
        </div>
      </main>

      {/* ⚠️ Pass the function to the modal so it can actually fire! ⚠️ */}
      <BookingModal 
        doctor={selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
        onConfirm={onBookAppointment} 
        onAddReview={onAddReview} 
      />
    </div>
  );
}

export default Doctors;