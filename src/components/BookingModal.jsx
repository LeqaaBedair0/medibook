import React, { useState } from 'react';

function BookingModal({ doctor, onClose, onConfirm, onAddReview }) {
  const [selectedDate, setSelectedDate] = useState('Mon 16');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  
  // Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!doctor) return null;

  const handleBooking = () => {
    onConfirm({ doctor, date: selectedDate, time: selectedTime });
    onClose();
  };

  const handleReviewSubmit = () => {
    if (onAddReview) {
      onAddReview(doctor.id, rating, comment);
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setComment('');
      }, 3000); // Hide success message after 3 seconds
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container - Added max-h-[90vh] and overflow-y-auto so it scrolls nicely! */}
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-teal-50/50 p-6 flex items-center justify-between border-b border-teal-50 relative">
          <div className="flex items-center gap-4">
            <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">{doctor.name}</h3>
              <p className="text-sm font-bold text-teal-600">{doctor.specialty}</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 bg-white text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center shadow-sm transition-colors">
            ✕
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6">
          
          {/* --- BOOKING AREA --- */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">1. Select Date</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19'].map(date => (
                <button 
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedDate === date ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
                >
                  {date}
                </button>
              ))}
            </div>

            <h4 className="font-bold text-slate-800 mb-3 text-sm">2. Select Time</h4>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'].map(time => (
                <button 
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedTime === time ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
                >
                  {time}
                </button>
              ))}
            </div>

            <button onClick={handleBooking} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-md hover:bg-slate-700 transition-colors">
              Confirm Appointment
            </button>
          </div>

          {/* Divider */}
          <hr className="border-slate-100 my-6" />

          {/* --- REVIEW AREA --- */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3 text-sm">Rate & Review</h4>
            
            {reviewSubmitted ? (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-bold text-sm">
                ✅ Review Submitted Successfully!
              </div>
            ) : (
              <>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-colors cursor-pointer outline-none ${rating >= star ? 'text-amber-400 hover:text-amber-500' : 'text-slate-200 hover:text-amber-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea 
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:bg-white transition-colors mb-3 resize-none"
                  rows="3"
                ></textarea>
                
                <button 
                  onClick={handleReviewSubmit}
                  disabled={!comment.trim()}
                  className="bg-teal-50 text-teal-700 font-bold px-6 py-2.5 rounded-xl hover:bg-teal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default BookingModal;