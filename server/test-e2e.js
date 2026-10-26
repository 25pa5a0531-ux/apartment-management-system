// Complete End-to-End Workflow & Authorization Test Suite
process.env.NODE_ENV = 'test';
const app = require('./app');
const http = require('http');

async function runE2E() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098/api';

  console.log('========================================================');
  console.log('   Starting Apartment Management E2E Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  async function req(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // Workflow 1: Admin logs in and manages flats and residents
    // -----------------------------------------------------------------
    console.log('--- Workflow 1: Admin Authentication & Flat/Resident Management ---');
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@apartment.com', password: 'admin123' })
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin successfully authenticated');
    const adminToken = adminLogin.data.token;

    // Admin creates flat 501
    const createFlatRes = await req('/flats', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ flat_number: '501', block: 'Tower C', floor: 5, status: 'Vacant' })
    });
    assert(createFlatRes.status === 201 && createFlatRes.data.flat.flat_number === '501', 'Admin created Flat 501');
    const flat501Id = createFlatRes.data.flat.id;

    // Admin registers a new resident for flat 501
    const createResidentRes = await req('/users/residents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah@resident.com',
        password: 'resident123',
        phone: '+1 555-0501',
        flat_id: flat501Id
      })
    });
    assert(createResidentRes.status === 201 && createResidentRes.data.resident.email === 'sarah@resident.com', 'Admin registered resident Sarah Connor for Flat 501');

    // -----------------------------------------------------------------
    // Workflow 2: Security guard registers visitor and records checkout
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 2: Security Guard Visitor Registration & Checkout ---');
    const secLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'security@apartment.com', password: 'security123' })
    });
    assert(secLogin.status === 200 && secLogin.data.user.role === 'security', 'Security guard authenticated');
    const secToken = secLogin.data.token;

    // Security registers visitor for flat 501
    const regVisitorRes = await req('/visitors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secToken}` },
      body: JSON.stringify({
        name: 'Kyle Reese',
        phone: '9888776655',
        flat_id: flat501Id,
        purpose: 'Guest / Personal',
        vehicle_number: 'TN-09-XY-4321'
      })
    });
    assert(regVisitorRes.status === 201 && regVisitorRes.data.visitor.status === 'Inside', 'Security registered visitor Kyle Reese (Status: Inside)');
    const visitorKyleId = regVisitorRes.data.visitor.id;

    // Verify inside list contains Kyle
    const insideRes = await req('/visitors/inside', {
      headers: { Authorization: `Bearer ${secToken}` }
    });
    const foundInside = insideRes.data.visitors.some(v => v.id === visitorKyleId);
    assert(insideRes.status === 200 && foundInside, 'Visitor Kyle Reese appears in active inside list');

    // Security records exit
    const checkoutRes = await req(`/visitors/${visitorKyleId}/checkout`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${secToken}` }
    });
    assert(checkoutRes.status === 200 && checkoutRes.data.visitor.status === 'Exited' && checkoutRes.data.visitor.exit_time, 'Security successfully recorded visitor departure (Status: Exited with timestamp)');

    // -----------------------------------------------------------------
    // Workflow 3: Resident views their own visitor history
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 3: Resident Visitor Data Isolation ---');
    const sarahLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sarah@resident.com', password: 'resident123' })
    });
    assert(sarahLogin.status === 200 && sarahLogin.data.user.role === 'resident', 'Resident Sarah Connor logged in');
    const sarahToken = sarahLogin.data.token;

    const sarahVisitors = await req('/visitors', {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    assert(sarahVisitors.status === 200, 'Resident fetched visitor history');
    const allSarahFlats = sarahVisitors.data.visitors.every(v => v.flat_id === flat501Id);
    assert(allSarahFlats && sarahVisitors.data.visitors.length === 1, 'Resident sees ONLY Flat 501 visitors (Zero records from other flats leaked)');

    // -----------------------------------------------------------------
    // Workflow 4: Admin generates a maintenance bill
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 4: Admin Generates Maintenance Bill ---');
    const genBillRes = await req('/maintenance/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        flat_id: flat501Id,
        billing_month: 'December 2026',
        amount: 4500.00,
        due_date: '2026-12-31'
      })
    });
    assert(genBillRes.status === 201 && genBillRes.data.bill.amount === 4500, 'Admin generated bill of ₹4,500 for Flat 501');
    const bill501Id = genBillRes.data.bill.id;

    // -----------------------------------------------------------------
    // Workflow 5: Resident views the bill
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 5: Resident Views Their Maintenance Bills ---');
    const sarahBills = await req('/maintenance/bills', {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    assert(sarahBills.status === 200, 'Resident fetched maintenance bills');
    const foundSarahBill = sarahBills.data.bills.find(b => b.id === bill501Id);
    assert(foundSarahBill && foundSarahBill.status === 'Pending' && foundSarahBill.amount === 4500, 'Resident sees generated bill with status: Pending');

    // -----------------------------------------------------------------
    // Workflow 6: Admin records payment
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 6: Admin Records Offline Payment ---');
    const payRes = await req(`/maintenance/bills/${bill501Id}/pay`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        payment_date: '2026-10-26',
        payment_remarks: 'Verified bank transfer Ref #NEFT990011'
      })
    });
    assert(payRes.status === 200 && payRes.data.bill.status === 'Paid', 'Admin recorded payment successfully');

    // Resident re-verifies bill status
    const sarahBillsAfter = await req('/maintenance/bills', {
      headers: { Authorization: `Bearer ${sarahToken}` }
    });
    const paidSarahBill = sarahBillsAfter.data.bills.find(b => b.id === bill501Id);
    assert(paidSarahBill && paidSarahBill.status === 'Paid' && paidSarahBill.payment_date === '2026-10-26', 'Resident re-check confirms bill status updated to Paid with payment date');

    // -----------------------------------------------------------------
    // Workflow 7: Resident submits a complaint
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 7: Resident Submits Maintenance Complaint ---');
    const submitComplaintRes = await req('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sarahToken}` },
      body: JSON.stringify({
        title: 'Entrance intercom not ringing',
        category: 'Electrical',
        description: 'Visitors ringing Flat 501 intercom do not connect to handset.',
        priority: 'High'
      })
    });
    assert(submitComplaintRes.status === 201 && submitComplaintRes.data.complaint.status === 'Submitted', 'Resident submitted complaint ticket (Status: Submitted, Priority: High)');
    const complaintSarahId = submitComplaintRes.data.complaint.id;

    // -----------------------------------------------------------------
    // Workflow 8: Admin updates complaint status and response note
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 8: Admin Resolves Complaint ---');
    const updateCmpRes = await req(`/complaints/${complaintSarahId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'In Progress',
        admin_response: 'Electrician dispatched to check intercom wire connection.'
      })
    });
    assert(updateCmpRes.status === 200 && updateCmpRes.data.complaint.status === 'In Progress', 'Admin updated status to In Progress with response note');

    // Admin resolves complaint
    const resolveCmpRes = await req(`/complaints/${complaintSarahId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'Resolved',
        admin_response: 'Intercom wire reconnected and audio tested with resident.'
      })
    });
    assert(resolveCmpRes.status === 200 && resolveCmpRes.data.complaint.status === 'Resolved' && resolveCmpRes.data.complaint.resolved_at, 'Admin marked complaint as Resolved with resolution timestamp');

    // -----------------------------------------------------------------
    // Workflow 9: Security & Authorization Enforcements
    // -----------------------------------------------------------------
    console.log('\n--- Workflow 9: Server-Side Authorization Boundary Checks ---');

    // 9a: Resident cannot create a flat
    const unauthFlat = await req('/flats', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sarahToken}` },
      body: JSON.stringify({ flat_number: '999', block: 'Tower Z', floor: 9 })
    });
    assert(unauthFlat.status === 403, 'Resident blocked from creating flats (403 Forbidden)');

    // 9b: Security guard cannot access financial maintenance bills
    const unauthSecBills = await req('/maintenance/bills', {
      headers: { Authorization: `Bearer ${secToken}` }
    });
    assert(unauthSecBills.status === 403, 'Security blocked from maintenance financial bills (403 Forbidden)');

    // 9c: Security guard cannot view complaints
    const unauthSecCmp = await req('/complaints', {
      headers: { Authorization: `Bearer ${secToken}` }
    });
    assert(unauthSecCmp.status === 403, 'Security blocked from complaint helpdesk (403 Forbidden)');

    // 9d: Resident cannot record payment for bills
    const unauthPay = await req(`/maintenance/bills/${bill501Id}/pay`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sarahToken}` },
      body: JSON.stringify({ payment_date: '2026-10-26' })
    });
    assert(unauthPay.status === 403, 'Resident blocked from marking bills as paid (403 Forbidden)');

    // 9e: Request without token is rejected
    const noToken = await req('/visitors');
    assert(noToken.status === 401, 'Unauthenticated request rejected (401 Unauthorized)');

  } catch (err) {
    console.error('E2E run exception:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n========================================================`);
    console.log(`  E2E Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runE2E();
