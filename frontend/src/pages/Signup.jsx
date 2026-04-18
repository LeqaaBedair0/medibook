import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Signup({ onSignup }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const userData = {
      role: 'patient',
      name: name,
      email: email,
      password: password,
      specialty: 'Patient',
      clinic: null,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=fff&rounded=true&bold=true`
    };

    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await res.json();

      if (res.ok) {
        onSignup(userData);
        navigate('/patient-dashboard');
      } else {
        const errorMsg = isRTL 
          ? (result.error || "فشل إنشاء الحساب")
          : (result.error || "Signup failed");
        setErrorMessage(errorMsg);
      }
    } catch (err) { 
      const errorMsg = isRTL
        ? "تعذر الاتصال بالسيرفر. تأكد من تشغيل app.py"
        : "Unable to connect to server. Please check if app.py is running";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-teal-50 max-w-md w-full">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            {isRTL ? 'إنشاء حساب مريض ✨' : 'Create Patient Account ✨'}
          </h2>
          <p className="text-slate-500">
            {isRTL ? 'انضم إلى ميديبوك لإدارة مواعيدك' : 'Join MediBook to manage your appointments.'}
          </p>
        </div>

        {/* رسالة الخطأ - نفس تصميم Login */}
        {errorMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            isRTL ? 'text-right' : 'text-left'
          } bg-rose-50 text-rose-600 border border-rose-200`}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {isRTL ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input 
              type="text" 
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" 
              dir="ltr"
            />
          </div>

          <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input 
              type="email" 
              placeholder={isRTL ? 'example@mail.com' : 'example@mail.com'}
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" 
              dir="ltr"
            />
          </div>

          <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {isRTL ? 'كلمة المرور' : 'Password'}
            </label>
            <input 
              type="password" 
              placeholder={isRTL ? '••••••••' : '••••••••'}
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" 
              dir="ltr"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full bg-gradient-to-l from-teal-600 to-teal-500 text-white font-bold py-4 rounded-xl shadow-md hover:from-teal-700 hover:to-teal-600 transition-all cursor-pointer mt-6 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading 
              ? (isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...')
              : (isRTL ? 'تسجيل كمريض' : 'Register as Patient')
            }
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline cursor-pointer">
            {isRTL ? 'سجل الدخول من هنا' : 'Sign in here'}
          </Link>
        </p>

        {/* رابط تجريبي للاختبار - نفس Login */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            {isRTL ? 'للاختبار: استخدم أي بريد وكلمة سر 123456' : 'Demo: Use any email with password 123456'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;