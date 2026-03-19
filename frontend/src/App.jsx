import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Navbar from './components/Navbar';
import './index.css';

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const redirectPath = user.role === 'ADMIN' ? '/admin' : user.role === 'EMPLOYEE' ? '/employee' : '/client';
      return <Navigate to={redirectPath} replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app-container glass-bg">
        {user && <Navbar user={user} />}
        <main className="main-content container mt-4">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/employee/*" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <EmployeeDashboard user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/client/*" element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientDashboard user={user} />
              </ProtectedRoute>
            } />

            <Route path="/" element={
              user ? (
                <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'EMPLOYEE' ? '/employee' : '/client'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
