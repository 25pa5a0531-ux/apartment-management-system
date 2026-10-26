// Test script to verify all backend API endpoints and authorization rules
process.env.NODE_ENV = 'test';
const app = require('./app');
const http = require('http');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  console.log('--- Starting API Endpoint Verification ---');

  let passed = 0;
  let failed = 0;

  async function request(path, options = {}) {
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

  try {
    // 1. Health check
    const health = await request('/health');
    if (health.status === 200 && health.data.status === 'online') {
      console.log('✔ Health check passed');
      passed++;
    } else {
      console.error('❌ Health check failed', health);
      failed++;
    }

    // 2. Admin Login
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@apartment.com', password: 'admin123' })
    });
    if (adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin') {
      console.log('✔ Admin login passed');
      passed++;
    } else {
      console.error('❌ Admin login failed', adminLogin);
      failed++;
    }
    const adminToken = adminLogin.data?.token;

    // 3. Security Guard Login
    const secLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'security@apartment.com', password: 'security123' })
    });
    if (secLogin.status === 200 && secLogin.data.token && secLogin.data.user.role === 'security') {
      console.log('✔ Security login passed');
      passed++;
    } else {
      console.error('❌ Security login failed', secLogin);
      failed++;
    }
    const secToken = secLogin.data?.token;

    // 4. Resident Login (John Doe - Flat 101)
    const resLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'john@resident.com', password: 'resident123' })
    });
    if (resLogin.status === 200 && resLogin.data.token && resLogin.data.user.role === 'resident') {
      console.log('✔ Resident login passed');
      passed++;
    } else {
      console.error('❌ Resident login failed', resLogin);
      failed++;
    }
    const resToken = resLogin.data?.token;

    // 5. Auth /me endpoint
    const me = await request('/auth/me', {
      headers: { Authorization: `Bearer ${resToken}` }
    });
    if (me.status === 200 && me.data.user.flat_number === '101') {
      console.log('✔ Resident profile /me verified (Flat 101)');
      passed++;
    } else {
      console.error('❌ Resident /me failed', me);
      failed++;
    }

    // 6. Security tries to access maintenance bills (Should be 403 Forbidden)
    const secAccessBills = await request('/maintenance/bills', {
      headers: { Authorization: `Bearer ${secToken}` }
    });
    if (secAccessBills.status === 403) {
      console.log('✔ Authorization check passed: Security cannot access maintenance bills (403)');
      passed++;
    } else {
      console.error('❌ Security unauthorized access check failed', secAccessBills);
      failed++;
    }

    // 7. Resident views visitor history (Enforces only their flat's visitors)
    const resVisitors = await request('/visitors', {
      headers: { Authorization: `Bearer ${resToken}` }
    });
    if (resVisitors.status === 200 && Array.isArray(resVisitors.data.visitors)) {
      const allForOwnFlat = resVisitors.data.visitors.every(v => v.flat_number === '101');
      if (allForOwnFlat) {
        console.log(`✔ Resident data isolation passed: John Doe sees only Flat 101 visitors (${resVisitors.data.visitors.length} records)`);
        passed++;
      } else {
        console.error('❌ Resident visitor data isolation breached!');
        failed++;
      }
    } else {
      console.error('❌ Resident visitors query failed', resVisitors);
      failed++;
    }

    // 8. Security registers a new visitor
    const newVis = await request('/visitors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secToken}` },
      body: JSON.stringify({
        name: 'Test Visitor Mark',
        phone: '9123456789',
        flat_number: '101',
        purpose: 'Delivery',
        vehicle_number: 'KA-01-AB-9999'
      })
    });
    if (newVis.status === 201 && newVis.data.visitor?.status === 'Inside') {
      console.log('✔ Security registered new visitor successfully');
      passed++;
    } else {
      console.error('❌ Security register visitor failed', newVis);
      failed++;
    }
    const newVisitorId = newVis.data?.visitor?.id;

    // 9. Security checks out visitor
    const checkout = await request(`/visitors/${newVisitorId}/checkout`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${secToken}` }
    });
    if (checkout.status === 200 && checkout.data.visitor?.status === 'Exited') {
      console.log('✔ Security checked out visitor successfully');
      passed++;
    } else {
      console.error('❌ Security checkout visitor failed', checkout);
      failed++;
    }

    // 10. Admin generates maintenance bill
    const newBill = await request('/maintenance/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        flat_id: 1, // Flat 101
        billing_month: 'November 2026',
        amount: 3600,
        due_date: '2026-11-15'
      })
    });
    if (newBill.status === 201 && newBill.data.bill?.amount === 3600) {
      console.log('✔ Admin generated maintenance bill successfully');
      passed++;
    } else {
      console.error('❌ Admin generate bill failed', newBill);
      failed++;
    }
    const createdBillId = newBill.data?.bill?.id;

    // 11. Admin records payment for the bill
    const payBill = await request(`/maintenance/bills/${createdBillId}/pay`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        payment_date: '2026-10-26',
        payment_remarks: 'Verified online payment via Cheque #991122'
      })
    });
    if (payBill.status === 200 && payBill.data.bill?.status === 'Paid') {
      console.log('✔ Admin recorded maintenance payment successfully');
      passed++;
    } else {
      console.error('❌ Admin payment record failed', payBill);
      failed++;
    }

    // 12. Resident submits a complaint
    const newComplaint = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resToken}` },
      body: JSON.stringify({
        title: 'Balcony Door Jammed',
        category: 'Other',
        description: 'The sliding balcony door is stuck and requires lubricant and alignment.',
        priority: 'Medium'
      })
    });
    if (newComplaint.status === 201 && newComplaint.data.complaint?.status === 'Submitted') {
      console.log('✔ Resident submitted maintenance complaint successfully');
      passed++;
    } else {
      console.error('❌ Resident complaint submission failed', newComplaint);
      failed++;
    }
    const createdComplaintId = newComplaint.data?.complaint?.id;

    // 13. Admin updates complaint status and adds response note
    const updateComplaint = await request(`/complaints/${createdComplaintId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'In Progress',
        admin_response: 'Carpenter scheduled to visit Flat 101 tomorrow at 2:00 PM.'
      })
    });
    if (updateComplaint.status === 200 && updateComplaint.data.complaint?.status === 'In Progress') {
      console.log('✔ Admin updated complaint status and response note');
      passed++;
    } else {
      console.error('❌ Admin complaint update failed', updateComplaint);
      failed++;
    }

    // 14. Dashboard stats for Admin
    const adminStats = await request('/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminStats.status === 200 && adminStats.data.stats?.totalFlats > 0) {
      console.log('✔ Admin dashboard statistics verified');
      passed++;
    } else {
      console.error('❌ Admin dashboard stats failed', adminStats);
      failed++;
    }

  } catch (err) {
    console.error('Error in test run:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n--- Test Summary: ${passed} passed, ${failed} failed ---`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
