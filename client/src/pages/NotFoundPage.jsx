import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 20px',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: '#fee2e2',
        color: '#dc2626',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <AlertCircle size={32} />
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <Home size={16} /> Return to Dashboard
      </Link>
    </div>
  );
}
