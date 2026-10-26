import React from 'react';

export default function Badge({ status, text }) {
  if (!status) return null;

  const normalized = status.toString().toLowerCase().replace(/\s+/g, '');

  return (
    <span className={`badge badge-${normalized}`}>
      <span className="badge-dot" />
      {text || status}
    </span>
  );
}
