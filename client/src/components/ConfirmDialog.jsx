import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="420px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
          background: danger ? '#fee2e2' : '#dbeafe',
          color: danger ? '#dc2626' : '#2563eb',
          padding: '10px',
          borderRadius: '50%',
          display: 'flex'
        }}>
          <AlertTriangle size={24} />
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px' }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
