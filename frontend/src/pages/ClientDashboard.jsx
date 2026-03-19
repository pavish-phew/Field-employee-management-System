import React, { useState, useEffect } from 'react';
import { clientApi } from '../services/api';
import TaskCard from '../components/TaskCard';
import { CheckCircle, XCircle, Briefcase, LayoutDashboard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const ClientDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await clientApi.getMyTasks(); 
      setTasks(resp.data);
    } catch (e) {
      console.error('Error fetching client tasks', e);
      setError("Failed to sync your visit requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await clientApi.updateTaskStatus(taskId, status);
      toast.success(`Request ${status === 'CANCELLED' ? 'denied' : 'updated'}!`);
      loadData();
    } catch (e) {
      console.error('Status update failed', e);
      toast.error("Failed to update task status");
    }
  };

  return (
    <div className="space-y-10 relative">
        <Toaster position="top-right" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter flex items-center gap-4">
              <LayoutDashboard className="text-indigo-500" size={32} />
              Visit Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage and track your field visit requests</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
            <AlertCircle size={20} />
            <p className="font-bold text-sm tracking-wide uppercase">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        <div className="space-y-6">
           <AnimatePresence mode="popLayout">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <TaskCard task={task} onAction={handleUpdateStatus} />
                  
                  {task.status === 'PENDING' && (
                     <div className="mt-4 grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                          className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/20 text-emerald-500 hover:text-white py-3 rounded-2xl font-bold transition-all"
                        >
                           <CheckCircle size={18} /> Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(task.id, 'CANCELLED')}
                          className="flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-600/20 text-rose-500 hover:text-white py-3 rounded-2xl font-bold transition-all"
                        >
                           <XCircle size={18} /> Deny
                        </button>
                     </div>
                  )}
                </motion.div>
              ))}
             </div>
           </AnimatePresence>

           {!loading && tasks.length === 0 && (
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
