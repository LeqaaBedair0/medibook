import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-white border-t border-teal-50 mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="text-2xl font-bold text-teal-600 mb-4 inline-block">MediBook 🩺</Link>
          <p className="text-slate-500 max-w-sm leading-relaxed mt-2">
            Making healthcare accessible, colorful, and easy. Book your next appointment with the best specialists in seconds.
          </p>
          
          {/* Social Icons (Dummy visual placeholders) */}
          <div className="flex gap-4 mt-6">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-500 hover:text-white transition-colors cursor-pointer">📱</div>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-500 hover:text-white transition-colors cursor-pointer">📸</div>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-500 hover:text-white transition-colors cursor-pointer">💼</div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div>
          <h4 className="font-bold text-slate-800 mb-6">Explore</h4>
          <ul className="space-y-3">
            <li><Link to="/clinics" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">Partner Clinics</Link></li>
            <li><Link to="/doctors" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">Our Specialists</Link></li>
            <li><Link to="/patient-dashboard" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">Patient Portal</Link></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div>
          <h4 className="font-bold text-slate-800 mb-6">Say Hello</h4>
          <ul className="space-y-3 text-slate-500 font-medium">
            <li className="flex items-center gap-2"><span>✉️</span> support@medibook.com</li>
            <li className="flex items-center gap-2"><span>📞</span> +20 123 456 7890</li>
            <li className="flex items-center gap-2"><span>📍</span> Cairo, Egypt</li>
          </ul>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-teal-50 text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} MediBook. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm font-bold text-slate-400">
          <span className="hover:text-teal-500 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-teal-500 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;