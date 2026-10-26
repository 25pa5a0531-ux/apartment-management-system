import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  MessageCircle,
  Calendar,
  User,
  Building
} from 'lucide-react';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Lift', 'Security', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Submitted', 'In Progress', 'Resolved'];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    description: ''
  });

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: 'In Progress',
    admin_response: ''
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await complaintsApi.getAll(params);
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load complaints.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaint.title.trim() || !newComplaint.description.trim()) {
      setAlert({ type: 'danger', message: 'Title and description are required.' });
      return;
    }

    try {
      const res = await complaintsApi.create(newComplaint);
      if (res.success) {
        setAlert({
          type: 'success',
          message: 'Maintenance complaint submitted successfully! Management has been notified.'
        });
        setIsSubmitModalOpen(false);
        setNewComplaint({
          title: '',
          category: 'Plumbing',
          priority: 'Medium',
          description: ''
        });
        fetchComplaints();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to submit complaint.' });
    }
  };

  const handleOpenUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status,
      admin_response: complaint.admin_response || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const res = await complaintsApi.updateStatus(selectedComplaint.id, updateForm);
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message || 'Complaint status updated successfully.'
        });
        setIsUpdateModalOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update complaint status.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>{isAdmin ? 'Complaint Management Desk' : 'Maintenance Complaints & Helpdesk'}</h1>
          <p className="header-subtitle">
            {isAdmin
              ? 'Review resident maintenance issues, assign service technicians, and log responses.'
              : `Submit repair requests and track manager resolution notes for Flat ${user?.flat_number}.`}
          </p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsSubmitModalOpen(true)}>
            <Plus size={16} /> Submit New Complaint
          </button>
        )}
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Filters:</span>

            <select
              className="form-control filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              className="form-control filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="form-control filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {(statusFilter || categoryFilter || priorityFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStatusFilter('');
                  setCategoryFilter('');
                  setPriorityFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complaints List Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Details</th>
                <th>Flat / Resident</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Admin Response</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="table-empty">
                    {loading ? 'Loading tickets...' : 'No maintenance complaints found.'}
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#CMP-{c.id}</span>
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{c.title}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                        {c.description}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>
                        Reported on {c.created_at?.substring(0, 16)}
                      </div>
                    </td>
                    <td>
                      <strong>Flat {c.flat_number}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {c.resident_name}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-inside" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                        {c.category}
                      </span>
                    </td>
                    <td>
                      <Badge status={c.priority} />
                    </td>
                    <td>
                      <Badge status={c.status} />
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      {c.admin_response ? (
                        <div style={{
                          background: c.status === 'Resolved' ? 'var(--success-bg)' : '#f0f9ff',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${c.status === 'Resolved' ? 'var(--success-border)' : '#bae6fd'}`,
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 600, color: c.status === 'Resolved' ? 'var(--success-text)' : '#0369a1', marginBottom: '2px' }}>
                            {c.status === 'Resolved' ? '✔ Resolution Note:' : '💬 Manager Note:'}
                          </div>
                          <div style={{ color: 'var(--text-main)' }}>{c.admin_response}</div>
                          {c.resolved_at && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Resolved at: {c.resolved_at?.substring(0, 16)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '12px' }}>
                          Awaiting response
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenUpdateModal(c)}
                        >
                          Update Status
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT COMPLAINT MODAL (RESIDENTS) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Maintenance Complaint"
      >
        <form onSubmit={handleSubmitComplaint}>
          <div className="form-group">
            <label className="form-label">
              Complaint Subject / Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Water leak under bathroom sink"
              value={newComplaint.title}
              onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency / Priority</label>
              <select
                className="form-control"
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p} Priority</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Detailed Description <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              placeholder="Describe the issue, location inside the flat, and any urgency details..."
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={15} /> Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE STATUS MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={selectedComplaint ? `Update Complaint #${selectedComplaint.id}: ${selectedComplaint.title}` : 'Update Complaint'}
      >
        <form onSubmit={handleSaveUpdate}>
          <div className="form-group">
            <label className="form-label">Update Ticket Status <span className="required">*</span></label>
            <select
              className="form-control"
              value={updateForm.status}
              onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              required
            >
              <option value="Submitted">Submitted (Under Review)</option>
              <option value="In Progress">In Progress (Assigned / In Repair)</option>
              <option value="Resolved">Resolved (Work Completed)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Manager Response / Resolution Note
            </label>
            <textarea
              className="form-control"
              placeholder="Enter updates for the resident, technician assignment, scheduled time, or resolution details..."
              value={updateForm.admin_response}
              onChange={(e) => setUpdateForm({ ...updateForm, admin_response: e.target.value })}
            />
            <span className="form-hint">
              This response will be visible immediately to the resident on their dashboard.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Response & Update Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
