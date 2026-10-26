import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Shield, User, Home } from 'lucide-react';

export default function Navbar({ onToggleSidebar, title = 'Apartment Management' }) {
  const { user, logout } = useAuth();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>
        <span className="page-title">{title}</span>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <span className={`role-pill role-${user.role}`}>
              {user.role === 'admin' ? 'Manager' : user.role === 'security' ? 'Security' : 'Resident'}
              {user.flat_number ? ` • ${user.flat_number}` : ''}
            </span>

            <button className="btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
