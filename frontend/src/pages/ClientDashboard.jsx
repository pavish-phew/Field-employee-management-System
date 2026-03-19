import React, { useState, useEffect } from 'react';
import { employeeApi, adminApi } from '../services/api';
import TaskCard from '../components/TaskCard';
import { CheckCircle, XCircle, Briefcase, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await employeeApi.getMyTasks(); // /api/tasks/me handles Client role now
      setTasks(resp.data);
    } catch (e) {
      console.error('Error fetching client tasks', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await adminApi.updateTaskStatus(taskId, status);
      loadData();
    } catch (e) {
      console.error('Status update failed', e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Client Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[80px] -z-10"></div>
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400">
                  <Briefcase size={40} />
               </div>
               <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Client Hub <span className="text-emerald-500 text-4xl">.</span></h2>
                  <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">{user?.name} Corporate Portal</p>
               </div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-3 text-center">
               <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active Requests</p>
               <p className="text-2xl font-mono text-emerald-400 font-bold">{tasks.length}</p>
            </div>
         </div>
      </section>

      <div className="space-y-6">
         <h3 className="text-2xl font-bold flex items-center gap-3"><LayoutDashboard className="text-emerald-400" /> Visit Requests</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
             {tasks.map((task, idx) => (
               <motion.div 
                 key={task.id} 
                 initial={{ opacity: 0, scale: 0.9 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: idx * 0.05 }}
                 className="flex flex-col gap-4"
               >
                 <TaskCard task={task} />
                 
                 {task.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleUpdateStatus(task.id, 'ACCEPTED')}
                         className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/20 text-emerald-500 hover:text-white py-3 rounded-2xl font-bold transition-all"
                       >
                          <CheckCircle size={18} /> Accept
                       </button>
                       <button 
                         onClick={() => handleUpdateStatus(task.id, 'DENIED')}
                         className="flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-600/20 text-rose-500 hover:text-white py-3 rounded-2xl font-bold transition-all"
                       >
                          <XCircle size={18} /> Deny
                       </button>
                    </div>
                 )}
               </motion.div>
             ))}
           </AnimatePresence>
         </div>

         {tasks.length === 0 && (
            <div className="py-24 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
               <Briefcase size={64} strokeWidth={1} />
               <p className="font-bold italic text-lg uppercase tracking-widest">No visit logs recorded yet</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default ClientDashboard;
