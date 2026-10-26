const bcrypt = require('bcryptjs');
const { queryAll, queryOne, execute } = require('../database/db');

// GET /api/users/residents
const getResidents = (req, res) => {
  try {
    const residents = queryAll(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.flat_id,
        u.created_at,
        f.flat_number,
        f.block,
        f.floor,
        f.status AS flat_status
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE u.role = 'resident'
      ORDER BY f.block ASC, f.flat_number ASC, u.name ASC
    `);

    return res.status(200).json({
      success: true,
      residents
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve residents list.'
    });
  }
};

// GET /api/users (Admin only)
const getAllUsers = (req, res) => {
  try {
    const users = queryAll(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.flat_id,
        u.created_at,
        f.flat_number,
        f.block
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      ORDER BY u.role ASC, u.name ASC
    `);

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
};

// POST /api/users/residents (Admin only)
const createResident = (req, res) => {
  try {
    const { name, email, password, phone, flat_id } = req.body;

    if (!name || !email || !password || !flat_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and assigned flat are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email exists
    const existing = queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Check if flat exists
    const flat = queryOne('SELECT id, flat_number FROM flats WHERE id = ?', [flat_id]);
    if (!flat) {
      return res.status(400).json({
        success: false,
        message: 'Selected flat does not exist.'
      });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const result = execute(`
      INSERT INTO users (name, email, password, phone, role, flat_id)
      VALUES (?, ?, ?, ?, 'resident', ?)
    `, [name.trim(), email.trim(), hashedPassword, phone ? phone.trim() : null, flat_id]);

    // Automatically mark flat as Occupied
    execute("UPDATE flats SET status = 'Occupied' WHERE id = ?", [flat_id]);

    const newResident = queryOne(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.flat_id, u.created_at,
        f.flat_number, f.block, f.floor
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE u.id = ?
    `, [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: `Resident account created for ${name.trim()} (Flat ${flat.flat_number}).`,
      resident: newResident
    });
  } catch (error) {
    console.error('Error creating resident:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create resident account.'
    });
  }
};

// PUT /api/users/residents/:id (Admin only)
const updateResident = (req, res) => {
  try {
    const residentId = req.params.id;
    const { name, email, phone, flat_id, password } = req.body;

    const existing = queryOne("SELECT * FROM users WHERE id = ? AND role = 'resident'", [residentId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found.'
      });
    }

    // Check email uniqueness if changing email
    if (email && email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const duplicate = queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [email.trim(), residentId]);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used by another account.'
        });
      }
    }

    // If changing flat, verify new flat
    let newFlatId = existing.flat_id;
    if (flat_id && flat_id !== existing.flat_id) {
      const flat = queryOne('SELECT id FROM flats WHERE id = ?', [flat_id]);
      if (!flat) {
        return res.status(400).json({
          success: false,
          message: 'Specified flat does not exist.'
        });
      }
      newFlatId = flat_id;
      execute("UPDATE flats SET status = 'Occupied' WHERE id = ?", [newFlatId]);
    }

    // Optional password update
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      execute(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            flat_id = ?,
            password = ?
        WHERE id = ?
      `, [
        name ? name.trim() : null,
        email ? email.trim() : null,
        phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
        newFlatId,
        hashedPassword,
        residentId
      ]);
    } else {
      execute(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            flat_id = ?
        WHERE id = ?
      `, [
        name ? name.trim() : null,
        email ? email.trim() : null,
        phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
        newFlatId,
        residentId
      ]);
    }

    const updated = queryOne(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.flat_id, u.created_at,
        f.flat_number, f.block, f.floor
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE u.id = ?
    `, [residentId]);

    return res.status(200).json({
      success: true,
      message: 'Resident updated successfully!',
      resident: updated
    });
  } catch (error) {
    console.error('Error updating resident:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update resident.'
    });
  }
};

// DELETE /api/users/residents/:id (Admin only)
const deleteResident = (req, res) => {
  try {
    const residentId = req.params.id;

    const existing = queryOne("SELECT * FROM users WHERE id = ? AND role = 'resident'", [residentId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found.'
      });
    }

    const previousFlatId = existing.flat_id;

    execute('DELETE FROM users WHERE id = ?', [residentId]);

    // Check if flat now has 0 residents, update to Vacant
    if (previousFlatId) {
      const remainingResidents = queryOne("SELECT COUNT(*) as count FROM users WHERE flat_id = ? AND role = 'resident'", [previousFlatId]);
      if (remainingResidents && remainingResidents.count === 0) {
        execute("UPDATE flats SET status = 'Vacant' WHERE id = ?", [previousFlatId]);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Resident ${existing.name} has been removed successfully.`
    });
  } catch (error) {
    console.error('Error deleting resident:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove resident.'
    });
  }
};

module.exports = {
  getResidents,
  getAllUsers,
  createResident,
  updateResident,
  deleteResident
};
