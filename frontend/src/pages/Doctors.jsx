// src/pages/Doctors.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SPECIALTIES_LIST = [
  "Cardiology", "Pediatrics", "Dermatology", "General Surgery", "Orthopedics",
  "Gynecology & Obstetrics", "Ophthalmology", "ENT", "Neurology", "Psychiatry",
  "Internal Medicine", "Urology", "Radiology", "Anesthesiology", "Oncology", "Dentist"
];

const API = axios.create({ baseURL: 'http://13.63.47.45:8000/api' });

function Doctors() {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.warn('AuthProvider not found, using fallback');
    auth = { isAuthenticated: false };
  }

  const { isAuthenticated } = auth;
  const navigate = useNavigate();
  const location = useLocation();

  const [doctors, setDoctors] = useState([]);
  const [clinicsMap, setClinicsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showDoctorReviewsModal, setShowDoctorReviewsModal] = useState(false);
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedDoctorForReviews, setSelectedDoctorForReviews] = useState(null);
  const [doctorStats, setDoctorStats] = useState({});

  const query = new URLSearchParams(location.search);
  const clinicFilter = query.get('clinic');

  useEffect(() => {
    const initialSearch = query.get('search') || '';
    setSearchTerm(initialSearch);
  }, [location.search]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicsRes = await API.get('/manager/clinics');
        const clinicsData = clinicsRes.data || [];

        const clinicMap = {};
        clinicsData.forEach(c => {
          const id = c._id || c.id;
          clinicMap[id] = c.name || `Clinic ${id.slice(-6)}`;
        });

        if (mounted) setClinicsMap(clinicMap);

        const doctorsRes = await API.get('/manager/doctors');
        let data = doctorsRes.data || [];

        let enhanced = data.map(doc => {
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
            clinic_name: clinicName,
            id: doc._id || doc.id,
            rating: doc.rating || 0,
            rating_count: doc.rating_count || 0,
            image: doc.image || `https://ui-avatars.com/api/?name=${doc.name}&background=0D9488&color=fff&size=128`,
            prices: prices,
            clinic_affiliations: doc.clinic_affiliations || []
          };
        });

        if (clinicFilter) {
          enhanced = enhanced.filter(doc =>
            doc.clinic_affiliations?.some(a => a.clinic_id === clinicFilter)
          );
        }

        if (mounted) setDoctors(enhanced);
      } catch (err) {
        console.error('Error loading doctors/clinics:', err);
        if (mounted) setError('Failed to load doctors. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, [clinicFilter]);

  const fetchDoctorReviews = async (doctorId, doctorName) => {
    setReviewsLoading(true);
    setDoctorReviews([]);
    setSelectedDoctorForReviews(doctorName);

    try {
      const res = await fetch(`${API.defaults.baseURL}/doctor/${doctorId}/reviews`);
      if (!res.ok) throw new Error('Failed to load doctor reviews');
      const data = await res.json();
      setDoctorReviews(data.reviews || []);

      const reviews = data.reviews || [];
      const totalRatings = reviews.length;
      const averageRating = totalRatings > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : 0;

      setDoctorStats({
        average: averageRating,
        total: totalRatings,
        distribution: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length
        }
      });
    } catch (err) {
      toast.error('Failed to load doctor reviews');
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const openDoctorReviews = (doctor) => {
    fetchDoctorReviews(doctor.id, doctor.name);
    setShowDoctorReviewsModal(true);
  };

  const handleFilterToggle = specialty => {
    setSelectedFilters(prev =>
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
    );
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSpecialty = selectedFilters.length === 0 || selectedFilters.includes(doc.specialty);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      doc.name?.toLowerCase().includes(searchLower) ||
      doc.specialty?.toLowerCase().includes(searchLower) ||
      doc.clinic_name?.toLowerCase().includes(searchLower);

    return matchesSpecialty && matchesSearch && !doc.isSuspended;
  });

  const handleBookClick = (doctor) => {
    if (!isAuthenticated) {
      toast('Please login first to book an appointment', {
        icon: '🔐',
        duration: 4000,
        position: 'top-center'
      });

      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          intendedDoctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
          }
        }
      });
      return;
    }

    setSelectedDoctor(doctor);
  };

  const clearAll = () => {
    setSearchTerm('');
    setSelectedFilters([]);
  };

  const formatPrice = (price) => {
    return price.toLocaleString() + ' EGP';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="text-red-600 text-2xl mb-4">Error!</div>
        <p className="text-slate-700 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Filters */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-md border border-teal-50/70 p-6 sticky top-20">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Filters</h3>

            <div className="mb-8">
              <label className="block text-slate-700 font-medium mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Doctor name, specialty, clinic..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Specialty</h4>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {SPECIALTIES_LIST.map(spec => (
                  <label
                    key={spec}
                    className="flex items-center gap-3 cursor-pointer group text-slate-700 hover:text-teal-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(spec)}
                      onChange={() => handleFilterToggle(spec)}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="select-none">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {(searchTerm || selectedFilters.length > 0) && (
              <button
                onClick={clearAll}
                className="mt-8 w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium py-2.5 rounded-xl transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              {searchTerm || clinicFilter ? 'Search Results' : 'Find a Specialist'}
            </h2>
            <div className="text-slate-500 font-medium">
              Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-teal-100 p-12 text-center">
              <p className="text-slate-500 text-xl font-medium mb-4">
                No doctors found matching your search
              </p>
              <button
                onClick={clearAll}
                className="text-teal-600 hover:text-teal-800 font-semibold underline"
              >
                View All Doctors
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              {filteredDoctors.map(doc => (
                // Professional Doctor Card with centered layout
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden group hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="p-6 pb-4 flex-1">
                    
                    {/* Centered Layout - Image above text for full name display */}
                    <div className="flex flex-col items-center text-center">
                      {/* Doctor Image - Centered */}
                      <div className="relative mb-4">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-28 h-28 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300 border-2 border-white mx-auto"
                        />
                        {doc.rating >= 4.5 && (
                          <span className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                            🌟 Featured
                          </span>
                        )}
                      </div>
                      
                      {/* Doctor Name - Full width, no truncation */}
                      <h3 className="font-bold text-xl text-slate-800 group-hover:text-teal-700 transition break-words w-full">
                        Dr. {doc.name}
                      </h3>
                      
                      {/* Specialty */}
                      <span className="inline-block bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                        {doc.specialty}
                      </span>
                      
                      {/* Clinic Name */}
                      <p className="text-sm text-slate-500 mt-3 flex items-center justify-center gap-1">
                        <span className="text-lg">🏥</span>
                        <span className="break-words">{doc.clinic_name}</span>
                      </p>
                    </div>

                    {/* Rating Section - Clean & Professional */}
                    <div className="mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 text-xl">⭐</span>
                          <span className="font-bold text-base text-slate-800">
                            {doc.rating > 0 ? doc.rating.toFixed(1) : 'New'}
                          </span>
                          {doc.rating > 0 && (
                            <>
                              <span className="text-slate-300 text-sm">•</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-base ${
                                      star <= Math.round(doc.rating)
                                        ? 'text-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-slate-500">
                                ({doc.rating_count || 0})
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => openDoctorReviews(doc)}
                          className="text-xs bg-white px-3 py-1.5 rounded-xl text-amber-700 font-medium hover:bg-amber-50 transition-all shadow-sm flex items-center gap-1"
                        >
                          <span>Details</span>
                          <span className="text-sm">→</span>
                        </button>
                      </div>
                    </div>

                    {/* Price Section - Simplified inline layout */}
                    <div className="mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-teal-600 text-lg">💰</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-slate-500 font-medium">Consultation:</span>
                            <span className="text-base font-bold text-teal-700">
                              {formatPrice(doc.prices?.consultation || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-600 text-lg">🔄</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-slate-500 font-medium">Follow-up:</span>
                            <span className="text-base font-bold text-teal-700">
                              {formatPrice(doc.prices?.follow_up || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Button - Fixed at bottom */}
                  <div className="px-6 pb-6 pt-2 flex gap-3 mt-auto">
                    <button
                      onClick={() => handleBookClick(doc)}
                      className="w-full py-3 bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-teal-200 flex items-center justify-center gap-2"
                    >
                      <span>📅</span>
                      <span>Book Appointment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onConfirm={(bookingInfo) => {
            console.log('Booking confirmed:', bookingInfo);
            toast.success('Appointment booked successfully!');
          }}
        />
      )}

      {/* Doctor Reviews Modal */}
      {showDoctorReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-l from-teal-50 to-amber-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  Dr. {selectedDoctorForReviews} Reviews
                </h3>
                {doctorStats.total > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl text-yellow-500">⭐</span>
                      <span className="text-2xl font-bold text-slate-800">{doctorStats.average}</span>
                      <span className="text-slate-500">out of 5</span>
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-600 font-medium">{doctorStats.total} review{doctorStats.total !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDoctorReviewsModal(false)}
                className="text-4xl text-slate-400 hover:text-rose-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin h-12 w-12 border-4 border-teal-500 rounded-full border-t-transparent"></div>
                  <p className="mt-4 text-slate-600 font-medium">Loading reviews...</p>
                </div>
              ) : doctorReviews.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <span className="text-6xl mb-4 block">📝</span>
                  <p className="text-xl font-medium text-slate-600">No reviews yet</p>
                  <p className="text-slate-500 mt-2">Be the first to review this doctor</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rating Distribution */}
                  {doctorStats.total > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                      <h4 className="font-bold text-lg mb-4">Rating Distribution</h4>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = doctorStats.distribution[stars] || 0;
                          const percentage = doctorStats.total > 0 ? (count / doctorStats.total) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm font-bold w-12">{stars} stars</span>
                              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600 w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {doctorReviews.map((review, index) => (
                    <div
                      key={review._id || index}
                      className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-200 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        {/* Patient Avatar */}
                        {review.patient_image ? (
                          <img
                            src={review.patient_image}
                            alt={review.patient_name}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-xl shadow-sm">
                            {review.patient_name?.charAt(0) || 'P'}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <div>
                              <h5 className="font-bold text-lg text-slate-800">
                                {review.patient_name || 'Patient'}
                              </h5>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xl ${
                                      star <= review.rating
                                        ? 'text-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          {review.comment && (
                            <div className="mt-4 bg-slate-50 p-4 rounded-xl border-r-4 border-teal-400">
                              <p className="text-slate-700 leading-relaxed">"{review.comment}"</p>
                            </div>
                          )}

                          {/* Visit Type Badge */}
                          {review.visit_type && (
                            <div className="mt-3 flex gap-2">
                              <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold">
                                {review.visit_type === 'consultation' ? 'Consultation' : 'Follow-up'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;