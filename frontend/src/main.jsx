// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';

// ✅ تصحيح المسار بناءً على مكان الملف الفعلي في مشروعك
import './locales/i18n/config.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* الـ AuthProvider يجب أن يغلف الروتر لتتمكن من حماية المسارات */}
    <AuthProvider>
      <BrowserRouter>
        <App />
        
        {/* إعدادات التوستر (Notifications) */}
        <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#333',
              color: '#fff',
              fontFamily: 'Tajawal, Cairo, sans-serif', // إضافة Cairo كاحتياطي
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);