import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ترجمة الإنجليزية
const enTranslation = {
  "nav": {
    "home": "Home",
    "clinics": "Clinics",
    "doctors": "Doctors",
    "login": "Login",
    "signup": "Sign Up",
    "logout": "Logout",
    "adminPortal": "Admin Portal",
    "docPortal": "Doctor Portal",
    "myPortal": "My Portal"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error!",
    "tryAgain": "Try Again",
    "clearFilters": "Clear all filters",
    "search": "Search",
    "filter": "Filter",
    "showing": "Showing",
    "doctors": "doctors",
    "noResults": "No doctors match your search",
    "showAll": "Show all doctors",
    "bookAppointment": "Book Appointment",
    "reviews": "Reviews",
    "rating": "Rating"
  },
  "doctors": {
    "title": "Find a Specialist",
    "searchResults": "Search Results",
    "specialty": "Specialty",
    "filters": "Filters",
    "searchPlaceholder": "Doctor name, specialty, clinic...",
    "book": "Book Appointment",
    "viewReviews": "View Reviews",
    "newDoctor": "New",
    "noDoctors": "No doctors found matching your search",
    "prices": {
      "title": "Prices",
      "consultation": "Consultation",
      "followUp": "Follow-up"
    }
  },
  "auth": {
    "loginRequired": "Please login first to book an appointment",
    "login": "Login",
    "signup": "Sign Up",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "role": "Role"
  },
  "booking": {
    "title": "Book New Appointment",
    "selectDate": "Select Date",
    "availableSlots": "Available Slots",
    "noSlots": "No available slots for this day",
    "tryOtherDate": "Try another date or contact the doctor",
    "all": "All",
    "consultation": "Initial Consultation",
    "followUp": "Follow-up",
    "confirm": "Confirm Booking",
    "booking": "Booking...",
    "success": "Appointment booked successfully!"
  },
  "reviews": {
    "title": "Reviews",
    "noReviews": "No reviews yet",
    "beFirst": "Be the first to review this doctor",
    "ratingDistribution": "Rating Distribution",
    "stars": "stars",
    "writeReview": "Write a Review",
    "yourRating": "Your Rating",
    "yourComment": "Your Comment",
    "submit": "Submit Review",
    "alreadyReviewed": "Already Reviewed",
    "reviewed": "You have already reviewed this appointment"
  },
  "footer": {
    "copyright": "© 2026 MediBook. All rights reserved.",
    "about": "About",
    "contact": "Contact",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  }
};

// ترجمة العربية
const arTranslation = {
  "nav": {
    "home": "الرئيسية",
    "clinics": "العيادات",
    "doctors": "الأطباء",
    "login": "تسجيل الدخول",
    "signup": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "adminPortal": "لوحة الإدارة",
    "docPortal": "لوحة الطبيب",
    "myPortal": "لوحتي"
  },
  "common": {
    "loading": "جاري التحميل...",
    "error": "خطأ!",
    "tryAgain": "حاول مرة أخرى",
    "clearFilters": "مسح كل الفلاتر",
    "search": "بحث",
    "filter": "تصفية",
    "showing": "يظهر",
    "doctors": "طبيب",
    "noResults": "لم يتم العثور على أطباء تطابق بحثك",
    "showAll": "عرض كل الأطباء",
    "bookAppointment": "حجز موعد",
    "reviews": "التقييمات",
    "rating": "التقييم"
  },
  "doctors": {
    "title": "ابحث عن أخصائي",
    "searchResults": "نتائج البحث",
    "specialty": "التخصص",
    "filters": "الفلاتر",
    "searchPlaceholder": "اسم الدكتور، التخصص، العيادة...",
    "book": "حجز موعد",
    "viewReviews": "عرض التقييمات",
    "newDoctor": "جديد",
    "noDoctors": "لم يتم العثور على أطباء تطابق بحثك",
    "prices": {
      "title": "الأسعار",
      "consultation": "كشف أولي",
      "followUp": "متابعة"
    }
  },
  "auth": {
    "loginRequired": "يرجى تسجيل الدخول أولاً لحجز موعد",
    "login": "تسجيل الدخول",
    "signup": "إنشاء حساب",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "name": "الاسم",
    "role": "نوع الحساب"
  },
  "booking": {
    "title": "حجز موعد جديد",
    "selectDate": "اختر التاريخ",
    "availableSlots": "المواعيد المتاحة",
    "noSlots": "لا توجد مواعيد متاحة لهذا اليوم",
    "tryOtherDate": "جرب تاريخ آخر أو تواصل مع الطبيب",
    "all": "الكل",
    "consultation": "كشف أولي",
    "followUp": "متابعة",
    "confirm": "تأكيد الحجز",
    "booking": "جاري الحجز...",
    "success": "تم حجز الموعد بنجاح!"
  },
  "reviews": {
    "title": "التقييمات",
    "noReviews": "لا توجد تقييمات بعد",
    "beFirst": "كن أول من يقيم هذا الطبيب",
    "ratingDistribution": "توزيع التقييمات",
    "stars": "نجوم",
    "writeReview": "كتابة تقييم",
    "yourRating": "تقييمك",
    "yourComment": "تعليقك",
    "submit": "إرسال التقييم",
    "alreadyReviewed": "تم التقييم",
    "reviewed": "لقد قمت بتقييم هذا الموعد بالفعل"
  },
  "footer": {
    "copyright": "© ٢٠٢٦ ميدي بوك. جميع الحقوق محفوظة.",
    "about": "عن المنصة",
    "contact": "اتصل بنا",
    "privacy": "سياسة الخصوصية",
    "terms": "شروط الخدمة"
  }
};

// تهيئة i18n
i18n
  .use(LanguageDetector) // يكشف لغة المتصفح
  .use(initReactI18next) // يمرر i18n إلى react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React آمن من XSS
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// تغيير اتجاه الصفحة حسب اللغة
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // إضافة/إزالة كلاس للـ body
  if (lng === 'ar') {
    document.body.classList.add('arabic-mode');
    document.body.classList.remove('english-mode');
  } else {
    document.body.classList.add('english-mode');
    document.body.classList.remove('arabic-mode');
  }
});

// تهيئة أولية
const initialLng = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.dir = initialLng === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLng;

export default i18n;