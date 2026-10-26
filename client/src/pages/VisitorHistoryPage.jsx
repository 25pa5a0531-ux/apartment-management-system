import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { visitorsApi } from '../services/api';
import Badge from '../components/Badge';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Search,
  Calendar,
  Filter,
  RotateCcw,
  LogOut,
  UserCheck,
  Clock,
  Car
} from 'lucide-react';

export default function VisitorHistoryPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Checkout modal
  const [checkoutConfirm, setCheckoutConfirm] = useState({ isOpen: false, id: null, name: '' });

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await visitorsApi.getAll(params);
      if (res.success) {
        setVisitors(res.visitors);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load visitor records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVisitors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFilter('');
    // Trigger re-fetch
    visitorsApi.getAll().then(res => {
      if (res.success) setVisitors(res.visitors);
    });
  };

  const handleConfirmCheckout = async () => {
    try {
      const res = await visitorsApi.checkout(checkoutConfirm.id);
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Visitor '${checkoutConfirm.name}' marked as exited.`
        });
        fetchVisitors();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to checkout visitor.' });
    }
  };

  const canCheckout = user?.role === 'admin' || user?.role === 'security';

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>Visitor Entry & Exit History</h1>
          <p className="header-subtitle">
            {user?.role === 'resident'
              ? `Log of all visitors checked in for Flat ${user?.flat_number}.`
              : 'Complete apartment complex visitor access registry with search and filters.'}
          </p>
        </div>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ margin: 0 }}>
            <div className="search-input-box">
              <Search size={16} className="search-icon-pos" />
              <input
                type="text"
                className="form-control"
                placeholder={
                  user?.role === 'resident'
                    ? 'Search by visitor name, phone, vehicle...'
                    : 'Search by visitor name, phone, flat no, vehicle...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Inside">Inside (Active)</option>
              <option value="Exited">Exited</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm">
              <Filter size={14} /> Search
            </button>

            {(search || statusFilter || dateFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Visitor Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Destination Flat</th>
                <th>Purpose</th>
                <th>Vehicle No.</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Status</th>
                {canCheckout && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={canCheckout ? 8 : 7} className="table-empty">
                    {loading ? 'Loading visitor logs...' : 'No visitor records found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {v.phone}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Flat {v.flat_number}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {v.block}, Floor {v.floor}
                      </div>
                    </td>
                    <td>{v.purpose}</td>
                    <td>
                      {v.vehicle_number ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.vehicle_number}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div>{v.entry_time?.substring(0, 10)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {v.entry_time?.substring(11, 16)}
                      </div>
                    </td>
                    <td>
                      {v.exit_time ? (
                        <div>
                          <div>{v.exit_time?.substring(0, 10)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {v.exit_time?.substring(11, 16)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 500 }}>Currently Inside</span>
                      )}
                    </td>
                    <td>
                      <Badge status={v.status} />
                    </td>
                    {canCheckout && (
                      <td style={{ textAlign: 'right' }}>
                        {v.status === 'Inside' ? (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                            onClick={() =>
                              setCheckoutConfirm({
                                isOpen: true,
                                id: v.id,
                                name: v.name
                              })
                            }
                            title="Record Visitor Exit"
                          >
                            <LogOut size={13} /> Exit
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed</span>
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

      {/* Confirm Checkout Dialog */}
      <ConfirmDialog
        isOpen={checkoutConfirm.isOpen}
        onClose={() => setCheckoutConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmCheckout}
        title="Confirm Visitor Departure"
        message={`Confirm that visitor '${checkoutConfirm.name}' has left the apartment premises?`}
        confirmText="Record Exit"
      />
    </div>
  );
}
