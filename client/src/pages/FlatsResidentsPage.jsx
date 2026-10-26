import React, { useState, useEffect } from 'react';
import { flatsApi, usersApi } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import {
  Building,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function FlatsResidentsPage() {
  const [activeTab, setActiveTab] = useState('flats'); // 'flats' or 'residents'
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal states
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [editingFlat, setEditingFlat] = useState(null);
  const [flatForm, setFlatForm] = useState({ flat_number: '', block: 'Tower A', floor: 1, status: 'Vacant' });

  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [residentForm, setResidentForm] = useState({ name: '', email: '', password: '', phone: '', flat_id: '' });

  // Confirm delete states
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, name: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [flatsRes, residentsRes] = await Promise.all([
        flatsApi.getAll(),
        usersApi.getResidents()
      ]);
      if (flatsRes.success) setFlats(flatsRes.flats);
      if (residentsRes.success) setResidents(residentsRes.residents);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredFlats = flats.filter((f) =>
    f.flat_number.toLowerCase().includes(search.toLowerCase()) ||
    f.block.toLowerCase().includes(search.toLowerCase()) ||
    (f.resident_name && f.resident_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredResidents = residents.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    (r.flat_number && r.flat_number.toLowerCase().includes(search.toLowerCase()))
  );

  // Flat actions
  const openAddFlatModal = () => {
    setEditingFlat(null);
    setFlatForm({ flat_number: '', block: 'Tower A', floor: 1, status: 'Vacant' });
    setIsFlatModalOpen(true);
  };

  const openEditFlatModal = (flat) => {
    setEditingFlat(flat);
    setFlatForm({
      flat_number: flat.flat_number,
      block: flat.block,
      floor: flat.floor,
      status: flat.status
    });
    setIsFlatModalOpen(true);
  };

  const handleSaveFlat = async (e) => {
    e.preventDefault();
    try {
      if (editingFlat) {
        await flatsApi.update(editingFlat.id, flatForm);
        setAlert({ type: 'success', message: `Flat ${flatForm.flat_number} updated successfully.` });
      } else {
        await flatsApi.create(flatForm);
        setAlert({ type: 'success', message: `Flat ${flatForm.flat_number} added successfully.` });
      }
      setIsFlatModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Operation failed.' });
    }
  };

  // Resident actions
  const openAddResidentModal = () => {
    setEditingResident(null);
    setResidentForm({ name: '', email: '', password: '', phone: '', flat_id: flats[0]?.id || '' });
    setIsResidentModalOpen(true);
  };

  const openEditResidentModal = (res) => {
    setEditingResident(res);
    setResidentForm({
      name: res.name,
      email: res.email,
      password: '',
      phone: res.phone || '',
      flat_id: res.flat_id || ''
    });
    setIsResidentModalOpen(true);
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await usersApi.updateResident(editingResident.id, residentForm);
        setAlert({ type: 'success', message: `Resident ${residentForm.name} updated successfully.` });
      } else {
        await usersApi.createResident(residentForm);
        setAlert({ type: 'success', message: `Resident account created for ${residentForm.name}.` });
      }
      setIsResidentModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Operation failed.' });
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'flat') {
        await flatsApi.delete(deleteConfirm.id);
        setAlert({ type: 'success', message: `Flat ${deleteConfirm.name} deleted.` });
      } else if (deleteConfirm.type === 'resident') {
        await usersApi.deleteResident(deleteConfirm.id);
        setAlert({ type: 'success', message: `Resident ${deleteConfirm.name} removed.` });
      }
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Delete operation failed.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-title-box">
          <h1>Apartment Flats & Residents</h1>
          <p className="header-subtitle">Manage building flats, assignments, and resident occupant accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'flats' ? (
            <button className="btn btn-primary" onClick={openAddFlatModal}>
              <Plus size={16} /> Add New Flat
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openAddResidentModal}>
              <Plus size={16} /> Register Resident
            </button>
          )}
        </div>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'flats' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('flats')}
        >
          <Building size={16} /> Flats Directory ({flats.length})
        </button>
        <button
          className={`btn ${activeTab === 'residents' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('residents')}
        >
          <Users size={16} /> Registered Residents ({residents.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            className="form-control"
            placeholder={activeTab === 'flats' ? 'Search by flat number, block, resident...' : 'Search by resident name, email, flat...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FLATS TABLE */}
      {activeTab === 'flats' && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flat No.</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Status</th>
                  <th>Assigned Resident</th>
                  <th>Active Visitors</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlats.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      {loading ? 'Loading flats...' : 'No apartment flats found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredFlats.map((flat) => (
                    <tr key={flat.id}>
                      <td>
                        <strong>Flat {flat.flat_number}</strong>
                      </td>
                      <td>{flat.block}</td>
                      <td>Floor {flat.floor}</td>
                      <td>
                        <Badge status={flat.status} />
                      </td>
                      <td>
                        {flat.resident_name ? (
                          <div>
                            <strong>{flat.resident_name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {flat.resident_email} {flat.resident_phone ? `• ${flat.resident_phone}` : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {flat.active_visitors_count > 0 ? (
                          <span className="badge badge-inside">{flat.active_visitors_count} Inside</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openEditFlatModal(flat)}
                            title="Edit Flat"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#ef4444' }}
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'flat',
                                id: flat.id,
                                name: `Flat ${flat.flat_number}`
                              })
                            }
                            title="Delete Flat"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESIDENTS TABLE */}
      {activeTab === 'residents' && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resident Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Assigned Flat</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">
                      {loading ? 'Loading residents...' : 'No residents found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>{r.email}</td>
                      <td>{r.phone || 'N/A'}</td>
                      <td>
                        {r.flat_number ? (
                          <span style={{ fontWeight: 600 }}>Flat {r.flat_number} ({r.block})</span>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td>{r.created_at?.substring(0, 10)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openEditResidentModal(r)}
                            title="Edit Resident"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#ef4444' }}
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'resident',
                                id: r.id,
                                name: r.name
                              })
                            }
                            title="Delete Resident"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLAT ADD/EDIT MODAL */}
      <Modal
        isOpen={isFlatModalOpen}
        onClose={() => setIsFlatModalOpen(false)}
        title={editingFlat ? `Edit Flat ${editingFlat.flat_number}` : 'Add New Apartment Flat'}
      >
        <form onSubmit={handleSaveFlat}>
          <div className="form-group">
            <label className="form-label">
              Flat Number <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 501"
              value={flatForm.flat_number}
              onChange={(e) => setFlatForm({ ...flatForm, flat_number: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Block / Tower <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tower A"
                value={flatForm.block}
                onChange={(e) => setFlatForm({ ...flatForm, block: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Floor Number <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={flatForm.floor}
                onChange={(e) => setFlatForm({ ...flatForm, floor: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Occupancy Status</label>
            <select
              className="form-control"
              value={flatForm.status}
              onChange={(e) => setFlatForm({ ...flatForm, status: e.target.value })}
            >
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFlatModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingFlat ? 'Save Changes' : 'Create Flat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESIDENT ADD/EDIT MODAL */}
      <Modal
        isOpen={isResidentModalOpen}
        onClose={() => setIsResidentModalOpen(false)}
        title={editingResident ? `Edit Resident: ${editingResident.name}` : 'Register New Resident'}
      >
        <form onSubmit={handleSaveResident}>
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={residentForm.name}
              onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. john@example.com"
                value={residentForm.email}
                onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +1 555-0101"
                value={residentForm.phone}
                onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Flat <span className="required">*</span></label>
            <select
              className="form-control"
              value={residentForm.flat_id}
              onChange={(e) => setResidentForm({ ...residentForm, flat_id: e.target.value })}
              required
            >
              <option value="">-- Select Flat --</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  Flat {f.flat_number} ({f.block}, Floor {f.floor}) - {f.status}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingResident ? 'Reset Password (leave empty to keep current)' : 'Password (min 6 characters)'}
              {!editingResident && <span className="required">*</span>}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder={editingResident ? '••••••••' : 'Password for resident login'}
              value={residentForm.password}
              onChange={(e) => setResidentForm({ ...residentForm, password: e.target.value })}
              required={!editingResident}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsResidentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingResident ? 'Update Resident' : 'Register Resident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirm.type === 'flat' ? 'Flat' : 'Resident'}`}
        message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
        danger={true}
        confirmText="Delete"
      />
    </div>
  );
}
