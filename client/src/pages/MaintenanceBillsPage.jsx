import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenanceApi, flatsApi } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import {
  CreditCard,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  Info
} from 'lucide-react';

export default function MaintenanceBillsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [flatFilter, setFlatFilter] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    flat_id: '',
    billing_month: 'November 2026',
    amount: '3500',
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10)
  });

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().substring(0, 10),
    payment_remarks: 'Manual payment recorded by Admin'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (flatFilter) params.flat_id = flatFilter;

      const [billsRes, summaryRes, flatsRes] = await Promise.all([
        maintenanceApi.getBills(params),
        maintenanceApi.getSummary(),
        isAdmin ? flatsApi.getAll() : Promise.resolve({ success: true, flats: [] })
      ]);

      if (billsRes.success) setBills(billsRes.bills);
      if (summaryRes.success) setSummary(summaryRes.summary);
      if (flatsRes.success && flatsRes.flats) {
        setFlats(flatsRes.flats);
        if (flatsRes.flats.length > 0 && !billForm.flat_id) {
          setBillForm(prev => ({ ...prev, flat_id: flatsRes.flats[0].id }));
        }
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load maintenance data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, flatFilter]);

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    try {
      const res = await maintenanceApi.createBill(billForm);
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message || 'Maintenance bill generated successfully.'
        });
        setIsGenerateModalOpen(false);
        loadData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to create bill.' });
    }
  };

  const handleOpenPayModal = (bill) => {
    setSelectedBill(bill);
    setPaymentForm({
      payment_date: new Date().toISOString().substring(0, 10),
      payment_remarks: `Recorded by Admin (Receipt Ref: #${bill.id})`
    });
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const res = await maintenanceApi.recordPayment(selectedBill.id, paymentForm);
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message || 'Payment recorded successfully.'
        });
        setIsPayModalOpen(false);
        loadData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to record payment.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>Maintenance Management & Bills</h1>
          <p className="header-subtitle">
            {isAdmin
              ? 'Generate monthly maintenance dues, manage flat payment records, and monitor arrears.'
              : `View maintenance charges, payment due dates, and receipts for Flat ${user?.flat_number}.`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsGenerateModalOpen(true)}>
            <Plus size={16} /> Generate Monthly Bill
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

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Total Invoiced</span>
              <span className="stat-value">₹{Number(summary.totalBilled).toLocaleString()}</span>
              <span className="stat-subtext">Cumulative billing</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-blue">
              <CreditCard size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Total Paid</span>
              <span className="stat-value" style={{ color: '#059669' }}>
                ₹{Number(summary.totalPaid).toLocaleString()}
              </span>
              <span className="stat-subtext">Successfully collected</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-green">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Pending Dues</span>
              <span className="stat-value" style={{ color: '#d97706' }}>
                ₹{Number(summary.totalPending).toLocaleString()}
              </span>
              <span className="stat-subtext">Awaiting payment</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-amber">
              <Clock size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Overdue Amount</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>
                ₹{Number(summary.totalOverdue).toLocaleString()}
              </span>
              <span className="stat-subtext">Past due date</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-rose">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Real Gateway Notice */}
      <div className="alert alert-info" style={{ marginBottom: '20px' }}>
        <Info size={18} />
        <div>
          <strong>Payment Recording System:</strong> This system records maintenance payments made through cash, bank transfer, or cheque. No online payment gateways are integrated.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Filter By:</span>

            <select
              className="form-control filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>

            {isAdmin && (
              <select
                className="form-control filter-select"
                value={flatFilter}
                onChange={(e) => setFlatFilter(e.target.value)}
              >
                <option value="">All Flats</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Flat {f.flat_number} ({f.block})
                  </option>
                ))}
              </select>
            )}

            {(statusFilter || flatFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStatusFilter('');
                  setFlatFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Bills Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Flat</th>
                <th>Billing Month</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Payment Record</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="table-empty">
                    {loading ? 'Loading bills...' : 'No maintenance bills found.'}
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#INV-{b.id}</span>
                    </td>
                    <td>
                      <strong>Flat {b.flat_number}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {b.block} {b.resident_name ? `• ${b.resident_name}` : ''}
                      </div>
                    </td>
                    <td>
                      <strong>{b.billing_month}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '15px', fontWeight: 700 }}>
                        ₹{Number(b.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div>{b.due_date}</div>
                      {b.status === 'Overdue' && (
                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                          Past Due Date!
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge status={b.status} />
                    </td>
                    <td>
                      {b.status === 'Paid' ? (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                            Paid on {b.payment_date}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {b.payment_remarks || 'Recorded'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Unpaid</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {b.status !== 'Paid' ? (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleOpenPayModal(b)}
                          >
                            <CheckCircle size={13} /> Record Payment
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            Receipt Saved
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE BILL MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Monthly Maintenance Bill"
      >
        <form onSubmit={handleGenerateBill}>
          <div className="form-group">
            <label className="form-label">
              Select Flat <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={billForm.flat_id}
              onChange={(e) => setBillForm({ ...billForm, flat_id: e.target.value })}
              required
            >
              <option value="">-- Choose Flat --</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  Flat {f.flat_number} ({f.block}) {f.resident_name ? `- ${f.resident_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Billing Month / Cycle <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. November 2026"
                value={billForm.billing_month}
                onChange={(e) => setBillForm({ ...billForm, billing_month: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Maintenance Amount (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                className="form-control"
                placeholder="e.g. 3500"
                value={billForm.amount}
                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Payment Due Date <span className="required">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={billForm.due_date}
              onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
              required
            />
            <span className="form-hint">
              Bills that pass this date without payment will automatically become 'Overdue'.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate & Issue Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={selectedBill ? `Record Payment: Flat ${selectedBill.flat_number} (${selectedBill.billing_month})` : 'Record Payment'}
      >
        <form onSubmit={handleRecordPayment}>
          <div className="alert alert-warning" style={{ fontSize: '12px' }}>
            <strong>Offline Payment Record:</strong> Confirm that you have received payment from the resident. This marks the bill as Paid in the apartment ledger.
          </div>

          <div className="form-group">
            <label className="form-label">Bill Amount</label>
            <input
              type="text"
              className="form-control"
              value={`₹${selectedBill ? Number(selectedBill.amount).toLocaleString() : 0}`}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Payment Date Received <span className="required">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method & Remarks</label>
            <textarea
              className="form-control"
              placeholder="e.g. Received via Cash / Cheque #12345 / UPI Ref TXN9876"
              value={paymentForm.payment_remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPayModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              <CheckCircle size={15} /> Confirm Payment Received
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
