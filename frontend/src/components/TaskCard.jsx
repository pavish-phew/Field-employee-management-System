import React from 'react';
import { 
  Clock, MapPin, Navigation, CheckCircle2, 
  PlayCircle, AlertCircle, Calendar, XCircle
} from 'lucide-react';

const TaskCard = ({ task, onAction, distance }) => {
  const statusStyles = {
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse",
    COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const isTooFar = distance !== null && distance > 500;

  const getStatusButton = () => {
    if (task.status === 'PENDING') {
      return (
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onAction(task.id, 'IN_PROGRESS')}
            disabled={isTooFar}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
              isTooFar 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
            }`}
          >
            <PlayCircle size={18} /> Start Task
          </button>
          {distance !== null && (
            <p className={`text-[10px] text-center font-bold uppercase tracking-wider ${isTooFar ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isTooFar ? `Too far: ${Math.round(distance)}m away` : `In range: ${Math.round(distance)}m away`}
            </p>
          )}
        </div>
      );
    }
    if (task.status === 'IN_PROGRESS') {
      return (
        <button 
          onClick={() => onAction(task.id, 'COMPLETED')}
          className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 shadow-rose-900/40"
        >
          <XCircle size={18} /> Stop Task
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group relative overflow-hidden flex flex-col gap-5 shadow-lg h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${statusStyles[task.status] || 'bg-slate-700 text-slate-400'}`}>
              {task.status}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
               <Calendar size={10} /> {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h4 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{task.title}</h4>
        </div>
        <p className="text-[10px] font-mono text-slate-700">#{task.id}</p>
      </div>

      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic border-l-2 border-slate-800 pl-4">"{task.description}"</p>

      <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-800/50">
         <div className="p-3 bg-slate-950/50 rounded-2xl">
            <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">Destination</p>
            <p className="text-xs font-semibold text-slate-300 truncate">{task.clientName || 'HQ'}</p>
         </div>
         <div className="p-3 bg-slate-950/50 rounded-2xl">
            <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">Field Agent</p>
            <p className="text-xs font-semibold text-slate-300 truncate">{task.employeeName || 'Pending'}</p>
         </div>
      </div>

      {(task.startTime || task.endTime) && (
        <div className="bg-slate-950/30 p-3 rounded-2xl border border-dashed border-slate-800 space-y-2">
           {task.startTime && (
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold">Arrival Time</span>
                <span className="text-[10px] font-mono text-indigo-400">{new Date(task.startTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
             </div>
           )}
           {task.endTime && (
             <div className="flex items-center justify-between border-t border-slate-800/50 pt-2">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold">Final Departure</span>
                <span className="text-[10px] font-mono text-emerald-400">{new Date(task.endTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
             </div>
           )}
        </div>
      )}

      {onAction && task.status !== 'COMPLETED' && (
        <div className="mt-auto">
          {getStatusButton()}
        </div>
      )}

      {/* Decorative Gradient Overlay */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"></div>
    </div>
  );
};

export default TaskCard;
