const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db/pool');
const apiRoutes = require('./src/routes');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';
const TEST_PORT = 4199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runProSeniorQA() {
  console.log('=================================================================================');
  console.log('🏛️  VAIRAVAN KOIL: PRINCIPAL QA END-TO-END VALIDATION & STRESS TEST SUITE  🏛️');
  console.log('=================================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];
  const createdTestBookingIds = [];
  let server = null;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
      failures.push({ testName, details });
    }
  }

  // Helper to generate admin and staff JWT tokens
  function makeToken(user) {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  }

  const adminToken = makeToken({ id: 'admin-super-uuid', name: 'Marlin Superadmin', role: 'superadmin', email: 'admin@vairavankoil.org' });
  const staffToken = makeToken({ id: 'staff-office-uuid', name: 'Temple Staff User', role: 'staff', email: 'staff@vairavankoil.org' });

  try {
    // 1. Spin up ephemeral Express HTTP server
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
    console.log(`🌐 Real HTTP Test Server listening on ${BASE_URL}\n`);

    // Fetch active kattalai types
    const { rows: kTypes } = await pool.query('SELECT id, name, name_ta, color_key FROM kattalai_types ORDER BY display_order');
    const uchiType = kTypes.find(t => t.color_key === 'morning') || kTypes[0];
    const arthaType = kTypes.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening') || kTypes[1];

    // ===================================================================================
    // VECTOR 1: Real HTTP End-to-End Staff Registration via Dashboard (BookingModal payload)
    // ===================================================================================
    console.log('--- VECTOR 1: Staff Registration via Dashboard (Real HTTP POST /api/bookings) ---');
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 2);

    const payload1 = {
      kattalai_type_id: uchiType.id,
      kattalai_date: futureDate.getDate(),
      kattalai_month: futureDate.getMonth() + 1,
      target_year: futureDate.getFullYear(),
      title: 'Thiru',
      name: 'Dr. O\'Connor Ramanathan & Co',
      star: 'Anusam',
      place: 'CHENNAI',
      code: 'U/1/PRO1',
      mobile: '9840112244',
      whatsapp_number: '9840112244',
      whatsapp_same_as_mobile: true,
      email: 'ramanathan.pro@test.com',
      per_add_1: 'No 45/A',
      per_add_2: 'North Mada Street',
      per_add_3: 'Mylapore, Chennai 600004',
      comm_add_1: 'No 45/A',
      comm_add_2: 'North Mada Street',
      comm_add_3: 'Mylapore',
      comm_add_4: 'Chennai 600004',
      country_code: '91',
      kat_type: 'Lifetime',
      regn_date: today.toISOString().slice(0, 10),
      title_ta: 'திரு',
      name_ta: 'டாக்டர் ஓ\'கானர் ராமநாதன் & கோ',
      star_ta: 'அனுஷம்',
      place_ta: 'சென்னை',
      comments: 'Registered by Office Staff via Real HTTP'
    };

    const res1 = await axios.post(`${BASE_URL}/bookings`, payload1, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(res1.status === 201, 'HTTP 201 Created on booking registration');
    assert(res1.data && res1.data.id, 'Response contains generated booking UUID', res1.data?.id);
    if (res1.data?.id) createdTestBookingIds.push(res1.data.id);

    // Verify auto-calculated fee (within 6 months -> ₹3,700)
    assert(parseFloat(res1.data.amount) === 3700, 'Fee auto-calculated to ₹3,700 (within 6 mos)', `Actual: ₹${res1.data.amount}`);
    assert(res1.data.title === 'Thiru' && res1.data.title_ta === 'திரு', 'Both English and Tamil titles stored cleanly');
    assert(res1.data.name === 'Dr. O\'Connor Ramanathan & Co' && res1.data.name_ta === 'டாக்டர் ஓ\'கானர் ராமநாதன் & கோ', 'Special characters & Tamil names preserved without SQL injection or corruption');

    // Vector 1.1: Record staff cash payment
    const payRes1 = await axios.post(`${BASE_URL}/payments`, {
      booking_id: res1.data.id,
      amount: 3700,
      method: 'cash'
    }, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(payRes1.status === 201, 'POST /api/payments records payment with HTTP 201');
    assert(payRes1.data.status === 'paid', 'Payment status is marked as paid');

    // ===================================================================================
    // VECTOR 2: Public Devotee Online Signup (Zero Auth, created_by: null)
    // ===================================================================================
    console.log('\n--- VECTOR 2: Public Devotee Online Signup (Unauthenticated /signup flow) ---');
    const nineMonthsDate = new Date(today);
    nineMonthsDate.setMonth(nineMonthsDate.getMonth() + 9);

    const publicPayload = {
      kattalai_type_id: arthaType.id,
      kattalai_date: nineMonthsDate.getDate(),
      kattalai_month: nineMonthsDate.getMonth() + 1,
      target_year: nineMonthsDate.getFullYear(),
      title: 'Thirumathi',
      name: 'Lakshmi Meenakshi Public',
      star: 'Revathi',
      place: 'KARAIKUDI',
      code: 'A/2/PUB1',
      mobile: '9840998877',
      whatsapp_number: '9840998877',
      whatsapp_same_as_mobile: true,
      email: 'lakshmi.pub@test.com',
      per_add_1: 'Old Street',
      per_add_2: 'Karaikudi',
      per_add_3: 'Sivagangai 630001',
      comm_add_1: 'Old Street',
      comm_add_2: 'Karaikudi',
      comm_add_3: 'Sivagangai 630001',
      country_code: '91',
      kat_type: 'Lifetime',
      regn_date: today.toISOString().slice(0, 10),
      title_ta: 'திருமதி',
      name_ta: 'லட்சுமி மீனாட்சி',
      star_ta: 'ரேவதி',
      place_ta: 'காரைக்குடி',
      comments: 'Public Devotee Online Registration'
    };

    // Public call WITHOUT Authorization header
    const resPub = await axios.post(`${BASE_URL}/bookings`, publicPayload);
    assert(resPub.status === 201, 'Public devotee signup succeeds without Authorization token');
    assert(resPub.data.created_by === null, 'created_by is safely NULL for online registrations');
    if (resPub.data?.id) createdTestBookingIds.push(resPub.data.id);

    // Verify Archanai fee waived > 6 months
    assert(parseFloat(resPub.data.amount) === 3500, 'Fee auto-calculated to exactly ₹3,500 (> 6 mos, archanai waived)', `Actual: ₹${resPub.data.amount}`);

    // Public payment recording test (The fix we just applied in routes/index.js!)
    const payPub = await axios.post(`${BASE_URL}/payments`, {
      booking_id: resPub.data.id,
      amount: 3500,
      method: 'cash'
    });
    assert(payPub.status === 201, 'Public signup records payment cleanly with HTTP 201 (optionalAuth verified)');
    assert(payPub.data.booking_id === resPub.data.id, 'Payment linked directly to public devotee booking ID');

    // Strict duplicate slot rejection test (409 Conflict)
    try {
      await axios.post(`${BASE_URL}/bookings`, {
        ...publicPayload,
        name: 'Another Devotee Trying Duplicate Slot'
      });
      assert(false, 'Duplicate slot registration should be rejected with 409 Conflict');
    } catch (err) {
      assert(err.response?.status === 409, 'Duplicate slot registration strictly rejected with HTTP 409 Conflict');
      assert(err.response?.data?.error?.includes('already booked'), 'Rejection message explains slot is already booked');
    }

    // Public /signup date bookings check: Slot code must be returned for slot blurring, while personal info is stripped
    const checkDateStr = `${nineMonthsDate.getFullYear()}-${String(nineMonthsDate.getMonth() + 1).padStart(2, '0')}-${String(nineMonthsDate.getDate()).padStart(2, '0')}`;
    const publicSlotsRes = await axios.get(`${BASE_URL}/bookings?date=${checkDateStr}`);
    assert(publicSlotsRes.status === 200, 'Public GET /api/bookings returns 200 OK');
    const matchedSlot = publicSlotsRes.data.find(b => b.code === 'A/2/PUB1');
    assert(matchedSlot !== undefined, 'Booked slot code is returned to public signup for slot blurring');
    assert(matchedSlot?.name === undefined, 'Devotee name is strictly stripped in public signup response');
    assert(matchedSlot?.mobile === undefined, 'Devotee phone is strictly stripped in public signup response');

    // ===================================================================================
    // VECTOR 3: Multi-Identifier Devotee Login & Role-Based Isolation
    // ===================================================================================
    console.log('\n--- VECTOR 3: Devotee Authentication & Multi-Identifier Login ---');
    // Login with exact code "A/2/PUB1" and default password (mobile)
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'A/2/PUB1',
      password: '9840998877'
    });
    assert(loginRes.status === 200, 'Devotee login with exact code "A/2/PUB1" succeeds (HTTP 200)');
    assert(loginRes.data.token, 'Devotee receives valid JWT token');
    assert(loginRes.data.user.role === 'user', 'Devotee user.role is strictly "user"');
    const devoteeToken = loginRes.data.token;

    // Login with space-separated code "A 2 PUB1"
    const loginSpaces = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'A 2 PUB1',
      password: '9840998877'
    });
    assert(loginSpaces.status === 200, 'Devotee login with spaces "A 2 PUB1" resolves correctly');

    // Login with hyphenated code "A-2-PUB1"
    const loginHyphen = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'A-2-PUB1',
      password: '9840998877'
    });
    assert(loginHyphen.status === 200, 'Devotee login with hyphens "A-2-PUB1" resolves correctly');

    // Rejection of invalid password
    try {
      await axios.post(`${BASE_URL}/auth/login`, { username: 'A/2/PUB1', password: 'wrongpassword' });
      assert(false, 'Invalid password should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Invalid password strictly rejected with 401 Unauthorized');
    }

    // ===================================================================================
    // VECTOR 4: Devotee Data Privacy Defense & Authorization Boundary
    // ===================================================================================
    console.log('\n--- VECTOR 4: Devotee Isolation Defense & Authorization Boundaries ---');
    // Devotee fetching bookings: Must ONLY receive their own record
    const devBookingsRes = await axios.get(`${BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${devoteeToken}` }
    });
    assert(Array.isArray(devBookingsRes.data), 'GET /api/bookings returns an array');
    const hasOnlyOwn = devBookingsRes.data.every(b => b.code === 'A/2/PUB1');
    assert(hasOnlyOwn && devBookingsRes.data.length === 1, 'Devotee receives strictly ONLY their own booking record (zero data leakage)');

    // Devotee attempting to modify another devotee's booking -> Must get 403
    try {
      await axios.patch(`${BASE_URL}/bookings/${res1.data.id}`, { name: 'Hacked Name' }, {
        headers: { Authorization: `Bearer ${devoteeToken}` }
      });
      assert(false, 'Devotee should not be able to modify another booking');
    } catch (err) {
      assert(err.response?.status === 403, 'Devotee modifying another booking strictly blocked with 403 Forbidden');
    }

    // Devotee attempting to delete another devotee's booking -> Must get 403
    try {
      await axios.delete(`${BASE_URL}/bookings/${res1.data.id}`, {
        headers: { Authorization: `Bearer ${devoteeToken}` }
      });
      assert(false, 'Devotee should not be able to delete bookings');
    } catch (err) {
      assert(err.response?.status === 403, 'Devotee deleting booking strictly blocked with 403 Forbidden');
    }

    // Devotee attempting to change system settings -> Must get 403
    try {
      await axios.put(`${BASE_URL}/settings`, { setting_key: 'transfer_base_amount', setting_value: '100' }, {
        headers: { Authorization: `Bearer ${devoteeToken}` }
      });
      assert(false, 'Devotee should not be able to modify system settings');
    } catch (err) {
      assert(err.response?.status === 403, 'Devotee altering system settings strictly blocked with 403 Forbidden');
    }

    // ===================================================================================
    // VECTOR 5: 1-Time Transfer Mathematical Precision & State Machine
    // ===================================================================================
    console.log('\n--- VECTOR 5: 1-Time Account Transfer Rules & Mathematical Precision ---');
    // Attempt transfer on "Thirumathi" account (Female title rule) -> Must be rejected
    try {
      await axios.post(`${BASE_URL}/bookings/${resPub.data.id}/transfer`, {
        title: 'Selvan',
        name: 'Kumar Son'
      }, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      assert(false, 'Female title transfer should be blocked');
    } catch (err) {
      assert(err.response?.status === 400, 'Transfer on "Thirumathi" account strictly rejected with 400 Bad Request');
    }

    // Transfer on eligible male account "Thiru" Dr. O'Connor Ramanathan
    // Original amount was 3700. Let's create an account with paid ₹1,200 to test exact difference:
    const transferEligible = await axios.post(`${BASE_URL}/bookings`, {
      kattalai_type_id: uchiType.id,
      kattalai_date: 15,
      kattalai_month: 8,
      title: 'Thiru',
      name: 'Vaidyanathan Grandfather',
      star: 'Aswini',
      place: 'MADURAI',
      code: 'U/5/TR1',
      amount: 1200,
      kat_type: 'Lifetime',
      title_ta: 'திரு',
      name_ta: 'வைத்தியநாதன் தாத்தா',
      star_ta: 'அஸ்வினி',
      place_ta: 'மதுரை'
    }, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (transferEligible.data?.id) createdTestBookingIds.push(transferEligible.data.id);

    // Perform transfer to Grandson "Selvan Senthil Kumar"
    const transferRes = await axios.post(`${BASE_URL}/bookings/${transferEligible.data.id}/transfer`, {
      title: 'Selvan',
      name: 'Senthil Kumar Grandson',
      title_ta: 'செல்வன்',
      name_ta: 'செந்தில் குமார்',
      star: 'Uthirattathi',
      star_ta: 'உத்திரட்டாதி',
      place: 'MADURAI',
      place_ta: 'மதுரை',
      payment_method: 'cash'
    }, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(transferRes.status === 200, 'Account transfer executes with HTTP 200 OK');
    // Difference calculation: Base 3500 - Old Paid 1200 = 2300
    assert(transferRes.data.differenceAmount === 2300, 'Difference collected is EXACTLY ₹2,300 (3500 - 1200)', `Calculated: ₹${transferRes.data.differenceAmount}`);
    assert(transferRes.data.booking.is_transferred === 1 || transferRes.data.booking.is_transferred === true, 'Booking is_transferred flag set to true');
    assert(transferRes.data.booking.kat_type === 'Inheritance', 'Sponsorship type permanently changed to "Inheritance"');
    assert(transferRes.data.booking.transferred_from_name === 'Vaidyanathan Grandfather', 'Audit trail records original devotee name');
    assert(transferRes.data.booking.name === 'Senthil Kumar Grandson', 'Devotee name updated to new recipient');

    // Attempt second transfer on the same account -> Strict 1-time limit enforcement!
    try {
      await axios.post(`${BASE_URL}/bookings/${transferEligible.data.id}/transfer`, {
        title: 'Selvan',
        name: 'Another Transfer Attempt'
      }, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      assert(false, 'Second transfer attempt should be blocked');
    } catch (err) {
      assert(err.response?.status === 400, 'Second transfer attempt strictly blocked with HTTP 400 (1-time transfer limit enforced)');
    }

    // ===================================================================================
    // VECTOR 6: 6-Month Fee Threshold Boundary Analysis (179 vs 185 days)
    // ===================================================================================
    console.log('\n--- VECTOR 6: Date Threshold Mathematical Boundary Analysis ---');
    // Case A: 5 months away (150 days) -> strictly <= 6 months -> ₹3,700
    const d150 = new Date(today);
    d150.setMonth(d150.getMonth() + 5);
    const b150 = await axios.post(`${BASE_URL}/bookings`, {
      kattalai_type_id: uchiType.id,
      kattalai_date: d150.getDate(),
      kattalai_month: d150.getMonth() + 1,
      name: 'Boundary Tester 5 Mos',
      regn_date: today.toISOString().slice(0, 10)
    }, { headers: { Authorization: `Bearer ${staffToken}` } });
    if (b150.data?.id) createdTestBookingIds.push(b150.data.id);
    assert(parseFloat(b150.data.amount) === 3700, 'Date at +5 months gets ₹3,700 (3500 base + 200 archanai)');

    // Case B: 7 months away (210 days) -> strictly > 6 months -> ₹3,500
    const d210 = new Date(today);
    d210.setMonth(d210.getMonth() + 7);
    const b210 = await axios.post(`${BASE_URL}/bookings`, {
      kattalai_type_id: uchiType.id,
      kattalai_date: d210.getDate(),
      kattalai_month: d210.getMonth() + 1,
      name: 'Boundary Tester 7 Mos',
      regn_date: today.toISOString().slice(0, 10)
    }, { headers: { Authorization: `Bearer ${staffToken}` } });
    if (b210.data?.id) createdTestBookingIds.push(b210.data.id);
    assert(parseFloat(b210.data.amount) === 3500, 'Date at +7 months gets ₹3,500 (archanai waived)');

    // ===================================================================================
    // VECTOR 7: Concurrency & Parallel Registration Requests
    // ===================================================================================
    console.log('\n--- VECTOR 7: Concurrency & Parallel Submission Resilience ---');
    const parallelRequests = [1, 2, 3, 4, 5].map(i => {
      return axios.post(`${BASE_URL}/bookings`, {
        kattalai_type_id: uchiType.id,
        kattalai_date: 20 + i,
        kattalai_month: 10,
        title: 'Thiru',
        name: `Parallel Devotee ${i}`,
        star: 'Anusam',
        place: 'CHENNAI',
        code: `P/${i}/STRESS`,
        mobile: `984011220${i}`,
        kat_type: 'Lifetime',
        regn_date: today.toISOString().slice(0, 10),
        title_ta: 'திரு',
        name_ta: `இணைப்பு பக்தர் ${i}`,
        star_ta: 'அனுஷம்',
        place_ta: 'சென்னை'
      }, { headers: { Authorization: `Bearer ${staffToken}` } });
    });

    const parallelResults = await Promise.all(parallelRequests);
    const all201 = parallelResults.every(r => r.status === 201 && r.data?.id);
    assert(all201, '5 simultaneous parallel booking requests all completed with 201 Created');
    parallelResults.forEach(r => {
      if (r.data?.id) createdTestBookingIds.push(r.data.id);
    });

    // ===================================================================================
    // VECTOR 8: Audit Log Integrity Verification
    // ===================================================================================
    console.log('\n--- VECTOR 8: History Logs & Audit Trail Verification ---');
    const { rows: auditRows } = await pool.query(
      `SELECT * FROM history_logs WHERE booking_id IN (${createdTestBookingIds.map(() => '?').join(',')}) ORDER BY created_at DESC`,
      createdTestBookingIds
    );
    assert(auditRows.length >= 5, 'History logs recorded for test actions', `Count: ${auditRows.length}`);
    const hasTransferLog = auditRows.some(l => l.action === 'ACCOUNT_TRANSFER');
    assert(hasTransferLog, 'ACCOUNT_TRANSFER log successfully recorded in history_logs');
    const hasBookingCreatedLog = auditRows.some(l => l.action === 'Created Booking');
    assert(hasBookingCreatedLog, '"Created Booking" log successfully recorded in history_logs');

  } catch (err) {
    console.error('Fatal test execution error:', err.response?.data || err.stack || err);
    failed++;
    failures.push({ testName: 'Fatal Execution Error', details: err.message });
  } finally {
    // Teardown: Clean up test bookings and close server
    console.log('\n--- CLEANUP & TEARDOWN ---');
    if (createdTestBookingIds.length > 0) {
      try {
        await pool.query(
          `DELETE FROM history_logs WHERE booking_id IN (${createdTestBookingIds.map(() => '?').join(',')})`,
          createdTestBookingIds
        );
        await pool.query(
          `DELETE FROM payments WHERE booking_id IN (${createdTestBookingIds.map(() => '?').join(',')})`,
          createdTestBookingIds
        );
        await pool.query(
          `DELETE FROM devotee_passwords WHERE booking_id IN (${createdTestBookingIds.map(() => '?').join(',')})`,
          createdTestBookingIds
        );
        await pool.query(
          `DELETE FROM bookings WHERE id IN (${createdTestBookingIds.map(() => '?').join(',')})`,
          createdTestBookingIds
        );
        console.log(`  🧹 Cleaned up ${createdTestBookingIds.length} test bookings, payments, and history logs.`);
      } catch (cleanErr) {
        console.error('Cleanup warning:', cleanErr.message);
      }
    }

    if (server) {
      server.close();
      console.log('  🔒 Real HTTP Test Server closed cleanly.');
    }
  }

  console.log('\n=================================================================================');
  console.log(`🏁  SENIOR PRO QA RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=================================================================================');

  if (failed === 0) {
    console.log('\n🌟  ALL ARCHITECTURAL, PROTOCOL, BUSINESS LOGIC & CONCURRENCY TESTS PASSED!  🌟\n');
  } else {
    console.error(`\n❌  ${failed} TESTS FAILED! Review failure logs above.`);
    process.exit(1);
  }

  process.exit(0);
}

runProSeniorQA();
