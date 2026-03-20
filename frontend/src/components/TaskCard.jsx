import { 
  Clock, MapPin, Navigation, CheckCircle2, 
  PlayCircle, AlertCircle, Calendar, XCircle, ArrowRight
} from 'lucide-react';
import LocationLabel from './LocationLabel';

const TaskCard = ({ task, onAction, distance, gpsAvailable }) => {
  const statusStyles = {
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const statusWords = {
    PENDING: "Queued",
    IN_PROGRESS: "Traveling",
    COMPLETED: "Finished",
    CANCELLED: "Voided"
  };

  const isTooFar = distance !== null && distance > 30000; // 30km range (meters)

  const getStatusButton = () => {
    if (task.status === 'PENDING') {
      const distKm = distance !== null ? (distance / 1000).toFixed(2) : null;
      const isDisabled = isTooFar || !gpsAvailable;
      
      return (
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onAction(task.id, 'IN_PROGRESS')}
            disabled={isDisabled}
            className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl active:scale-95 ${
              isDisabled 
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
            }`}
          >
            <PlayCircle size={18} /> 
            {!gpsAvailable ? 'Awaiting GPS...' : isTooFar ? 'Too Far' : 'Accept'}
          </button>
          {distance !== null && (
            <p className={`text-[10px] text-center font-bold uppercase tracking-[0.2em] ${isTooFar || !gpsAvailable ? 'text-rose-500' : 'text-emerald-500'}`}>
              {!gpsAvailable ? '🛰️ Signal Searching...' : isTooFar ? `${distKm} km ❌ Outside 30km Range` : `${distKm} km ✅ Within Range`}
            </p>
          )}
        </div>
      );
    }
    if (task.status === 'IN_PROGRESS') {
      return (
        <button 
          onClick={() => onAction(task.id, 'COMPLETED')}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white px-8 py-4 rounded-2xl font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl active:scale-95"
        >
          <CheckCircle2 size={18} /> Succeed
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-[2.5rem] p-8 hover:border-indigo-500/40 transition-all group relative overflow-hidden flex flex-col gap-6 shadow-2xl h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-[0.2em] border ${statusStyles[task.status] || 'bg-slate-700 text-slate-400'}`}>
              {statusWords[task.status] || task.status}
            </span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
               <Calendar size={12} className="opacity-50" /> {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h4 className="text-2xl font-extrabold text-white leading-tight group-hover:text-indigo-400 transition-colors tracking-tighter uppercase">{task.title}</h4>
        </div>
        <p className="text-[10px] font-mono text-slate-800">NAV-{task.id?.toString().padStart(4, '0')}</p>
      </div>

      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic border-l-2 border-indigo-500/10 pl-6 border-slate-800/50">"{task.description}"</p>

      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/50">
         <div className="p-4 bg-slate-950/40 rounded-[1.5rem] border border-slate-800/30">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Site</p>
            <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
               {task.clientName || 'HQ'}
            </p>
            {task.clientLatitude && (
               <div className="text-[9px] text-slate-500 mt-2 font-medium opacity-70">
                  <LocationLabel lat={task.clientLatitude} lon={task.clientLongitude} />
               </div>
            )}
         </div>
         <div className="p-4 bg-slate-950/40 rounded-[1.5rem] border border-slate-800/30">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Agent</p>
            <p className="text-xs font-bold text-slate-200 truncate">{task.employeeName || 'Unassigned'}</p>
         </div>
      </div>

      {(task.startTime || task.endTime) && (
        <div className="bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-800/50 space-y-2">
           {task.startTime && (
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Arrival</span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold">{new Date(task.startTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
           )}
           {task.endTime && (
             <div className="flex items-center justify-between pt-2 border-t border-slate-800/30">
                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Closed</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{new Date(task.endTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
           )}
        </div>
      )}

      {onAction && task.status !== 'COMPLETED' && (
        <div className="mt-auto pt-2">
          {getStatusButton()}
        </div>
      )}

      {/* Gloss Effect Accent */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
         <Navigation size={60} className="text-indigo-500" />
      </div>
    </div>
  );
};

export default TaskCard;
