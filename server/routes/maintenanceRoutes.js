const express = require('express');
const router = express.Router();
const {
  getBills,
  createBill,
  recordPayment,
  getMaintenanceSummary
} = require('../controllers/maintenanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Accessible by Admin and Resident (controller restricts resident to own flat's bills; Security is blocked)
router.get('/bills', authorizeRoles('admin', 'resident'), getBills);
router.get('/summary', authorizeRoles('admin', 'resident'), getMaintenanceSummary);

// Admin-only billing actions
router.post('/bills', authorizeRoles('admin'), createBill);
router.put('/bills/:id/pay', authorizeRoles('admin'), recordPayment);

module.exports = router;
