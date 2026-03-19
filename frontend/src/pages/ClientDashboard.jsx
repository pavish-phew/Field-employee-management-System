import React, { useState, useEffect } from 'react';
import { clientApi } from '../services/api';
import { ShieldCheck, Package, Clock, History } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const ClientDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const resp = await clientApi.getClientTasks(user.id);
      setTasks(resp.data);
    } catch (e) {
      console.error('Error fetching client tasks', e);
    }
  };

  return (
    <div className="client-dash tab-pane">
      <header className="pane-header">
        <div className="client-brand">
          <ShieldCheck size={32} className="icon-primary" />
          <div>
            <h1>Client Portal</h1>
            <p className="subtitle">Real-time status of your service requests</p>
          </div>
        </div>
      </header>

      <section className="mt-5">
        <div className="section-header">
          <History size={22} className="icon-primary" />
          <h3>Active & Completed Visits</h3>
        </div>
        
        <div className="tasks-grid">
          {tasks.length > 0 ? tasks.map(t => (
            <TaskCard key={t.id} task={t} />
          )) : (
            <div className="empty-state">
              <Package size={48} className="icon-subtle mb-3" />
              <p>You have no task history yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;
