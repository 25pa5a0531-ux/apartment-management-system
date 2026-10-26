const { queryAll, queryOne, execute } = require('../database/db');

// GET /api/dashboard/stats
const getDashboardStats = (req, res) => {
  try {
    const user = req.user;

    // Refresh overdue bills first
    execute(`
      UPDATE maintenance_bills 
      SET status = 'Overdue' 
      WHERE status = 'Pending' AND date(due_date) < date('now', 'localtime')
    `);

    if (user.role === 'admin') {
      // 1. Total flats
      const totalFlats = queryOne('SELECT COUNT(*) as count FROM flats').count;
      const occupiedFlats = queryOne("SELECT COUNT(*) as count FROM flats WHERE status = 'Occupied'").count;

      // 2. Total registered residents
      const totalResidents = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'resident'").count;

      // 3. Visitors currently inside
      const visitorsInside = queryOne("SELECT COUNT(*) as count FROM visitors WHERE status = 'Inside'").count;

      // 4. Maintenance stats
      const billStats = queryOne(`
        SELECT 
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pendingCount,
          COUNT(CASE WHEN status = 'Overdue' THEN 1 END) AS overdueCount,
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) AS pendingAmount,
          COALESCE(SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END), 0) AS overdueAmount,
          COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) AS collectedAmount
        FROM maintenance_bills
      `);

      // 5. Open complaints (Submitted or In Progress)
      const openComplaints = queryOne(`
        SELECT 
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submittedCount,
          COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as inProgressCount
        FROM complaints 
        WHERE status != 'Resolved'
      `).count;

      // Recent 5 visitors
      const recentVisitors = queryAll(`
        SELECT v.*, f.flat_number, f.block
        FROM visitors v
        JOIN flats f ON v.flat_id = f.id
        ORDER BY v.entry_time DESC
        LIMIT 5
      `);

      // Recent 5 complaints
      const recentComplaints = queryAll(`
        SELECT c.*, u.name as resident_name, f.flat_number, f.block
        FROM complaints c
        JOIN users u ON c.resident_id = u.id
        JOIN flats f ON c.flat_id = f.id
        ORDER BY c.created_at DESC
        LIMIT 5
      `);

      return res.status(200).json({
        success: true,
        stats: {
          totalFlats,
          occupiedFlats,
          totalResidents,
          visitorsInside,
          pendingBillsCount: billStats.pendingCount + billStats.overdueCount,
          pendingAmount: billStats.pendingAmount + billStats.overdueAmount,
          collectedAmount: billStats.collectedAmount,
          openComplaints,
          recentVisitors,
          recentComplaints
        }
      });
    }

    if (user.role === 'security') {
      const visitorsInside = queryOne("SELECT COUNT(*) as count FROM visitors WHERE status = 'Inside'").count;
      const todayEntries = queryOne("SELECT COUNT(*) as count FROM visitors WHERE date(entry_time) = date('now', 'localtime')").count;
      const todayExits = queryOne("SELECT COUNT(*) as count FROM visitors WHERE date(exit_time) = date('now', 'localtime')").count;

      const currentInside = queryAll(`
        SELECT v.*, f.flat_number, f.block
        FROM visitors v
        JOIN flats f ON v.flat_id = f.id
        WHERE v.status = 'Inside'
        ORDER BY v.entry_time DESC
        LIMIT 10
      `);

      return res.status(200).json({
        success: true,
        stats: {
          visitorsInside,
          todayEntries,
          todayExits,
          currentInside
        }
      });
    }

    if (user.role === 'resident') {
      const flatId = user.flat_id;
      if (!flatId) {
        return res.status(200).json({
          success: true,
          stats: {
            visitorsInsideForFlat: 0,
            totalVisitorsForFlat: 0,
            pendingBillsCount: 0,
            pendingAmount: 0,
            openComplaints: 0,
            recentVisitors: [],
            recentComplaints: []
          }
        });
      }

      const visitorsInsideForFlat = queryOne("SELECT COUNT(*) as count FROM visitors WHERE flat_id = ? AND status = 'Inside'", [flatId]).count;
      const totalVisitorsForFlat = queryOne("SELECT COUNT(*) as count FROM visitors WHERE flat_id = ?", [flatId]).count;

      const billStats = queryOne(`
        SELECT 
          COUNT(CASE WHEN status IN ('Pending', 'Overdue') THEN 1 END) as pendingCount,
          COALESCE(SUM(CASE WHEN status IN ('Pending', 'Overdue') THEN amount ELSE 0 END), 0) as pendingAmount
        FROM maintenance_bills
        WHERE flat_id = ?
      `, [flatId]);

      const openComplaints = queryOne("SELECT COUNT(*) as count FROM complaints WHERE resident_id = ? AND status != 'Resolved'", [user.id]).count;

      const recentVisitors = queryAll(`
        SELECT v.*, f.flat_number, f.block
        FROM visitors v
        JOIN flats f ON v.flat_id = f.id
        WHERE v.flat_id = ?
        ORDER BY v.entry_time DESC
        LIMIT 5
      `, [flatId]);

      const recentComplaints = queryAll(`
        SELECT c.*, f.flat_number
        FROM complaints c
        JOIN flats f ON c.flat_id = f.id
        WHERE c.resident_id = ?
        ORDER BY c.created_at DESC
        LIMIT 5
      `, [user.id]);

      return res.status(200).json({
        success: true,
        stats: {
          visitorsInsideForFlat,
          totalVisitorsForFlat,
          pendingBillsCount: billStats.pendingCount,
          pendingAmount: billStats.pendingAmount,
          openComplaints,
          recentVisitors,
          recentComplaints
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Unknown user role.'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics.'
    });
  }
};

module.exports = {
  getDashboardStats
};
