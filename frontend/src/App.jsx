import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Layout from './components/Layout';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  const userRole = user.role?.toUpperCase().replace('ROLE_', '');
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const redirectPath = userRole === 'ADMIN' ? '/admin' : userRole === 'EMPLOYEE' ? '/employee' : '/client';
    return <Navigate to={redirectPath} replace />;
  }

  return <Layout user={{...user, role: userRole}}>{children}</Layout>;
};

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!saved || !token) return null;
      const parsed = JSON.parse(saved);
      return { ...parsed, role: parsed.role?.toUpperCase().replace('ROLE_', '') };
    } catch {
      return null;
    }
  });

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login />
        } />
        
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
    </Router>
  );
};

export default App;
