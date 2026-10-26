const { queryAll, queryOne, execute } = require('../database/db');

// GET /api/flats
const getAllFlats = (req, res) => {
  try {
    const flats = queryAll(`
      SELECT 
        f.id,
        f.flat_number,
        f.block,
        f.floor,
        f.status,
        f.created_at,
        u.id AS resident_id,
        u.name AS resident_name,
        u.email AS resident_email,
        u.phone AS resident_phone,
        (SELECT COUNT(*) FROM visitors v WHERE v.flat_id = f.id AND v.status = 'Inside') AS active_visitors_count
      FROM flats f
      LEFT JOIN users u ON u.flat_id = f.id AND u.role = 'resident'
      ORDER BY f.block ASC, f.floor ASC, f.flat_number ASC
    `);

    return res.status(200).json({
      success: true,
      flats
    });
  } catch (error) {
    console.error('Error fetching flats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve apartment flats.'
    });
  }
};

// GET /api/flats/:id
const getFlatById = (req, res) => {
  try {
    const flatId = req.params.id;
    const flat = queryOne(`
      SELECT f.*, u.id AS resident_id, u.name AS resident_name, u.email AS resident_email, u.phone AS resident_phone
      FROM flats f
      LEFT JOIN users u ON u.flat_id = f.id AND u.role = 'resident'
      WHERE f.id = ?
    `, [flatId]);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found.'
      });
    }

    // Get recent visitors for this flat
    const visitors = queryAll(`
      SELECT * FROM visitors WHERE flat_id = ? ORDER BY entry_time DESC LIMIT 5
    `, [flatId]);

    // Get maintenance bills for this flat
    const bills = queryAll(`
      SELECT * FROM maintenance_bills WHERE flat_id = ? ORDER BY due_date DESC LIMIT 5
    `, [flatId]);

    return res.status(200).json({
      success: true,
      flat: {
        ...flat,
        recentVisitors: visitors,
        recentBills: bills
      }
    });
  } catch (error) {
    console.error('Error fetching flat details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve flat details.'
    });
  }
};

// POST /api/flats (Admin only)
const createFlat = (req, res) => {
  try {
    const { flat_number, block, floor, status } = req.body;

    if (!flat_number || !block || floor === undefined || floor === null) {
      return res.status(400).json({
        success: false,
        message: 'Flat number, block, and floor number are required.'
      });
    }

    // Check if flat number already exists
    const existing = queryOne('SELECT id FROM flats WHERE flat_number = ?', [flat_number.trim()]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Flat number '${flat_number.trim()}' already exists.`
      });
    }

    const flatStatus = status || 'Vacant';
    const result = execute(`
      INSERT INTO flats (flat_number, block, floor, status)
      VALUES (?, ?, ?, ?)
    `, [flat_number.trim(), block.trim(), parseInt(floor, 10), flatStatus]);

    const newFlat = queryOne('SELECT * FROM flats WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: `Flat ${flat_number.trim()} created successfully!`,
      flat: newFlat
    });
  } catch (error) {
    console.error('Error creating flat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create flat.'
    });
  }
};

// PUT /api/flats/:id (Admin only)
const updateFlat = (req, res) => {
  try {
    const flatId = req.params.id;
    const { flat_number, block, floor, status } = req.body;

    const existing = queryOne('SELECT * FROM flats WHERE id = ?', [flatId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found.'
      });
    }

    // If flat_number is changed, verify uniqueness
    if (flat_number && flat_number.trim() !== existing.flat_number) {
      const duplicate = queryOne('SELECT id FROM flats WHERE flat_number = ? AND id != ?', [flat_number.trim(), flatId]);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Flat number '${flat_number.trim()}' is already used by another flat.`
        });
      }
    }

    execute(`
      UPDATE flats
      SET 
        flat_number = COALESCE(?, flat_number),
        block = COALESCE(?, block),
        floor = COALESCE(?, floor),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      flat_number ? flat_number.trim() : null,
      block ? block.trim() : null,
      floor !== undefined ? parseInt(floor, 10) : null,
      status || null,
      flatId
    ]);

    const updated = queryOne('SELECT * FROM flats WHERE id = ?', [flatId]);

    return res.status(200).json({
      success: true,
      message: 'Flat updated successfully!',
      flat: updated
    });
  } catch (error) {
    console.error('Error updating flat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update flat.'
    });
  }
};

// DELETE /api/flats/:id (Admin only)
const deleteFlat = (req, res) => {
  try {
    const flatId = req.params.id;

    // Check if flat exists
    const existing = queryOne('SELECT * FROM flats WHERE id = ?', [flatId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found.'
      });
    }

    // Check if residents are assigned
    const resident = queryOne('SELECT id FROM users WHERE flat_id = ?', [flatId]);
    if (resident) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete flat because a resident is currently assigned to it. Please reassign or remove the resident first.'
      });
    }

    execute('DELETE FROM flats WHERE id = ?', [flatId]);

    return res.status(200).json({
      success: true,
      message: `Flat ${existing.flat_number} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting flat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete flat.'
    });
  }
};

module.exports = {
  getAllFlats,
  getFlatById,
  createFlat,
  updateFlat,
  deleteFlat
};
