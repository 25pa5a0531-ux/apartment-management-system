const express = require('express');
const router = express.Router();
const {
  getResidents,
  getAllUsers,
  createResident,
  updateResident,
  deleteResident
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Admin and Security can access the residents directory (needed to cross-check visitor entries)
router.get('/residents', authorizeRoles('admin', 'security'), getResidents);

// Admin-only user management
router.get('/', authorizeRoles('admin'), getAllUsers);
router.post('/residents', authorizeRoles('admin'), createResident);
router.put('/residents/:id', authorizeRoles('admin'), updateResident);
router.delete('/residents/:id', authorizeRoles('admin'), deleteResident);

module.exports = router;
