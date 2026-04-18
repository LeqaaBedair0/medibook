import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="flex items-center gap-1 border border-slate-200 rounded-full p-1 bg-white/80 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
          !isRTL 
            ? 'bg-teal-500 text-white shadow-sm scale-105' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
          isRTL 
            ? 'bg-teal-500 text-white shadow-sm scale-105' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="التبديل إلى العربية"
      >
        عربي
      </button>
    </div>
  );
};

export default LanguageSwitcher;