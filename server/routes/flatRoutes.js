const express = require('express');
const router = express.Router();
const {
  getAllFlats,
  getFlatById,
  createFlat,
  updateFlat,
  deleteFlat
} = require('../controllers/flatController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All flat routes require authentication
router.use(authenticateToken);

// Accessible by all authenticated roles (useful for dropdowns in visitor registration)
router.get('/', getAllFlats);
router.get('/:id', getFlatById);

// Management restricted to Admin
router.post('/', authorizeRoles('admin'), createFlat);
router.put('/:id', authorizeRoles('admin'), updateFlat);
router.delete('/:id', authorizeRoles('admin'), deleteFlat);

module.exports = router;
