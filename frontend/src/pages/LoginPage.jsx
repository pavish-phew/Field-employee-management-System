import React, { useState } from 'react';
import { authApi } from '../services/api';
import { LogIn } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authApi.login(username);
      onLogin(response.data);
    } catch (err) {
      setError('Invalid username. Try "admin"');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card glass login-card">
        <div className="login-header">
          <LogIn size={32} className="icon-primary" />
          <h2>FEMS Portal</h2>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Enter your username"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block">
            <span>Login to Dashboard</span>
          </button>
        </form>
        
        <div className="login-footer">
          <p>Tip: Use <b>admin</b> to access administrator panel.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
