import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ✅ إضافة الترجمة

function Login({ onLogin }) {
  const { t, i18n } = useTranslation(); // ✅ استخدام الترجمة
  const isRTL = i18n.language === 'ar';
  
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // ✅ لعرض الأخطاء بشكل أفضل
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://16.171.29.212:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user); 
        
        // التوجيه بناءً على الدور
        if (data.user.role === 'manager') {
          navigate('/manager-dashboard');
        } else if (data.user.role === 'doctor') {
          navigate('/dashboard');
        } else {
          navigate('/patient-dashboard');
        }
      } else {
        // عرض رسالة الخطأ حسب اللغة
        const errorMsg = isRTL 
          ? (data.error === "Invalid credentials" 
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
              : data.error || "فشل تسجيل الدخول")
          : (data.error || "Login failed. Please check your credentials.");
        
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error("Login Error:", error);
      
      const errorMsg = isRTL
        ? "لا يمكن الاتصال بالخادم. تأكد من تشغيل Flask على المنفذ 8000"
        : "Cannot connect to server. Make sure Flask is running on port 8000.";
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ترجمة الأدوار
  const getRoleName = (roleKey) => {
    const roles = {
      patient: isRTL ? 'مريض' : 'Patient',
      doctor: isRTL ? 'طبيب' : 'Doctor',
      manager: isRTL ? 'مدير' : 'Manager'
    };
    return roles[roleKey] || roleKey;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-teal-50 max-w-md w-full text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          {isRTL ? 'مرحباً بعودتك 👋' : 'Welcome Back 👋'}
        </h2>
        <p className="text-slate-500 mb-8">
          {isRTL ? 'الرجاء إدخال بياناتك لتسجيل الدخول' : 'Please enter your details to sign in'}
        </p>
        
        {/* رسالة الخطأ */}
        {errorMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            isRTL ? 'text-right' : 'text-left'
          } bg-rose-50 text-rose-600 border border-rose-200`}>
            {errorMessage}
          </div>
        )}
        
        {/* مفتاح تبديل الأدوار */}
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 border border-gray-100">
          {['patient', 'doctor', 'manager'].map((r) => (
            <button 
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all cursor-pointer ${
                role === r 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {getRoleName(r)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input 
              type="email" 
              placeholder={isRTL ? 'example@domain.com' : 'Email Address'} 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" 
              dir="ltr"
            />
          </div>
          
          <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isRTL ? 'كلمة المرور' : 'Password'}
            </label>
            <input 
              type="password" 
              placeholder={isRTL ? '********' : 'Password'} 
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
            className={`w-full bg-gradient-to-l from-teal-600 to-teal-500 text-white font-bold py-4 rounded-xl shadow-md hover:from-teal-700 hover:to-teal-600 transition-all cursor-pointer mt-4 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading 
              ? (isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...') 
              : (isRTL 
                  ? `تسجيل الدخول كـ ${getRoleName(role)}` 
                  : `Sign In as ${getRoleName(role)}`
                )
            }
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6">
          {isRTL ? 'ليس لديك حساب؟' : "Don't have an account yet?"}{' '}
          <Link to="/signup" className="text-teal-600 font-bold hover:underline cursor-pointer">
            {isRTL ? 'إنشاء حساب' : 'Sign up'}
          </Link>
        </p>

        {/* رابط تجريبي للاختبار (اختياري) */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            {isRTL ? 'للاختبار:' : 'Demo:'} 
            <br />
            patient@test.com / 123456
            <br />
            doctor@test.com / 123456
            <br />
            manager@test.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;