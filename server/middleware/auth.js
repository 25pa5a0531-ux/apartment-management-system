const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'apartment_management_secret_key_college_project_2026';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user details from database (including flat information if applicable)
    const user = queryOne(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.flat_id, u.created_at,
        f.flat_number, f.block, f.floor
      FROM users u
      LEFT JOIN flats f ON u.flat_id = f.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

// Middleware to authorize specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s). Your current role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
