import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 1. Change prop to onSignup
function Signup({ onSignup }) {
  const [role, setRole] = useState('patient');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinic, setClinic] = useState(''); // 2. New state for Clinic Name
  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedName = role === 'doctor' && !name.toLowerCase().startsWith('dr.') 
      ? `Dr. ${name}` 
      : name;

    const userProfile = {
      role: role,
      name: formattedName,
      email: email,
      specialty: role === 'doctor' ? specialty : 'Patient',
      clinic: role === 'doctor' ? clinic : null, // 3. Include clinic in profile
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=0d9488&color=fff&rounded=true&bold=true`
    };

    // 4. Call onSignup instead of onLogin
    onSignup(userProfile);

    if (role === 'doctor') {
      navigate('/dashboard');
    } else if (role === 'manager') {
      navigate('/manager-dashboard');
    } else {
      navigate('/patient-dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-teal-50 max-w-md w-full">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Join MediBook ✨</h2>
          <p className="text-slate-500">Create your account to get started.</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 border border-gray-100">
          {['patient', 'doctor', 'manager'].map((r) => (
            <button 
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all cursor-pointer ${
                role === r ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" />
          <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 focus:bg-white transition-all" />
          
          {/* 5. Added Clinic Input Field */}
          {role === 'doctor' && (
            <div className="animate-fade-in-up space-y-4">
              <input type="text" placeholder="Specialty (e.g. Neurologist)" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 outline-none focus:border-teal-500 focus:bg-white transition-all text-teal-800" />
              <input type="text" placeholder="Clinic / Hospital Name" required value={clinic} onChange={(e) => setClinic(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 outline-none focus:border-teal-500 focus:bg-white transition-all text-teal-800" />
            </div>
          )}

          <button type="submit" className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-teal-400 hover:shadow-lg transition-all cursor-pointer mt-4">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline cursor-pointer">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;