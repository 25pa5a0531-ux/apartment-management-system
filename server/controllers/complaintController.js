const { queryAll, queryOne, execute } = require('../database/db');

// Valid categories and statuses
const VALID_CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Lift', 'Security', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Submitted', 'In Progress', 'Resolved'];

// GET /api/complaints
// Query params: status, category, priority
const getComplaints = (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const currentUser = req.user;

    let sql = `
      SELECT 
        c.id,
        c.resident_id,
        c.flat_id,
        c.title,
        c.category,
        c.description,
        c.priority,
        c.status,
        c.admin_response,
        c.resolved_at,
        c.created_at,
        c.updated_at,
        u.name AS resident_name,
        u.email AS resident_email,
        u.phone AS resident_phone,
        f.flat_number,
        f.block,
        f.floor
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      JOIN flats f ON c.flat_id = f.id
      WHERE 1=1
    `;
    const params = [];

    // ENFORCE RESIDENT ACCESS RESTRICTION:
    // Residents can ONLY view their own complaints!
    if (currentUser.role === 'resident') {
      sql += ' AND c.resident_id = ?';
      params.push(currentUser.id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND c.category = ?';
      params.push(category);
    }

    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = queryAll(sql, params);

    return res.status(200).json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.'
    });
  }
};

// GET /api/complaints/:id
const getComplaintById = (req, res) => {
  try {
    const complaintId = req.params.id;
    const currentUser = req.user;

    const complaint = queryOne(`
      SELECT 
        c.*,
        u.name AS resident_name,
        u.email AS resident_email,
        u.phone AS resident_phone,
        f.flat_number,
        f.block,
        f.floor
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      JOIN flats f ON c.flat_id = f.id
      WHERE c.id = ?
    `, [complaintId]);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    // Authorization: if resident, can only view own complaint
    if (currentUser.role === 'resident' && complaint.resident_id !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own complaints.'
      });
    }

    return res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint.'
    });
  }
};

// POST /api/complaints (Residents or Admin)
const createComplaint = (req, res) => {
  try {
    const { title, category, description, priority } = req.body;
    const currentUser = req.user;

    if (!title || !title.trim() || !category || !category.trim() || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and description are required.'
      });
    }

    if (!VALID_CATEGORIES.includes(category.trim())) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`
      });
    }

    const complaintPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'Medium';

    // Must be associated with a valid flat
    let flatId = currentUser.flat_id;
    let residentId = currentUser.id;

    if (!flatId && currentUser.role === 'admin') {
      // If admin filing on behalf of a resident/flat
      if (req.body.flat_id) {
        flatId = req.body.flat_id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Flat ID is required when admin files a complaint.'
        });
      }
    }

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: 'No apartment flat is associated with your account.'
      });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = execute(`
      INSERT INTO complaints (
        resident_id, flat_id, title, category, description, priority, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
    `, [
      residentId,
      flatId,
      title.trim(),
      category.trim(),
      description.trim(),
      complaintPriority,
      nowStr,
      nowStr
    ]);

    const newComplaint = queryOne(`
      SELECT 
        c.*,
        u.name AS resident_name,
        f.flat_number,
        f.block
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      JOIN flats f ON c.flat_id = f.id
      WHERE c.id = ?
    `, [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: 'Maintenance complaint submitted successfully! Management has been notified.',
      complaint: newComplaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit complaint.'
    });
  }
};

// PUT /api/complaints/:id/status (Admin only)
const updateComplaintStatus = (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status, admin_response } = req.body;

    const existing = queryOne('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const newStatus = status || existing.status;
    const newResponse = admin_response !== undefined ? admin_response.trim() : existing.admin_response;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // If status marked as Resolved, set resolved_at timestamp
    const resolvedAt = newStatus === 'Resolved' ? (existing.resolved_at || nowStr) : null;

    execute(`
      UPDATE complaints
      SET status = ?,
          admin_response = ?,
          resolved_at = ?,
          updated_at = ?
      WHERE id = ?
    `, [newStatus, newResponse, resolvedAt, nowStr, complaintId]);

    const updated = queryOne(`
      SELECT 
        c.*,
        u.name AS resident_name,
        u.email AS resident_email,
        f.flat_number,
        f.block
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      JOIN flats f ON c.flat_id = f.id
      WHERE c.id = ?
    `, [complaintId]);

    return res.status(200).json({
      success: true,
      message: `Complaint #${complaintId} status updated to '${newStatus}'.`,
      complaint: updated
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.'
    });
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus
};
