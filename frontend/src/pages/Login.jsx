import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { LogIn, Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        role: response.data.role,
        name: response.data.name
      }));
      
      const role = response.data.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'EMPLOYEE') navigate('/employee');
      else if (role === 'CLIENT') navigate('/client');
      
      window.location.reload(); // Refresh to update navigation state
    } catch (err) {
      console.error('Login error', err);
      setError('Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-600/5 blur-[100px] rounded-full -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-10 w-24 h-24 bg-indigo-500/10 blur-xl rounded-full"></div>
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
           <div className="w-20 h-20 bg-indigo-600/20 border-2 border-indigo-500/30 rounded-3xl flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck size={44} strokeWidth={1.5} />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Access Hub<span className="text-indigo-500 text-4xl">.</span></h1>
              <p className="text-slate-500 font-medium text-sm max-w-[240px] mt-2">Sign in to the Field Employee Management System</p>
           </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm flex items-center gap-3 italic"
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Corporate ID</label>
            <div className="relative group">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
               <input 
                 type="email" 
                 placeholder="name@fems.com" 
                 className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
               />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Access Protocol</label>
             <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-3xl shadow-lg shadow-indigo-950/20 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden group relative"
          >
             {loading ? <Loader2 size={24} className="animate-spin" /> : (
               <>
                 <span className="text-xl">Authorize Access</span>
                 <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
               </>
             )}
          </button>
        </form>

        <div className="text-center mt-10">
           <p className="text-xs font-bold text-slate-700 uppercase tracking-widest italic opacity-50">Secure Connection Established 256-bit AES</p>
        </div>
      </motion.div>

      <div className="mt-8 flex gap-8 text-xs font-bold text-slate-600 uppercase tracking-widest">
         <span className="hover:text-slate-400 cursor-help transition-colors">Privacy Policy</span>
         <span className="hover:text-slate-400 cursor-help transition-colors">Security Audit</span>
         <span className="hover:text-slate-400 cursor-help transition-colors">&copy; 2026 FEMS Cloud</span>
      </div>
    </div>
  );
};

export default Login;
