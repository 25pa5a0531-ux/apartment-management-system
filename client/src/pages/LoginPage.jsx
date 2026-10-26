import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, User, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import Alert from '../components/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={28} />
          </div>
          <h1 className="login-title">Apartment Management</h1>
          <p className="login-subtitle">Sign in to access your apartment dashboard</p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. admin@apartment.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="demo-logins-box">
          <div className="demo-title">Quick Demo Login (One-Click)</div>
          <div className="demo-btn-group">
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickDemo('admin@apartment.com', 'admin123')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickDemo('security@apartment.com', 'security123')}
            >
              🛡️ Security
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickDemo('john@resident.com', 'resident123')}
            >
              🏠 Resident 101
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            Note: Demo accounts are for testing. Passwords must be changed for production deployment.
          </div>
        </div>
      </div>
    </div>
  );
}
