import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle size={18} />,
    danger: <AlertCircle size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />
  };

  const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;

  return (
    <div className={`alert ${alertClass}`}>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {icons[type] || icons.info}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
