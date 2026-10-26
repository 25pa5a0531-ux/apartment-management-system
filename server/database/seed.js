const bcrypt = require('bcryptjs');
const { db, queryOne, initializeDatabase } = require('./db');

function seed(force = true) {
  initializeDatabase();

  // If not forcing, check if database already has user accounts
  if (!force) {
    try {
      const userCount = queryOne('SELECT COUNT(*) as count FROM users');
      if (userCount && userCount.count > 0) {
        console.log(`[DB] Database contains ${userCount.count} existing user(s). Preserving existing records.`);
        return;
      }
    } catch (err) {
      // If query fails, proceed with seeding
    }
  }

  console.log('--- Initializing and Seeding Database ---');

  // Clear existing data to ensure clean idempotency
  db.exec(`
    DELETE FROM complaints;
    DELETE FROM maintenance_bills;
    DELETE FROM visitors;
    DELETE FROM users;
    DELETE FROM flats;
  `);

  console.log('Cleared existing records.');

  // 1. Insert Flats
  const flats = [
    { number: '101', block: 'Tower A', floor: 1, status: 'Occupied' },
    { number: '102', block: 'Tower A', floor: 1, status: 'Occupied' },
    { number: '201', block: 'Tower A', floor: 2, status: 'Occupied' },
    { number: '202', block: 'Tower A', floor: 2, status: 'Vacant' },
    { number: '301', block: 'Tower B', floor: 3, status: 'Occupied' },
    { number: '302', block: 'Tower B', floor: 3, status: 'Under Maintenance' },
    { number: '401', block: 'Tower B', floor: 4, status: 'Occupied' }
  ];

  const insertFlat = db.prepare(`
    INSERT INTO flats (flat_number, block, floor, status)
    VALUES (?, ?, ?, ?)
  `);

  const flatMap = {};
  for (const f of flats) {
    const res = insertFlat.run(f.number, f.block, f.floor, f.status);
    flatMap[f.number] = Number(res.lastInsertRowid);
  }
  console.log(`Seeded ${flats.length} flats.`);

  // 2. Hash default passwords
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const securityHash = bcrypt.hashSync('security123', salt);
  const residentHash = bcrypt.hashSync('resident123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, phone, role, flat_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Admin
  const adminRes = insertUser.run(
    'Admin Manager',
    'admin@apartment.com',
    adminHash,
    '+1 555-0100',
    'admin',
    null
  );
  const adminId = Number(adminRes.lastInsertRowid);

  // Security Guard
  const securityRes = insertUser.run(
    'Ramesh Guard',
    'security@apartment.com',
    securityHash,
    '+1 555-0199',
    'security',
    null
  );
  const securityId = Number(securityRes.lastInsertRowid);

  // Residents
  const residents = [
    {
      name: 'John Doe',
      email: 'john@resident.com',
      flatNumber: '101',
      phone: '+1 555-0101'
    },
    {
      name: 'Priya Sharma',
      email: 'priya@resident.com',
      flatNumber: '102',
      phone: '+1 555-0102'
    },
    {
      name: 'Carlos Gomez',
      email: 'carlos@resident.com',
      flatNumber: '301',
      phone: '+1 555-0103'
    },
    {
      name: 'Emily Watson',
      email: 'emily@resident.com',
      flatNumber: '401',
      phone: '+1 555-0104'
    }
  ];

  const residentMap = {};
  for (const r of residents) {
    const res = insertUser.run(
      r.name,
      r.email,
      residentHash,
      r.phone,
      'resident',
      flatMap[r.flatNumber]
    );
    residentMap[r.email] = Number(res.lastInsertRowid);
  }
  console.log('Seeded users (Admin, Security, Residents).');

  // 3. Visitors
  const insertVisitor = db.prepare(`
    INSERT INTO visitors (name, phone, flat_id, purpose, vehicle_number, entry_time, exit_time, status, registered_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Visitor inside flat 101
  insertVisitor.run(
    'David Miller',
    '9876543210',
    flatMap['101'],
    'Guest / Personal',
    'MH-01-AB-1234',
    new Date(Date.now() - 45 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    'Inside',
    securityId
  );

  // Visitor inside flat 102
  insertVisitor.run(
    'Amazon Delivery - Ravi',
    '9812345678',
    flatMap['102'],
    'Delivery',
    'KA-05-EV-9821',
    new Date(Date.now() - 20 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    'Inside',
    securityId
  );

  // Visitor exited flat 101
  insertVisitor.run(
    'Dr. Anita Roy',
    '9900112233',
    flatMap['101'],
    'Guest / Personal',
    'MH-02-XY-8877',
    new Date(Date.now() - 5 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    new Date(Date.now() - 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    'Exited',
    securityId
  );

  // Visitor exited flat 301
  insertVisitor.run(
    'Urban Company - Electrician',
    '9845012345',
    flatMap['301'],
    'Service / Maintenance',
    null,
    new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    new Date(Date.now() - 22 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    'Exited',
    securityId
  );
  console.log('Seeded sample visitors.');

  // 4. Maintenance Bills
  const insertBill = db.prepare(`
    INSERT INTO maintenance_bills (flat_id, billing_month, amount, due_date, status, payment_date, payment_remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Bill 1: Flat 101, Current month, Pending
  insertBill.run(
    flatMap['101'],
    'October 2026',
    3500.00,
    '2026-10-31',
    'Pending',
    null,
    null
  );

  // Bill 2: Flat 101, Previous month, Paid
  insertBill.run(
    flatMap['101'],
    'September 2026',
    3500.00,
    '2026-09-30',
    'Paid',
    '2026-09-24',
    'Payment recorded by Admin (Net Banking ref: TXN88291)'
  );

  // Bill 3: Flat 102, Current month, Overdue (past due date)
  insertBill.run(
    flatMap['102'],
    'October 2026',
    3500.00,
    '2026-10-15',
    'Overdue',
    null,
    null
  );

  // Bill 4: Flat 201, Current month, Pending
  insertBill.run(
    flatMap['201'],
    'October 2026',
    4200.00,
    '2026-10-31',
    'Pending',
    null,
    null
  );

  // Bill 5: Flat 301, Current month, Paid
  insertBill.run(
    flatMap['301'],
    'October 2026',
    3800.00,
    '2026-10-31',
    'Paid',
    '2026-10-04',
    'Payment recorded by Admin (Cheque #554421)'
  );
  console.log('Seeded maintenance bills.');

  // 5. Complaints
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (resident_id, flat_id, title, category, description, priority, status, admin_response, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // In Progress complaint
  insertComplaint.run(
    residentMap['john@resident.com'],
    flatMap['101'],
    'Kitchen Sink Water Leakage',
    'Plumbing',
    'There is continuous seepage under the kitchen sink cabinet. Requires pipe replacement.',
    'High',
    'In Progress',
    'Apartment plumber inspected the issue. Pipe ordered and will be replaced tomorrow at 10 AM.',
    null
  );

  // Submitted complaint
  insertComplaint.run(
    residentMap['priya@resident.com'],
    flatMap['102'],
    'Corridor Lighting Not Working',
    'Electrical',
    'The 1st floor corridor bulb outside Flat 102 flickers and turns off repeatedly at night.',
    'Medium',
    'Submitted',
    null,
    null
  );

  // Resolved complaint
  insertComplaint.run(
    residentMap['carlos@resident.com'],
    flatMap['301'],
    'Lift B Jerking on 3rd Floor',
    'Lift',
    'Lift B makes abnormal vibrating noise and sudden jerk when stopping at floor 3.',
    'High',
    'Resolved',
    'Annual maintenance contractor inspected the elevator rail alignment. Pulleys lubricated and calibrated.',
    new Date(Date.now() - 48 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19)
  );
  console.log('Seeded complaints.');

  console.log('--- Database Seeding Completed Successfully ---');
}

// If executed directly from command line, force re-seed
if (require.main === module) {
  seed(true);
}

module.exports = {
  seed
};
