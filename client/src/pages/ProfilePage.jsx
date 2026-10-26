import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import Alert from '../components/Alert';
import {
  User,
  Mail,
  Phone,
  Home,
  Shield,
  Key,
  Save,
  CheckCircle,
  Calendar
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (newPassword) {
      if (newPassword.length < 6) {
        setAlert({ type: 'danger', message: 'New password must be at least 6 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setAlert({ type: 'danger', message: 'New password and confirm password do not match.' });
        return;
      }
      if (!currentPassword) {
        setAlert({ type: 'danger', message: 'Current password is required to change password.' });
        return;
      }
    }

    try {
      setLoading(true);
      const res = await authApi.updateProfile({
        name,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      if (res.success) {
        setAlert({ type: 'success', message: 'Profile details updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        refreshUser();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>User Profile & Account Settings</h1>
          <p className="header-subtitle">Manage personal contact information, flat details, and access security.</p>
        </div>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      <div className="dashboard-row">
        {/* Profile Summary Card */}
        <div className="card">
          <div className="card-header">
            <h3>Account Overview</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{user?.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</div>
                <span className={`role-pill role-${user?.role}`} style={{ display: 'inline-block', marginTop: '6px' }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {user?.role === 'resident' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Home size={18} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Flat</div>
                      <div style={{ fontWeight: 600 }}>Flat {user?.flat_number} ({user?.block}, Floor {user?.floor})</div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Email</div>
                  <div style={{ fontWeight: 500 }}>{user?.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact Phone</div>
                  <div style={{ fontWeight: 500 }}>{user?.phone || 'Not provided'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Member Since</div>
                  <div style={{ fontWeight: 500 }}>{user?.created_at?.substring(0, 10)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Form */}
        <div className="card">
          <div className="card-header">
            <h3>Update Profile & Security</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1 555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ margin: '24px 0 16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Change Password</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Leave password fields blank if you do not wish to change your current password.
                </p>

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px' }}
                disabled={loading}
              >
                <Save size={16} />
                <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
