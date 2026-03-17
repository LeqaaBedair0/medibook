import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [role, setRole] = useState('patient');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a mock name from the email (e.g., "leqaa@test.com" becomes "Leqaa")
    let extractedName = email.split('@')[0];
    extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    
    const formattedName = role === 'doctor' ? `Dr. ${extractedName}` : extractedName;

    // Build the dynamic profile
    const userProfile = {
      role: role,
      name: formattedName,
      email: email,
      specialty: role === 'doctor' ? 'Specialist' : 'Patient',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=0d9488&color=fff&rounded=true&bold=true`
    };

    // Send data to App.jsx
    onLogin(userProfile); 
    
    // Navigate to correct portal
    if (role === 'manager') {
      navigate('/manager-dashboard');
    } else if (role === 'doctor') {
      navigate('/dashboard');
    } else {
      navigate('/patient-dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-teal-50 max-w-md w-full text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back 👋</h2>
        <p className="text-slate-500 mb-8">Please enter your details to sign in.</p>
        
        {/* Role Toggle Switch */}
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
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 transition-colors" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 outline-none focus:border-teal-400 transition-colors" 
          />
          
          <button type="submit" className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-teal-400 transition-all cursor-pointer mt-2">
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6">
          Don't have an account yet? <Link to="/signup" className="text-teal-600 font-bold hover:underline cursor-pointer">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;