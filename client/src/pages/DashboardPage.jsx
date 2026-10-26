import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, visitorsApi } from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Alert from '../components/Alert';
import {
  Building,
  Users,
  UserCheck,
  CreditCard,
  MessageSquareWarning,
  UserPlus,
  ArrowRight,
  LogOut,
  Clock,
  Car,
  Home,
  CheckCircle,
  PlusCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardApi.getStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickCheckout = async (visitorId, visitorName) => {
    try {
      const res = await visitorsApi.checkout(visitorId);
      if (res.success) {
        setActionMessage(`Visitor '${visitorName}' checked out successfully.`);
        fetchStats(); // refresh counts
      }
    } catch (err) {
      setError(err.message || 'Checkout failed.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const role = user?.role;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div className="header-title-box">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="header-subtitle">
            {role === 'admin' && 'Here is an overview of the apartment operations, security, and maintenance.'}
            {role === 'security' && 'Security Gate Desk — monitor active visitors, record entries and checkouts.'}
            {role === 'resident' && `Resident Portal — Flat ${user?.flat_number || 'N/A'}, ${user?.block || ''}.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(role === 'admin' || role === 'security') && (
            <Link to="/visitor-register" className="btn btn-primary">
              <UserPlus size={16} />
              <span>Register Visitor</span>
            </Link>
          )}
          {role === 'resident' && (
            <Link to="/complaints" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>Submit Complaint</span>
            </Link>
          )}
        </div>
      </div>

      {actionMessage && (
        <Alert type="success" message={actionMessage} onClose={() => setActionMessage('')} />
      )}
      {error && (
        <Alert type="danger" message={error} onClose={() => setError('')} />
      )}

      {/* ADMIN DASHBOARD */}
      {role === 'admin' && stats && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Flats"
              value={stats.totalFlats}
              subtext={`${stats.occupiedFlats} Occupied`}
              icon={<Building size={24} />}
              color="blue"
            />
            <StatCard
              label="Registered Residents"
              value={stats.totalResidents}
              subtext="Across all blocks"
              icon={<Users size={24} />}
              color="purple"
            />
            <StatCard
              label="Visitors Inside"
              value={stats.visitorsInside}
              subtext="Currently on premises"
              icon={<UserCheck size={24} />}
              color="green"
            />
            <StatCard
              label="Pending Bills"
              value={stats.pendingBillsCount}
              subtext={`₹${Number(stats.pendingAmount).toLocaleString()} due`}
              icon={<CreditCard size={24} />}
              color="amber"
            />
            <StatCard
              label="Open Complaints"
              value={stats.openComplaints}
              subtext="Requires resolution"
              icon={<MessageSquareWarning size={24} />}
              color="rose"
            />
          </div>

          <div className="dashboard-row">
            {/* Recent Visitors */}
            <div className="card">
              <div className="card-header">
                <h3>Recent Visitor Entries</h3>
                <Link to="/visitor-history" className="btn btn-sm btn-outline">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Flat</th>
                      <th>Purpose</th>
                      <th>Entry Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentVisitors?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty">No visitor entries recorded yet.</td>
                      </tr>
                    ) : (
                      stats.recentVisitors?.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <strong>{v.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.phone}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>Flat {v.flat_number}</span>
                          </td>
                          <td>{v.purpose}</td>
                          <td>{v.entry_time?.substring(11, 16)}</td>
                          <td>
                            <Badge status={v.status} />
                          </td>
                          <td>
                            {v.status === 'Inside' ? (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleQuickCheckout(v.id, v.name)}
                                title="Record Exit"
                              >
                                Checkout
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exited</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="card">
              <div className="card-header">
                <h3>Recent Complaints</h3>
                <Link to="/complaints" className="btn btn-sm btn-outline">
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Flat</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentComplaints?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="table-empty">No complaints submitted.</td>
                      </tr>
                    ) : (
                      stats.recentComplaints?.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.title}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {c.category} • by {c.resident_name}
                            </div>
                          </td>
                          <td>Flat {c.flat_number}</td>
                          <td>
                            <Badge status={c.priority} />
                          </td>
                          <td>
                            <Badge status={c.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECURITY DASHBOARD */}
      {role === 'security' && stats && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Visitors Inside"
              value={stats.visitorsInside}
              subtext="Currently in complex"
              icon={<UserCheck size={24} />}
              color="green"
            />
            <StatCard
              label="Today's Total Entries"
              value={stats.todayEntries}
              subtext="Logged by security"
              icon={<Clock size={24} />}
              color="blue"
            />
            <StatCard
              label="Today's Exits"
              value={stats.todayExits}
              subtext="Successfully departed"
              icon={<CheckCircle size={24} />}
              color="purple"
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Currently Inside Apartment Complex</h3>
              <Link to="/visitor-register" className="btn btn-sm btn-primary">
                <UserPlus size={14} /> Check In New Visitor
              </Link>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Phone</th>
                    <th>Destination Flat</th>
                    <th>Purpose</th>
                    <th>Vehicle No.</th>
                    <th>Entry Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.currentInside?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        No visitors are currently inside the apartment.
                      </td>
                    </tr>
                  ) : (
                    stats.currentInside?.map((v) => (
                      <tr key={v.id}>
                        <td><strong>{v.name}</strong></td>
                        <td>{v.phone}</td>
                        <td>
                          <strong>Flat {v.flat_number}</strong> ({v.block})
                        </td>
                        <td>{v.purpose}</td>
                        <td>{v.vehicle_number || 'N/A'}</td>
                        <td>{v.entry_time}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleQuickCheckout(v.id, v.name)}
                          >
                            <LogOut size={13} /> Checkout
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* RESIDENT DASHBOARD */}
      {role === 'resident' && stats && (
        <>
          <div className="stats-grid">
            <StatCard
              label="My Assigned Flat"
              value={`Flat ${user.flat_number || '101'}`}
              subtext={`${user.block || 'Tower A'}, Floor ${user.floor || 1}`}
              icon={<Home size={24} />}
              color="blue"
            />
            <StatCard
              label="Visitors Inside"
              value={stats.visitorsInsideForFlat}
              subtext="Visiting your flat right now"
              icon={<UserCheck size={24} />}
              color="green"
            />
            <StatCard
              label="Maintenance Due"
              value={`₹${Number(stats.pendingAmount).toLocaleString()}`}
              subtext={`${stats.pendingBillsCount} unpaid bill(s)`}
              icon={<CreditCard size={24} />}
              color={stats.pendingBillsCount > 0 ? 'amber' : 'green'}
            />
            <StatCard
              label="Active Complaints"
              value={stats.openComplaints}
              subtext="Submitted or In Progress"
              icon={<MessageSquareWarning size={24} />}
              color="rose"
            />
          </div>

          <div className="dashboard-row">
            {/* My Visitors */}
            <div className="card">
              <div className="card-header">
                <h3>Recent Visitors to Flat {user.flat_number}</h3>
                <Link to="/visitor-history" className="btn btn-sm btn-outline">
                  View Full History <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Purpose</th>
                      <th>Vehicle</th>
                      <th>Entry Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentVisitors?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="table-empty">No visitor entries recorded for your flat.</td>
                      </tr>
                    ) : (
                      stats.recentVisitors?.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <strong>{v.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.phone}</div>
                          </td>
                          <td>{v.purpose}</td>
                          <td>{v.vehicle_number || 'None'}</td>
                          <td>{v.entry_time?.substring(0, 16)}</td>
                          <td><Badge status={v.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* My Complaints */}
            <div className="card">
              <div className="card-header">
                <h3>My Maintenance Complaints</h3>
                <Link to="/complaints" className="btn btn-sm btn-outline">
                  Track All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentComplaints?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="table-empty">You have no active maintenance complaints.</td>
                      </tr>
                    ) : (
                      stats.recentComplaints?.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.title}</strong>
                            {c.admin_response && (
                              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                                Response: {c.admin_response}
                              </div>
                            )}
                          </td>
                          <td>{c.category}</td>
                          <td><Badge status={c.priority} /></td>
                          <td><Badge status={c.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
