const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, execute } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email
    const user = queryOne(`
      SELECT 
        u.id, u.name, u.email, u.password, u.phone, u.role, u.flat_id,
        f.flat_number, f.block, f.floor
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE LOWER(u.email) = LOWER(?)
    `, [email.trim()]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password hash
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return safe user object (omit password hash)
    const { password: _, ...userSafe } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// PUT /api/auth/update-profile
const updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, currentPassword, newPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.'
      });
    }

    // If updating password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const user = queryOne('SELECT password FROM users WHERE id = ?', [userId]);
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.'
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      execute(`
        UPDATE users 
        SET name = ?, phone = ?, password = ?
        WHERE id = ?
      `, [name.trim(), phone ? phone.trim() : null, hashedPassword, userId]);
    } else {
      // Just update name & phone
      execute(`
        UPDATE users 
        SET name = ?, phone = ?
        WHERE id = ?
      `, [name.trim(), phone ? phone.trim() : null, userId]);
    }

    const updatedUser = queryOne(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.flat_id,
        f.flat_number, f.block, f.floor
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE u.id = ?
    `, [userId]);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  login,
  getMe,
  updateProfile,
  logout
};
