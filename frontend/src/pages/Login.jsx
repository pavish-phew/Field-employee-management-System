import React, { useState } from 'react';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Force reload to update App.jsx state
      window.location.href = '/';
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.message || "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dark:bg-slate-900 transition-colors">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="bg-blue-600 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white rounded-full blur-3xl opacity-20"></div>
            
            <ShieldCheck className="mx-auto text-white w-16 h-16 mb-6 drop-shadow-lg" />
            <h1 className="text-3xl font-black text-white tracking-tight">FEMS PORTAL</h1>
            <p className="text-white/80 font-medium mt-2">Field Employee Management System</p>
          </div>

          <div className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 font-medium text-sm">Please enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={20} /> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Secure Access Provider</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
