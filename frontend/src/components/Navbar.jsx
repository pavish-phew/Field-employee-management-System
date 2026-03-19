import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar glass">
      <div className="nav-brand">FEMS Portal</div>
      <div className="nav-actions">
        {user && (
          <>
            <div className="user-pill glass">
              <UserIcon size={18} />
              <span>{user.name} ({user.role})</span>
            </div>
            <button onClick={handleLogout} className="btn btn-danger-ghost">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
