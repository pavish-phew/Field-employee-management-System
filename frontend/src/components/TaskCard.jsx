import React from 'react';
import { Calendar, User, Clock, CheckCircle, Activity, Play } from 'lucide-react';

const TaskCard = ({ task, onAction, actionLabel, actionIcon: ActionIcon }) => {
  const isCompleted = task.status === 'COMPLETED';
  const isInProgress = task.status === 'IN_PROGRESS';

  const getStatusClass = () => {
    switch(task.status) {
      case 'COMPLETED': return 'status-badge status-completed';
      case 'IN_PROGRESS': return 'status-badge status-progress';
      default: return 'status-badge status-pending';
    }
  };

  return (
    <div className={`card glass task-card ${isCompleted ? 'task-completed' : ''}`}>
      <div className="task-header">
        <div>
          <h3 className="task-title">{task.title}</h3>
          <p className="task-desc">{task.description}</p>
        </div>
        <span className={getStatusClass()}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      <div className="task-info-grid">
        <div className="task-info-item">
          <User size={14} className="icon-subtle" />
          <span>Client: <b>{task.clientName}</b></span>
        </div>
        {task.employeeName && (
          <div className="task-info-item">
            <Activity size={14} className="icon-subtle" />
            <span>Employee: <b>{task.employeeName}</b></span>
          </div>
        )}
        <div className="task-info-item">
          <Calendar size={14} className="icon-subtle" />
          <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        {(task.startTime || task.endTime) && (
          <div className="task-info-item">
            <Clock size={14} className="icon-subtle" />
            <span>
              {task.startTime && `Started: ${new Date(task.startTime).toLocaleTimeString()}`}
              {task.endTime && ` - Done: ${new Date(task.endTime).toLocaleTimeString()}`}
            </span>
          </div>
        )}
      </div>

      {onAction && !isCompleted && (
        <button 
          onClick={() => onAction(task.id)} 
          className={`btn btn-block ${isInProgress ? 'btn-success' : 'btn-primary'}`}
        >
          {ActionIcon ? <ActionIcon size={18} /> : (isInProgress ? <CheckCircle size={18} /> : <Play size={18} />)}
          <span>{actionLabel || (isInProgress ? 'Complete Task' : 'Start Task')}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCard;
