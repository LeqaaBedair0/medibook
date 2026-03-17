import React from 'react';

// Notice we added 'onBook' to the props up here!
function DoctorCard({ name, specialty, clinic, rating, image, onBook }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-teal-50 flex flex-col items-center text-center group">
      
      <div className="w-24 h-24 rounded-full p-1 border-4 border-teal-100 group-hover:border-teal-400 transition-colors mb-4">
        <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
      </div>

      <h3 className="text-xl font-bold text-slate-800">{name}</h3>
      <p className="text-teal-600 font-medium text-sm mb-1">{specialty}</p>
      <p className="text-slate-500 text-sm mb-4">🏥 {clinic}</p>

      <div className="flex w-full items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <span className="text-amber-400 font-bold text-sm">⭐ {rating}</span>
        
        {/* We added the onClick event to this button! */}
        <button 
          onClick={onBook} 
          className="bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-white px-4 py-2 rounded-full font-bold text-sm transition-colors cursor-pointer"
        >
          Book Slot
        </button>
      </div>
    </div>
  );
}

export default DoctorCard;