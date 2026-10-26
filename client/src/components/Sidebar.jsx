import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  UserPlus,
  History,
  CreditCard,
  MessageSquareWarning,
  User,
  ShieldCheck,
  Home
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Home size={20} />
          </div>
          <div>
            <div className="sidebar-title">ApartmentHub</div>
            <div className="sidebar-subtitle">Visitor & Maintenance</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Overview</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {/* Admin Specific Links */}
          {role === 'admin' && (
            <>
              <div className="nav-section-title">Administration</div>
              <NavLink
                to="/flats-residents"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Building size={18} />
                <span>Flats & Residents</span>
              </NavLink>
            </>
          )}

          {/* Visitor Management Links (Admin and Security) */}
          {(role === 'admin' || role === 'security') && (
            <>
              <div className="nav-section-title">Visitor Gate</div>
              <NavLink
                to="/visitor-register"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <UserPlus size={18} />
                <span>Register Visitor</span>
              </NavLink>
              <NavLink
                to="/visitor-history"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <History size={18} />
                <span>Visitor History</span>
              </NavLink>
            </>
          )}

          {/* Resident Visitor Link */}
          {role === 'resident' && (
            <>
              <div className="nav-section-title">Visitors</div>
              <NavLink
                to="/visitor-history"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <History size={18} />
                <span>My Flat Visitors</span>
              </NavLink>
            </>
          )}

          {/* Maintenance (Admin & Resident) */}
          {(role === 'admin' || role === 'resident') && (
            <>
              <div className="nav-section-title">Finance</div>
              <NavLink
                to="/maintenance"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <CreditCard size={18} />
                <span>Maintenance Bills</span>
              </NavLink>
            </>
          )}

          {/* Complaints (Admin & Resident) */}
          {(role === 'admin' || role === 'resident') && (
            <>
              <div className="nav-section-title">Support</div>
              <NavLink
                to="/complaints"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <MessageSquareWarning size={18} />
                <span>{role === 'admin' ? 'Manage Complaints' : 'My Complaints'}</span>
              </NavLink>
            </>
          )}

          <div className="nav-section-title">Account</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <User size={18} />
            <span>Profile & Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge-sidebar">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                {user.role} {user.flat_number ? `• Flat ${user.flat_number}` : ''}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
