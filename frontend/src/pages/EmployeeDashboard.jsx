import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/api';
import { Clock, MapPin, Activity, ListChecks, CheckCircle, Package } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const EmployeeDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [location, setLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(() => {
      if (isWorking) updateLiveLocation();
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [isWorking]);

  const loadTasks = async () => {
    try {
      const resp = await employeeApi.getMyTasks(user.id);
      setTasks(resp.data);
    } catch (e) {
      console.error('Error fetching employee tasks', e);
    }
  };

  const updateLiveLocation = () => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      employeeApi.updateLocation(user.id, latitude, longitude);
      setLastUpdate(new Date().toLocaleTimeString());
    }, err => console.error('GPS error', err));
  };

  const handleClockToggle = () => {
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      if (!isWorking) {
        await employeeApi.clockIn(user.id, latitude, longitude);
        setIsWorking(true);
        setLocation({ lat: latitude, lon: longitude });
      } else {
        await employeeApi.clockOut(user.id, latitude, longitude);
        setIsWorking(false);
        setLocation(null);
      }
    }, err => alert('GPS access required for attendance'));
  };

  const handleTaskAction = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task.status === 'PENDING') {
      await employeeApi.startTask(taskId);
    } else {
      await employeeApi.completeTask(taskId);
    }
    loadTasks();
  };

  return (
    <div className="employee-dash tab-pane">
      <header className="pane-header">
        <h1>Field Agent Dashboard</h1>
        <p className="subtitle">Execute field operations efficiently</p>
      </header>
      
      <div className="dashboard-grid">
        <section className="card card-filled attendance-section">
          <div className="section-header">
            <Clock size={22} className="icon-primary" />
            <h3>Attendance Control</h3>
          </div>
          
          <div className={`status-display card glass ${isWorking ? 'status-active' : 'status-inactive'}`}>
            <div className="status-indicator"></div>
            <span>
              {isWorking ? 'Currently On Shift' : 'Off Shift • Clock In to Start'}
            </span>
          </div>

          <button 
            onClick={handleClockToggle} 
            className={`btn btn-block btn-lg ${isWorking ? 'btn-danger' : 'btn-primary'}`}
          >
            <Activity size={20} />
            <span>{isWorking ? 'Stop Work Shift' : 'Start Work Shift'}</span>
          </button>

          {isWorking && (
            <div className="location-pill glass mt-3">
              <MapPin size={14} className="icon-primary" />
              <span>Auto-Tracking Enabled • Last update: {lastUpdate || 'Waiting...'}</span>
            </div>
          )}
        </section>

        <section className="span-2">
          <div className="section-header">
            <ListChecks size={22} className="icon-primary" />
            <h3>My Field Assignments</h3>
          </div>
          <div className="tasks-grid">
            {tasks.length > 0 ? tasks.map(t => (
              <TaskCard 
                key={t.id} 
                task={t} 
                onAction={handleTaskAction}
                actionLabel={t.status === 'PENDING' ? 'Start Task' : 'Finalize Task'}
              />
            )) : (
              <div className="empty-state">
                <Package size={48} className="icon-subtle mb-3" />
                <p>No tasks assigned to you right now.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
