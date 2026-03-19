import React from 'react';
import { 
  Clock, MapPin, Navigation, CheckCircle2, 
  PlayCircle, AlertCircle, Calendar 
} from 'lucide-react';

const TaskCard = ({ task, onAction }) => {
  const statusStyles = {
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    ACCEPTED: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    DENIED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse",
    COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group relative overflow-hidden flex flex-col gap-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${statusStyles[task.status]}`}>
              {task.status}
            </span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
               <Calendar size={10} /> {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h4 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{task.title}</h4>
        </div>
      </div>

      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic">"{task.description}"</p>

      <div className="grid grid-cols-1 gap-3 py-4 border-y border-slate-800/50">
         <div className="flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Navigation size={14} /></div>
            <div>
               <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">Destination</p>
               <p className="font-semibold text-slate-300">{task.clientName}</p>
            </div>
         </div>
         <div className="flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Navigation size={14} /></div>
            <div>
               <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">Assigned To</p>
               <p className="font-semibold text-slate-300">{task.employeeName}</p>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            {task.startTime && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                 <Clock size={12} className="text-indigo-500" />
                 <span>{new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )}
         </div>

         {onAction && (
           <button 
             onClick={() => onAction(task.id)}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
                task.status === 'PENDING' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
             }`}
           >
              {task.status === 'PENDING' ? <PlayCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{task.status === 'PENDING' ? 'Start Task' : 'Complete'}</span>
           </button>
         )}
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"></div>
    </div>
  );
};

export default TaskCard;
