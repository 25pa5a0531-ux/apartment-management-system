const { queryAll, queryOne, execute } = require('../database/db');

// GET /api/visitors
// Query params: search, flat_id, status, date
const getVisitors = (req, res) => {
  try {
    const { search, flat_id, status, date } = req.query;
    const currentUser = req.user;

    let sql = `
      SELECT 
        v.id,
        v.name,
        v.phone,
        v.flat_id,
        v.purpose,
        v.vehicle_number,
        v.entry_time,
        v.exit_time,
        v.status,
        v.created_at,
        f.flat_number,
        f.block,
        f.floor,
        u.name AS registered_by_name
      FROM visitors v
      JOIN flats f ON v.flat_id = f.id
      LEFT JOIN users u ON v.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // ENFORCE RESIDENT ACCESS RESTRICTION:
    // Residents can ONLY view visitors for their own assigned flat!
    if (currentUser.role === 'resident') {
      if (!currentUser.flat_id) {
        return res.status(200).json({ success: true, visitors: [] });
      }
      sql += ' AND v.flat_id = ?';
      params.push(currentUser.flat_id);
    } else if (flat_id) {
      sql += ' AND v.flat_id = ?';
      params.push(flat_id);
    }

    // Filter by status (Inside / Exited)
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }

    // Filter by entry date (YYYY-MM-DD)
    if (date) {
      sql += ' AND date(v.entry_time) = date(?)';
      params.push(date);
    }

    // Search by name, phone, or flat number
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        v.name LIKE ? OR 
        v.phone LIKE ? OR 
        v.vehicle_number LIKE ? OR
        f.flat_number LIKE ?
      )`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY v.entry_time DESC';

    const visitors = queryAll(sql, params);

    return res.status(200).json({
      success: true,
      visitors
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor records.'
    });
  }
};

// GET /api/visitors/inside
const getInsideVisitors = (req, res) => {
  try {
    const currentUser = req.user;
    let sql = `
      SELECT 
        v.id,
        v.name,
        v.phone,
        v.flat_id,
        v.purpose,
        v.vehicle_number,
        v.entry_time,
        v.status,
        f.flat_number,
        f.block,
        f.floor
      FROM visitors v
      JOIN flats f ON v.flat_id = f.id
      WHERE v.status = 'Inside'
    `;
    const params = [];

    // If resident, only inside visitors for their flat
    if (currentUser.role === 'resident') {
      if (!currentUser.flat_id) {
        return res.status(200).json({ success: true, visitors: [] });
      }
      sql += ' AND v.flat_id = ?';
      params.push(currentUser.flat_id);
    }

    sql += ' ORDER BY v.entry_time DESC';

    const visitors = queryAll(sql, params);

    return res.status(200).json({
      success: true,
      visitors
    });
  } catch (error) {
    console.error('Error fetching inside visitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current visitors inside.'
    });
  }
};

// POST /api/visitors (Security or Admin)
const registerVisitor = (req, res) => {
  try {
    const { name, phone, flat_id, flat_number, purpose, vehicle_number } = req.body;

    if (!name || !name.trim() || !phone || !phone.trim() || !purpose || !purpose.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Visitor name, phone number, and purpose of visit are required.'
      });
    }

    let targetFlatId = flat_id;
    if (!targetFlatId && flat_number) {
      const flat = queryOne('SELECT id FROM flats WHERE LOWER(flat_number) = LOWER(?)', [flat_number.trim()]);
      if (!flat) {
        return res.status(400).json({
          success: false,
          message: `Flat number '${flat_number}' does not exist.`
        });
      }
      targetFlatId = flat.id;
    }

    if (!targetFlatId) {
      return res.status(400).json({
        success: false,
        message: 'Destination flat is required.'
      });
    }

    // Verify flat exists
    const flat = queryOne('SELECT id, flat_number, block FROM flats WHERE id = ?', [targetFlatId]);
    if (!flat) {
      return res.status(400).json({
        success: false,
        message: 'Selected flat does not exist.'
      });
    }

    // Current local time
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = execute(`
      INSERT INTO visitors (
        name, phone, flat_id, purpose, vehicle_number, entry_time, status, registered_by
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Inside', ?)
    `, [
      name.trim(),
      phone.trim(),
      targetFlatId,
      purpose.trim(),
      vehicle_number ? vehicle_number.trim().toUpperCase() : null,
      nowStr,
      req.user.id
    ]);

    const newVisitor = queryOne(`
      SELECT 
        v.*, f.flat_number, f.block, f.floor, u.name AS registered_by_name
      FROM visitors v
      JOIN flats f ON v.flat_id = f.id
      LEFT JOIN users u ON v.registered_by = u.id
      WHERE v.id = ?
    `, [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: `Visitor '${name.trim()}' successfully checked in for Flat ${flat.flat_number}!`,
      visitor: newVisitor
    });
  } catch (error) {
    console.error('Error registering visitor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register visitor.'
    });
  }
};

// PUT /api/visitors/:id/checkout (Security or Admin)
const checkoutVisitor = (req, res) => {
  try {
    const visitorId = req.params.id;

    const visitor = queryOne('SELECT * FROM visitors WHERE id = ?', [visitorId]);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor record not found.'
      });
    }

    if (visitor.status === 'Exited') {
      return res.status(400).json({
        success: false,
        message: `Visitor '${visitor.name}' has already exited at ${visitor.exit_time}.`
      });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    execute(`
      UPDATE visitors
      SET exit_time = ?, status = 'Exited'
      WHERE id = ?
    `, [nowStr, visitorId]);

    const updated = queryOne(`
      SELECT 
        v.*, f.flat_number, f.block, f.floor
      FROM visitors v
      JOIN flats f ON v.flat_id = f.id
      WHERE v.id = ?
    `, [visitorId]);

    return res.status(200).json({
      success: true,
      message: `Visitor '${visitor.name}' marked as exited at ${nowStr}.`,
      visitor: updated
    });
  } catch (error) {
    console.error('Error checking out visitor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record visitor exit.'
    });
  }
};

module.exports = {
  getVisitors,
  getInsideVisitors,
  registerVisitor,
  checkoutVisitor
};
