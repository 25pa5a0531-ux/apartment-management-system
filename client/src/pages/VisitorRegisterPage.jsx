import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitorsApi, flatsApi } from '../services/api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import {
  UserPlus,
  User,
  Phone,
  Building,
  Car,
  FileText,
  Clock,
  CheckCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function VisitorRegisterPage() {
  const navigate = useNavigate();
  const [flats, setFlats] = useState([]);
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    flat_id: '',
    purpose: 'Guest / Personal',
    vehicle_number: ''
  });

  const loadData = async () => {
    try {
      const [flatsRes, insideRes] = await Promise.all([
        flatsApi.getAll(),
        visitorsApi.getInside()
      ]);
      if (flatsRes.success) setFlats(flatsRes.flats);
      if (insideRes.success) setInsideVisitors(insideRes.visitors);
      if (flatsRes.flats.length > 0 && !form.flat_id) {
        setForm(prev => ({ ...prev, flat_id: flatsRes.flats[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.flat_id) {
      setAlert({ type: 'danger', message: 'Name, phone, and flat number are required.' });
      return;
    }

    try {
      setLoading(true);
      const res = await visitorsApi.register(form);
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Visitor '${form.name}' successfully checked in! Entry timestamp recorded.`
        });
        // Reset form
        setForm({
          name: '',
          phone: '',
          flat_id: flats[0]?.id || '',
          purpose: 'Guest / Personal',
          vehicle_number: ''
        });
        loadData(); // refresh inside list
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to check in visitor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (visitorId, visitorName) => {
    try {
      const res = await visitorsApi.checkout(visitorId);
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Visitor '${visitorName}' marked as exited.`
        });
        loadData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to checkout visitor.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>Security Gate: Register Visitor</h1>
          <p className="header-subtitle">Record incoming visitors, assign destination flats, and log vehicle entries.</p>
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
        {/* Visitor Registration Form */}
        <div className="card">
          <div className="card-header">
            <h3><UserPlus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> New Visitor Entry Form</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Visitor Full Name <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Michael Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Destination Flat <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={form.flat_id}
                    onChange={(e) => setForm({ ...form, flat_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Destination Flat --</option>
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.flat_number} ({f.block}, Floor {f.floor}) {f.resident_name ? `• ${f.resident_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Purpose of Visit <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    required
                  >
                    <option value="Guest / Personal">Guest / Personal Visit</option>
                    <option value="Delivery">Package Delivery (Amazon, Courier)</option>
                    <option value="Service / Maintenance">Service / Plumber / Electrician</option>
                    <option value="Cab / Taxi">Cab / Taxi Pickup</option>
                    <option value="Inspection / Official">Inspection / Official</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. KA-05-EV-1234"
                    value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                  />
                  <span className="form-hint">Leave blank if arriving by foot or public transit.</span>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  disabled={loading}
                >
                  <UserPlus size={18} />
                  <span>{loading ? 'Recording Entry...' : 'Check In Visitor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Currently Inside List */}
        <div className="card">
          <div className="card-header">
            <h3>Currently Inside Complex ({insideVisitors.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click checkout on exit</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Flat</th>
                  <th>Entry Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {insideVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      No visitors are currently inside the complex.
                    </td>
                  </tr>
                ) : (
                  insideVisitors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {v.phone} {v.vehicle_number ? `• ${v.vehicle_number}` : ''}
                        </div>
                      </td>
                      <td>
                        <strong>Flat {v.flat_number}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.purpose}</div>
                      </td>
                      <td>{v.entry_time?.substring(11, 16)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCheckout(v.id, v.name)}
                          title="Record Departure"
                        >
                          <LogOut size={12} /> Exit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
