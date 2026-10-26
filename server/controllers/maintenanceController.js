const { queryAll, queryOne, execute } = require('../database/db');

// Helper function to auto-update overdue status for pending bills past due date
function refreshOverdueBills() {
  execute(`
    UPDATE maintenance_bills 
    SET status = 'Overdue' 
    WHERE status = 'Pending' AND date(due_date) < date('now', 'localtime')
  `);
}

// GET /api/maintenance/bills
// Query params: status, flat_id, billing_month
const getBills = (req, res) => {
  try {
    // Refresh overdue bills automatically
    refreshOverdueBills();

    const { status, flat_id, billing_month } = req.query;
    const currentUser = req.user;

    let sql = `
      SELECT 
        b.id,
        b.flat_id,
        b.billing_month,
        b.amount,
        b.due_date,
        b.status,
        b.payment_date,
        b.payment_remarks,
        b.created_at,
        f.flat_number,
        f.block,
        f.floor,
        u.name AS resident_name,
        u.email AS resident_email,
        u.phone AS resident_phone
      FROM maintenance_bills b
      JOIN flats f ON b.flat_id = f.id
      LEFT JOIN users u ON u.flat_id = f.id AND u.role = 'resident'
      WHERE 1=1
    `;
    const params = [];

    // ENFORCE RESIDENT ACCESS RESTRICTION:
    // Residents can ONLY view bills for their own assigned flat!
    if (currentUser.role === 'resident') {
      if (!currentUser.flat_id) {
        return res.status(200).json({ success: true, bills: [] });
      }
      sql += ' AND b.flat_id = ?';
      params.push(currentUser.flat_id);
    } else if (flat_id) {
      sql += ' AND b.flat_id = ?';
      params.push(flat_id);
    }

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    if (billing_month) {
      sql += ' AND b.billing_month = ?';
      params.push(billing_month);
    }

    sql += ' ORDER BY b.due_date DESC, f.flat_number ASC';

    const bills = queryAll(sql, params);

    return res.status(200).json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Error fetching maintenance bills:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance bills.'
    });
  }
};

// POST /api/maintenance/bills (Admin only)
const createBill = (req, res) => {
  try {
    const { flat_id, billing_month, amount, due_date } = req.body;

    if (!flat_id || !billing_month || !amount || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Flat, billing month, amount, and due date are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number.'
      });
    }

    // Verify flat exists
    const flat = queryOne('SELECT id, flat_number FROM flats WHERE id = ?', [flat_id]);
    if (!flat) {
      return res.status(400).json({
        success: false,
        message: 'Selected flat does not exist.'
      });
    }

    // Determine initial status based on due date
    const todayStr = new Date().toISOString().substring(0, 10);
    const initialStatus = due_date < todayStr ? 'Overdue' : 'Pending';

    const result = execute(`
      INSERT INTO maintenance_bills (flat_id, billing_month, amount, due_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [flat_id, billing_month.trim(), numAmount, due_date, initialStatus]);

    const newBill = queryOne(`
      SELECT 
        b.*, f.flat_number, f.block, f.floor
      FROM maintenance_bills b
      JOIN flats f ON b.flat_id = f.id
      WHERE b.id = ?
    `, [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: `Maintenance bill of ₹${numAmount} generated for Flat ${flat.flat_number} (${billing_month.trim()}).`,
      bill: newBill
    });
  } catch (error) {
    console.error('Error creating maintenance bill:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create maintenance bill.'
    });
  }
};

// PUT /api/maintenance/bills/:id/pay (Admin only - record payment)
const recordPayment = (req, res) => {
  try {
    const billId = req.params.id;
    const { payment_date, payment_remarks } = req.body;

    const bill = queryOne(`
      SELECT b.*, f.flat_number 
      FROM maintenance_bills b
      JOIN flats f ON b.flat_id = f.id
      WHERE b.id = ?
    `, [billId]);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance bill not found.'
      });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: `This bill has already been marked as Paid on ${bill.payment_date}.`
      });
    }

    const payDate = payment_date || new Date().toISOString().substring(0, 10);
    const remarks = payment_remarks ? payment_remarks.trim() : 'Manual payment recorded by Admin';

    execute(`
      UPDATE maintenance_bills
      SET status = 'Paid',
          payment_date = ?,
          payment_remarks = ?
      WHERE id = ?
    `, [payDate, remarks, billId]);

    const updated = queryOne(`
      SELECT 
        b.*, f.flat_number, f.block, f.floor
      FROM maintenance_bills b
      JOIN flats f ON b.flat_id = f.id
      WHERE b.id = ?
    `, [billId]);

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${bill.amount} successfully recorded for Flat ${bill.flat_number} (${bill.billing_month}).`,
      bill: updated
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment.'
    });
  }
};

// GET /api/maintenance/summary
const getMaintenanceSummary = (req, res) => {
  try {
    refreshOverdueBills();
    const currentUser = req.user;

    let baseFilter = '';
    const params = [];

    if (currentUser.role === 'resident') {
      if (!currentUser.flat_id) {
        return res.status(200).json({
          success: true,
          summary: { totalBilled: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, pendingBillsCount: 0 }
        });
      }
      baseFilter = ' WHERE flat_id = ?';
      params.push(currentUser.flat_id);
    }

    const stats = queryOne(`
      SELECT 
        COALESCE(SUM(amount), 0) AS totalBilled,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) AS totalPaid,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) AS totalPending,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END), 0) AS totalOverdue,
        COUNT(CASE WHEN status = 'Pending' OR status = 'Overdue' THEN 1 END) AS unpaidCount
      FROM maintenance_bills
      ${baseFilter}
    `, params);

    return res.status(200).json({
      success: true,
      summary: stats
    });
  } catch (error) {
    console.error('Error calculating maintenance summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate maintenance statistics.'
    });
  }
};

module.exports = {
  getBills,
  createBill,
  recordPayment,
  getMaintenanceSummary
};
