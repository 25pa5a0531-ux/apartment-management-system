const express = require('express');
const router = express.Router();
const {
  getVisitors,
  getInsideVisitors,
  registerVisitor,
  checkoutVisitor
} = require('../controllers/visitorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Accessible by all authenticated users (controller enforces resident data isolation)
router.get('/', getVisitors);
router.get('/inside', getInsideVisitors);

// Only Security Guard and Admin can register visitors and check them out
router.post('/', authorizeRoles('admin', 'security'), registerVisitor);
router.put('/:id/checkout', authorizeRoles('admin', 'security'), checkoutVisitor);

module.exports = router;
