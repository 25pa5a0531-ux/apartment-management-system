const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Accessible by any authenticated role (returns tailored stats)
router.get('/stats', getDashboardStats);

module.exports = router;
