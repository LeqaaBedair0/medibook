import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// You can move this to a separate api file later (recommended)
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  // withCredentials: true,    // only if you use cookies/sessions later
});

function Clinics() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchClinics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await API.get('/manager/clinics');

        // The backend already returns id as string and departments as array
        const formattedClinics = response.data.map(clinic => ({
          id: clinic.id,
          name: clinic.name || (i18n.language === 'en' ? 'Unnamed Clinic' : 'عيادة بدون اسم'),
          location: clinic.location || (i18n.language === 'en' ? '—' : '—'),
          rating: clinic.rating || 0,
          departments: Array.isArray(clinic.departments) ? clinic.departments : [],
          image:
            clinic.image ||
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
        }));

        if (isMounted) {
          setClinics(formattedClinics);
        }
      } catch (err) {
        console.error('Failed to load clinics:', err);
        if (isMounted) {
          setError(t('clinicsLoadError'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClinics();

    return () => {
      isMounted = false;
    };
  }, [t, i18n.language]);

  // ────────────────────────────────────────────────
  //  Loading & Error States
  // ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500"></div>
        <p className="mt-4 text-slate-600 font-medium">{t('loadingClinics')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 text-xl font-semibold mb-4">{t('error')}</div>
        <p className="text-slate-700 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  //  Main Render
  // ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-5 tracking-tight">
          {t('clinicsTitle')}
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          {t('clinicsSubtitle')}
        </p>
      </div>

      {/* Clinics Grid */}
      {clinics.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-teal-100">
          <p className="text-slate-500 text-xl font-medium">
            {t('noClinicsFound')}
          </p>
          <p className="text-slate-400 mt-2">{t('checkBackSoon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-teal-50 group flex flex-col"
            >
              {/* Image + Rating Badge */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={clinic.image}
                  alt={clinic.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {clinic.rating > 0 && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-amber-600 shadow-sm flex items-center gap-1">
                    <span>★</span>
                    <span>{Number(clinic.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">
                  {clinic.name}
                </h3>

                <p className="text-slate-500 text-sm mb-5 flex items-center gap-1.5">
                  <span>📍</span>
                  {clinic.location}
                </p>

                {/* Departments */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {clinic.departments.length > 0 ? (
                    clinic.departments.map((dept, idx) => (
                      <span
                        key={idx}
                        className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold border border-teal-100"
                      >
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      {t('specialtiesNotListed')}
                    </span>
                  )}
                </div>

                {/* Action */}
                <Link
                  to={`/doctors?clinic=${clinic.id}`}
                  className="mt-auto w-full text-center bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-semibold shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {t('viewDoctors')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Clinics;