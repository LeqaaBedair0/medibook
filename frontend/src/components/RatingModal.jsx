import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

function RatingModal({ isOpen, onClose, appointment, currentUser, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://13.63.47.45:8000/api/appointments/${appointment._id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: currentUser.id,
          doctor_id: appointment.doctor_id,
          rating: rating,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Review submitted successfully!');
        onReviewSubmitted();
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Rate Your Experience</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Dr. {appointment.doctor_name}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-300 hover:text-slate-600 text-3xl font-light"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <img 
                src={appointment.doctor_image || `https://ui-avatars.com/api/?name=${appointment.doctor_name}&background=0D9488&color=fff&size=64`}
                alt={appointment.doctor_name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div>
                <p className="font-bold text-slate-800">{appointment.doctor_name}</p>
                <p className="text-xs text-slate-400">{appointment.date} • {appointment.start_time}</p>
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">
                Your Rating
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-all transform hover:scale-110 focus:outline-none"
                    type="button"
                  >
                    <span className={
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400'
                        : 'text-slate-200'
                    }>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-bold text-slate-500 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this doctor..."
                rows="4"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${
                submitting || rating === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-100'
              }`}
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;