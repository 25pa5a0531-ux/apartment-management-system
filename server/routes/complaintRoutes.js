const express = require('express');
const router = express.Router();
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus
} = require('../controllers/complaintController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Accessible by Admin and Resident (Security is blocked)
router.get('/', authorizeRoles('admin', 'resident'), getComplaints);
router.get('/:id', authorizeRoles('admin', 'resident'), getComplaintById);
router.post('/', authorizeRoles('admin', 'resident'), createComplaint);

// Only Admin can update status and response
router.put('/:id/status', authorizeRoles('admin'), updateComplaintStatus);

module.exports = router;
