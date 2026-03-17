import React from 'react';
import { Link } from 'react-router-dom';

// Dummy data for our clinics
const DUMMY_CLINICS = [
  { 
    id: 1, 
    name: "Nile Valley Medical Center", 
    location: "Downtown Cairo", 
    rating: "4.8", 
    departments: ["Cardiology", "Neurology", "General"],
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop"
  },
  { 
    id: 2, 
    name: "Radiance Skincare Hub", 
    location: "Zamalek", 
    rating: "4.9", 
    departments: ["Dermatology", "Cosmetics"],
    image: "https://images.unsplash.com/photo-1514416432279-50fac261c7dd?w=400&h=300&fit=crop"
  },
  { 
    id: 3, 
    name: "Alexandria Dental Studio", 
    location: "Smouha", 
    rating: "4.7", 
    departments: ["Dentistry", "Orthodontics"],
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop"
  },
  { 
    id: 4, 
    name: "Happy Kids Pediatric", 
    location: "Maadi", 
    rating: "4.9", 
    departments: ["Pediatrics", "Nutrition"],
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=400&h=300&fit=crop"
  },
];

function Clinics() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      {/* Header Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
          Partner Clinics & Hospitals
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          We partner with the highest-rated medical facilities to ensure you receive the best care possible.
        </p>
      </div>

      {/* Grid of Clinics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DUMMY_CLINICS.map((clinic) => (
          <div key={clinic.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-teal-50 group flex flex-col sm:flex-row">
            
            {/* Clinic Image */}
            <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden relative">
              <img 
                src={clinic.image} 
                alt={clinic.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-amber-500 shadow-sm">
                ⭐ {clinic.rating}
              </div>
            </div>

            {/* Clinic Info */}
            <div className="p-6 sm:w-3/5 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-slate-800 mb-1">{clinic.name}</h3>
              <p className="text-slate-500 text-sm mb-4">📍 {clinic.location}</p>
              
              {/* Department Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {clinic.departments.map((dept, index) => (
                  <span key={index} className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-xs font-bold border border-teal-100">
                    {dept}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <Link to="/doctors" className="mt-auto w-full text-center bg-slate-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-700 transition-colors">
                View Doctors
              </Link>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}

export default Clinics;