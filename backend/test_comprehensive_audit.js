const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./src/db/pool');
const { importPanchangamFile, healRowValues } = require('./import_panchangam');
const settingsController = require('./src/controllers/settingsController');
const bookingsController = require('./src/controllers/bookingsController');

const API_BASE = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';

async function runMasterAudit() {
  console.log('========================================================================');
  console.log('🏛️  VAIRAVAN KOIL APP: COMPREHENSIVE PRODUCTION & LOGIC AUDIT SUITE  🏛️');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${message} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message} ${details ? `(${details})` : ''}`);
      failed++;
      failures.push({ message, details });
    }
  }

  // Fetch real staff accounts to satisfy foreign key constraints
  const { rows: realUsers } = await pool.query('SELECT id, email, role, name FROM users');
  const realSuper = realUsers.find(u => u.role === 'superadmin') || realUsers[0];
  const realAdmin = realUsers.find(u => u.role === 'admin') || realUsers[0];
  const realUlthurai = realUsers.find(u => u.role === 'ulthurai') || realUsers[0];

  const superadminToken = jwt.sign({ id: realSuper.id, username: realSuper.email, role: 'superadmin', name: realSuper.name }, JWT_SECRET);
  const adminToken = jwt.sign({ id: realAdmin.id, username: realAdmin.email, role: 'admin', name: realAdmin.name }, JWT_SECRET);
  const ulthuraiToken = jwt.sign({ id: realUlthurai.id, username: realUlthurai.email, role: 'ulthurai', name: realUlthurai.name }, JWT_SECRET);

  const superadminHeaders = { headers: { Authorization: `Bearer ${superadminToken}` } };
  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
  const ulthuraiHeaders = { headers: { Authorization: `Bearer ${ulthuraiToken}` } };

  // Set READ COMMITTED to avoid REPEATABLE READ snapshot lag in MySQL
  await pool.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await pool.query('DELETE FROM devotee_passwords');

  // ========================================================================
  // PHASE 1: DATABASE INTEGRITY & CORE SCHEMAS
  // ========================================================================
  console.log('\n--- [PHASE 1] Database Tables, Columns & Constraints ---');
  try {
    const { rows: tables } = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const requiredTables = [
      'bookings', 'kattalai_types', 'panchangam', 'users', 'history_logs',
      'system_settings', 'yearly_booking_records', 'devotee_passwords', 'bug_reports'
    ];
    for (const tbl of requiredTables) {
      assert(tableNames.includes(tbl), `Required table '${tbl}' exists in database`);
    }

    // Verify devotee_passwords columns
    const { rows: dpCols } = await pool.query('DESCRIBE devotee_passwords');
    const dpFields = dpCols.map(c => c.Field);
    assert(dpFields.includes('booking_id'), 'devotee_passwords has booking_id column');
    assert(dpFields.includes('password_hash'), 'devotee_passwords has password_hash column');
    assert(dpFields.includes('is_custom_password'), 'devotee_passwords has is_custom_password column');

    // Verify bug_reports columns
    const { rows: brCols } = await pool.query('DESCRIBE bug_reports');
    const brFields = brCols.map(c => c.Field);
    assert(brFields.includes('title'), 'bug_reports has title column');
    assert(brFields.includes('description'), 'bug_reports has description column');
    assert(brFields.includes('status'), 'bug_reports has status column');
    assert(brFields.includes('screenshot_urls'), 'bug_reports has screenshot_urls column');
    assert(brFields.includes('user_role'), 'bug_reports has user_role column');
  } catch (err) {
    assert(false, 'Phase 1 schema verification failed', err.message);
  }

  // ========================================================================
  // PHASE 2: PANCHANGAM ENGINE & AUTO-HEALING CSV
  // ========================================================================
  console.log('\n--- [PHASE 2] Panchangam Engine & Auto-Healing CSV Parser ---');
  try {
    const sep24 = await axios.get(`${API_BASE}/panchangam/2026-09-24`);
    assert(sep24.status === 200, 'GET /api/panchangam/2026-09-24 returns 200 OK');
    assert(sep24.data.tamil_month?.includes('புரட்டா'), 'tamil_month contains Purattasi/புரட்டாதி');
    assert(sep24.data.tamil_day_number === 13, 'tamil_day_number is 13');
    assert(sep24.data.worship_note?.includes('சிவனை'), 'worship_note preserved completely without comma loss');

    // Test unquoted comma recovery in 19-column CSV row
    const unquotedRow = [
      '2026-09-24', '09:15 am - 10:15 am', '01:30 pm - 03:00 pm', '10:30 am - 12:00 pm', '03:00 pm - 04:30 pm',
      'சதுர்த்தசி', 'சதுர்த்தசி மாலை 06:15', 'உத்திரம்', 'மரணம்', 'பூரட்டாதி', 'தெற்கு', 'எண்ணெய்',
      'மாத சிவராத்திரி.', 'பிரம்மா', 'விஷ்ணு', 'சிவனை நினைத்து வழிபடுதல்.',
      'புரட்டாதி', 'குரோதி வருடம்', '13'
    ];
    const healed = healRowValues(unquotedRow);
    assert(healed.length === 17, 'healRowValues recovered unquoted multi-comma row to exactly 17 columns');
    assert(healed[13] === 'பிரம்மா, விஷ்ணு, சிவனை நினைத்து வழிபடுதல்.', 'worship_note stitched correctly with intact commas');
    assert(healed[16] === '13', 'tamil_day_number column correctly positioned at index 16');
  } catch (err) {
    assert(false, 'Phase 2 panchangam testing failed', err.message);
  }

  // ========================================================================
  // PHASE 3: DEVOTEE AUTHENTICATION & MULTI-FORMAT IDENTIFIERS
  // ========================================================================
  console.log('\n--- [PHASE 3] Devotee Authentication & Multi-Identifier Login ---');
  let devoteeToken = null;
  let devoteeUser = null;
  try {
    // 3.1 Login via Exact Office Code with Slashes
    const resSlash = await axios.post(`${API_BASE}/auth/login`, { username: 'A/4/267', password: '6369679139' });
    assert(resSlash.status === 200, 'Login with exact code "A/4/267" succeeds');
    assert(resSlash.data.user.role === 'user', 'Devotee user.role is "user"');
    assert(resSlash.data.user.username === 'A/4/267', 'Devotee username matches code');
    assert(resSlash.data.user.booking_date === '2026-09-24', 'Devotee booking_date resolved to 2026-09-24');
    devoteeToken = resSlash.data.token;
    devoteeUser = resSlash.data.user;

    // 3.2 Login via Code with spaces & lowercase ("a 4 267")
    const resSpace = await axios.post(`${API_BASE}/auth/login`, { username: 'a 4 267', password: '6369679139' });
    assert(resSpace.status === 200, 'Login with space-separated code "a 4 267" succeeds');

    // 3.3 Login via Code with hyphens ("A-4-267")
    const resHyphen = await axios.post(`${API_BASE}/auth/login`, { username: 'A-4-267', password: '6369679139' });
    assert(resHyphen.status === 200, 'Login with hyphenated code "A-4-267" succeeds');

    // 3.4 Login via Registered Devotee Email
    const resEmail = await axios.post(`${API_BASE}/auth/login`, { username: 'abishakmarlin@gmail.com', password: '6369679139' });
    assert(resEmail.status === 200, 'Login with registered email "abishakmarlin@gmail.com" succeeds');

    // 3.5 Negative: Rejection of Invalid Password
    try {
      await axios.post(`${API_BASE}/auth/login`, { username: 'A/4/267', password: 'wrongpassword999' });
      assert(false, 'Expected 401 for wrong password');
    } catch (err) {
      assert(err.response?.status === 401, 'Rejection of invalid password returns 401 Unauthorized');
    }

    // 3.6 Negative: Rejection of Non-existent Devotee / Office Code
    try {
      await axios.post(`${API_BASE}/auth/login`, { username: 'Z/99/999', password: '6369679139' });
      assert(false, 'Expected 401 for non-existent devotee');
    } catch (err) {
      assert(err.response?.status === 401, 'Rejection of non-existent devotee returns 401 Unauthorized');
    }
  } catch (err) {
    console.error('    [DEBUG Phase 3 Catch]:', err.response?.status, err.response?.data, err.config?.url, err.config?.data);
    assert(false, 'Phase 3 authentication failed', err.message);
  }

  const devoteeHeaders = { headers: { Authorization: `Bearer ${devoteeToken}` } };

  // ========================================================================
  // PHASE 4: DEVOTEE DATA ISOLATION & PRIVACY DEFENSE (ZERO-LEAKAGE)
  // ========================================================================
  console.log('\n--- [PHASE 4] Devotee Data Isolation & Zero-Leakage Privacy Defense ---');
  try {
    // 4.1 Devotee queries their own date (2026-09-24) -> Returns ONLY their own record
    const resOwnDate = await axios.get(`${API_BASE}/bookings?date=2026-09-24`, devoteeHeaders);
    assert(Array.isArray(resOwnDate.data), 'GET /api/bookings returns an array');
    assert(resOwnDate.data.length === 1, `Devotee receives exactly 1 booking on their date (count: ${resOwnDate.data.length})`);
    assert(resOwnDate.data[0].id === devoteeUser.id, 'Returned booking ID matches devotee user ID');
    assert(resOwnDate.data[0].code === 'A/4/267', 'Returned booking office code matches devotee code');
    assert(resOwnDate.data[0].name === 'abi', 'Returned booking name matches devotee name');

    // 4.2 Devotee queries ANY other date (e.g. 2026-01-01, 2026-05-12, 2026-11-03)
    const resOtherDate1 = await axios.get(`${API_BASE}/bookings?date=2026-01-01`, devoteeHeaders);
    assert(resOtherDate1.data.length === 0, 'Devotee cannot see any bookings on 2026-01-01 (count: 0)');

    const resOtherDate2 = await axios.get(`${API_BASE}/bookings?date=2026-11-03`, devoteeHeaders);
    assert(resOtherDate2.data.length === 0, 'Devotee cannot see any bookings on 2026-11-03 (count: 0)');

    // 4.3 Devotee queries broad date range (entire year 2026) -> ONLY returns their single record
    const resYearRange = await axios.get(`${API_BASE}/bookings?fromDate=2026-01-01&toDate=2026-12-31`, devoteeHeaders);
    assert(resYearRange.data.length === 1, `Devotee querying entire year range receives ONLY their own record (count: ${resYearRange.data.length})`);
    assert(resYearRange.data[0].id === devoteeUser.id, 'Year range result is strictly the devotee themselves');

    // 4.4 Devotee searches for another person's name -> Returns 0 records
    const resSearchOther = await axios.get(`${API_BASE}/bookings/search?q=ramanathan`, devoteeHeaders);
    assert(resSearchOther.data.length === 0, 'Devotee searching other person name returns 0 records');

    // 4.5 Devotee tries to look up another person's office code -> 403 Forbidden
    try {
      await axios.get(`${API_BASE}/bookings/code/U-1-100`, devoteeHeaders);
      assert(false, 'Expected 403 when looking up another devotee code');
    } catch (err) {
      assert(err.response?.status === 403, 'Looking up another office code returns 403 Forbidden', err.response?.data?.error);
    }

    // 4.6 Devotee looks up their own office code -> 200 OK
    const resOwnCode = await axios.get(`${API_BASE}/bookings/code/A-4-267`, devoteeHeaders);
    assert(resOwnCode.status === 200, 'Devotee looking up own office code returns 200 OK');
    assert(resOwnCode.data.name === 'abi', 'Own office code returns devotee details');

    // 4.7 Devotee attempts to export all bookings -> 403 Forbidden
    try {
      await axios.get(`${API_BASE}/bookings/export`, devoteeHeaders);
      assert(false, 'Expected 403 when devotee exports bookings');
    } catch (err) {
      assert(err.response?.status === 403, 'Exporting bookings by devotee returns 403 Forbidden');
    }

    // 4.8 Devotee attempts to mark attendance -> 403 Forbidden
    try {
      await axios.patch(`${API_BASE}/bookings/${devoteeUser.id}/present`, { present: true }, devoteeHeaders);
      assert(false, 'Expected 403 when devotee marks attendance');
    } catch (err) {
      assert(err.response?.status === 403, 'Marking attendance by devotee returns 403 Forbidden');
    }

    // 4.9 Devotee attempts to delete booking -> 403 Forbidden
    try {
      await axios.delete(`${API_BASE}/bookings/${devoteeUser.id}`, devoteeHeaders);
      assert(false, 'Expected 403 when devotee deletes booking');
    } catch (err) {
      assert(err.response?.status === 403, 'Deleting booking by devotee returns 403 Forbidden');
    }

    // 4.10 Devotee attempts to execute transfer -> 403 Forbidden
    try {
      await axios.post(`${API_BASE}/bookings/${devoteeUser.id}/transfer`, { name: 'Test Transfer' }, devoteeHeaders);
      assert(false, 'Expected 403 when devotee transfers booking');
    } catch (err) {
      assert(err.response?.status === 403, 'Transferring booking by devotee returns 403 Forbidden');
    }

    // 4.11 Devotee attempts to update another devotee's booking -> 403 Forbidden
    try {
      const { rows: otherRows } = await pool.query('SELECT id FROM bookings WHERE id != $1 LIMIT 1', [devoteeUser.id]);
      if (otherRows.length > 0) {
        await axios.patch(`${API_BASE}/bookings/${otherRows[0].id}`, { name: 'Hacked Name' }, devoteeHeaders);
        assert(false, 'Expected 403 when devotee updates another booking');
      }
    } catch (err) {
      assert(err.response?.status === 403, 'Updating another devotee record returns 403 Forbidden');
    }

    // 4.12 History logs isolation: devotee cannot see other devotees' audit logs
    const resDevoteeLogs = await axios.get(`${API_BASE}/history`, devoteeHeaders);
    assert(Array.isArray(resDevoteeLogs.data.logs), 'Devotee /api/history returns logs array');
    const logsLeak = resDevoteeLogs.data.logs.some(l => l.booking_id && l.booking_id !== devoteeUser.id);
    assert(!logsLeak, 'Devotee audit logs contain ZERO records from other devotees');
  } catch (err) {
    assert(false, 'Phase 4 isolation testing failed', err.message);
  }

  // ========================================================================
  // PHASE 5: PASSWORD MANAGEMENT & BCRYPT SECURITY
  // ========================================================================
  console.log('\n--- [PHASE 5] Devotee Custom Password Management & Bcrypt Storage ---');
  try {
    // Ensure clean state before testing password changes
    await pool.query('DELETE FROM devotee_passwords WHERE booking_id = $1', [devoteeUser.id]);

    // 5.1 Rejection when current password is wrong
    try {
      await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword: 'wrongCurrentPassword',
        newPassword: 'MySecurePassword@2026'
      }, devoteeHeaders);
      assert(false, 'Expected 401 for wrong current password');
    } catch (err) {
      assert(err.response?.status === 401, 'Rejection of incorrect current password returns 401');
    }

    // 5.2 Rejection when new password is too short (< 6 chars)
    try {
      await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword: '6369679139',
        newPassword: '123'
      }, devoteeHeaders);
      assert(false, 'Expected 400 for short password');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejection of short password (< 6 chars) returns 400');
    }

    // 5.3 Successful Password Change to Custom Password
    const newCustomPass = 'TempleDevoteePass@2026';
    const resChange = await axios.post(`${API_BASE}/auth/change-password`, {
      currentPassword: '6369679139',
      newPassword: newCustomPass
    }, devoteeHeaders);
    console.log('    [PHASE 5 resChange]:', resChange.status, resChange.data);
    assert(resChange.status === 200, 'POST /api/auth/change-password returns 200 OK');
    assert(resChange.data.message?.includes('successfully'), 'Confirmation message returned');

    // 5.4 Verify Login using NEW Custom Password immediately
    const resNewPassLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'A/4/267',
      password: newCustomPass
    });
    assert(resNewPassLogin.status === 200, 'Login with NEW custom password succeeds with 200 OK');

    // 5.5 Verify OLD default mobile password NO LONGER WORKS
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: 'A/4/267',
        password: '6369679139'
      });
      assert(false, 'Expected 401 when using old default mobile after custom password set');
    } catch (err) {
      assert(err.response?.status === 401, 'Old default mobile rejected after custom password is set');
    }

    // 5.6 Verify Bcrypt Hash in Database
    let passRows = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      const q = await pool.query('SELECT password_hash, is_custom_password, booking_id, office_code FROM devotee_passwords');
      if (q && q.rows && q.rows.length > 0) {
        passRows = q.rows;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    assert(passRows.length > 0, 'devotee_passwords entry exists for devotee');
    if (passRows.length > 0) {
      assert(passRows[0].is_custom_password === 1 || passRows[0].is_custom_password === true, 'is_custom_password marked true');
      assert(passRows[0].password_hash.startsWith('$2b$') || passRows[0].password_hash.startsWith('$2a$'), 'Password stored as bcrypt hash ($2b$ or $2a$)');
      assert(passRows[0].password_hash !== newCustomPass, 'Plaintext password is NEVER stored in database');
    }

    // 5.7 Clean up: Restore back to default mobile for persistent user testing
    await pool.query('DELETE FROM devotee_passwords WHERE booking_id = ?', [devoteeUser.id]);
    const resRestoreLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'A/4/267',
      password: '6369679139'
    });
    assert(resRestoreLogin.status === 200, 'Restored cleanly to default mobile password verification');
  } catch (err) {
    assert(false, 'Phase 5 password testing failed', err.message);
  } finally {
    // Guarantee cleanup so subsequent runs or assertions never leave stale passwords
    try {
      await pool.query('DELETE FROM devotee_passwords');
    } catch (_) {}
  }

  // ========================================================================
  // PHASE 6: BUG REPORTING & ISSUE MANAGEMENT (ALL ROLES)
  // ========================================================================
  console.log('\n--- [PHASE 6] Bug Reporting & Issue Tracking System ---');
  let testBugId = null;
  try {
    // 6.1 Devotee Submits Bug Report
    const resCreateBug = await axios.post(`${API_BASE}/bug-reports`, {
      title: 'QA Automated Test Bug',
      description: 'Verifying bug submission by devotee role in test suite.',
      severity: 'medium',
      page_url: 'http://localhost:5173/dashboard'
    }, devoteeHeaders);
    assert(resCreateBug.status === 201, 'POST /api/bug-reports returns 201 Created');
    assert(resCreateBug.data.report?.title === 'QA Automated Test Bug', 'Report title matches submission');
    assert(resCreateBug.data.report?.status === 'open', 'New bug report defaults to "open" status');
    assert(resCreateBug.data.report?.user_role === 'user', 'Reporter role saved as "user"');
    testBugId = resCreateBug.data.report?.id || resCreateBug.data.id;

    // 6.2 Validation: Submitting without title or description returns 400
    try {
      await axios.post(`${API_BASE}/bug-reports`, { title: '' }, devoteeHeaders);
      assert(false, 'Expected 400 for empty bug report');
    } catch (err) {
      assert(err.response?.status === 400, 'Empty bug report rejected with 400 Bad Request');
    }

    // 6.3 List Bug Reports
    const resListBugs = await axios.get(`${API_BASE}/bug-reports`, superadminHeaders);
    assert(resListBugs.status === 200, 'GET /api/bug-reports returns 200 OK');
    const reportsList = Array.isArray(resListBugs.data) ? resListBugs.data : (resListBugs.data.reports || []);
    assert(Array.isArray(reportsList), 'Returns reports array');
    assert(reportsList.some(r => r.id === testBugId), 'Newly submitted test bug is present in list');

    // 6.4 Staff Updates Bug Status to "in_progress"
    const resUpdateStatus1 = await axios.patch(`${API_BASE}/bug-reports/${testBugId}/status`, {
      status: 'in_progress'
    }, adminHeaders);
    assert(resUpdateStatus1.status === 200, 'PATCH /api/bug-reports/:id/status updates to "in_progress"');
    assert(resUpdateStatus1.data.report?.status === 'in_progress', 'Bug status is now "in_progress"');

    // 6.5 Staff Updates Bug Status to "resolved"
    const resUpdateStatus2 = await axios.patch(`${API_BASE}/bug-reports/${testBugId}/status`, {
      status: 'resolved'
    }, superadminHeaders);
    assert(resUpdateStatus2.status === 200, 'PATCH /api/bug-reports/:id/status updates to "resolved"');
    assert(resUpdateStatus2.data.report?.status === 'resolved', 'Bug status is now "resolved"');

    // 6.6 Clean up test bug report
    await pool.query('DELETE FROM bug_reports WHERE id = $1', [testBugId]);
    assert(true, 'Test bug report cleaned up from database');
  } catch (err) {
    assert(false, 'Phase 6 bug reporting failed', err.message);
  }

  // ========================================================================
  // PHASE 7: PUBLIC DEVOTEE SIGNUP & CODE AUTO-FILL
  // ========================================================================
  console.log('\n--- [PHASE 7] Public Devotee Signup & Office Code Lookup ---');
  try {
    // 7.1 Unauthenticated / Public slot capacity check sanitizes rows
    const resPublicBookings = await axios.get(`${API_BASE}/bookings?date=2026-09-24`);
    assert(resPublicBookings.status === 200, 'Public GET /api/bookings returns 200 OK');
    if (resPublicBookings.data.length > 0) {
      const publicRow = resPublicBookings.data[0];
      assert(publicRow.name === undefined, 'Devotee name is stripped for public signup callers');
      assert(publicRow.mobile === undefined, 'Devotee phone is stripped for public signup callers');
      assert(publicRow.code === undefined, 'Devotee office code is stripped for public signup callers');
      assert(publicRow.kattalai_date !== undefined, 'Slot kattalai_date is retained for capacity check');
    }

    // 7.2 Staff / Public office code lookup for registration auto-fill
    const resCodeLookup = await axios.get(`${API_BASE}/bookings/code/A-4-267`, superadminHeaders);
    assert(resCodeLookup.status === 200, 'Staff GET /api/bookings/code/A-4-267 returns 200 OK');
    assert(resCodeLookup.data.name === 'abi', 'Office code lookup auto-fills name');
    assert(resCodeLookup.data.code === 'A/4/267', 'Office code lookup returns standard code');
  } catch (err) {
    assert(false, 'Phase 7 signup auto-fill failed', err.message);
  }

  // ========================================================================
  // PHASE 8: ATTENDANCE RULES & 5-DAY WINDOW AUTHORIZATION
  // ========================================================================
  console.log('\n--- [PHASE 8] Staff Roles & 5-Day Attendance Rule ---');
  try {
    const today = new Date();
    const bMonth = 9;
    const bDate = 24;
    const bookingDate = new Date(Date.UTC(today.getFullYear(), bMonth - 1, bDate));
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const diffDays = Math.ceil(Math.abs(bookingDate - todayUTC) / (1000 * 60 * 60 * 24));

    if (diffDays > 5) {
      // 8.1.1 Non-superadmin should receive 403 beyond 5-day window
      try {
        await axios.patch(`${API_BASE}/bookings/${devoteeUser.id}/present`, {
          present: true,
          user_role: 'ulthurai'
        }, ulthuraiHeaders);
        assert(false, 'Expected 403 for ulthurai beyond 5 days');
      } catch (err) {
        assert(err.response?.status === 403, 'Ulthurai staff blocked from marking attendance beyond 5-day window');
      }

      // 8.1.2 Superadmin CAN mark attendance beyond 5 days with valid user_id foreign key
      const resSuperAttendance = await axios.patch(`${API_BASE}/bookings/${devoteeUser.id}/present`, {
        present: true,
        user_id: realSuper.id,
        user_name: realSuper.name,
        user_role: 'superadmin',
        target_year: 2026
      }, superadminHeaders);
      assert(resSuperAttendance.status === 200, 'Superadmin authorized to mark attendance beyond 5-day window');
      assert(resSuperAttendance.data.present === 1 || resSuperAttendance.data.present === true, 'Attendance recorded as Present');
    }
  } catch (err) {
    assert(false, 'Phase 8 attendance testing failed', err.message);
  }

  // ========================================================================
  // PHASE 9: SYSTEM SETTINGS & DYNAMIC TRANSFER BASE AMOUNT
  // ========================================================================
  console.log('\n--- [PHASE 9] System Settings & Transfer Configurations ---');
  try {
    const resGetSettings = await axios.get(`${API_BASE}/settings`);
    assert(resGetSettings.status === 200, 'GET /api/settings returns 200 OK');
    assert(resGetSettings.data.transfer_base_amount !== undefined, `transfer_base_amount is ${resGetSettings.data.transfer_base_amount}`);

    // Update setting via Superadmin
    const resPutSetting = await axios.put(`${API_BASE}/settings`, {
      key: 'transfer_base_amount',
      value: 3500
    }, superadminHeaders);
    assert(resPutSetting.status === 200, 'Superadmin PUT /api/settings returns 200 OK');

    // Non-staff / devotee cannot update system settings (must receive 403)
    try {
      await axios.put(`${API_BASE}/settings`, {
        key: 'transfer_base_amount',
        value: 100
      }, devoteeHeaders);
      assert(false, 'Expected 403 when devotee updates settings');
    } catch (err) {
      assert(err.response?.status === 403, 'Devotee blocked from modifying system settings with 403 Forbidden');
    }
  } catch (err) {
    assert(false, 'Phase 9 settings testing failed', err.message);
  }

  // ========================================================================
  // FINAL SUMMARY REPORT
  // ========================================================================
  console.log('\n========================================================================');
  console.log(`🏁 MASTER QA AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error('⚠️  FAILURES DETECTED:');
    failures.forEach((f, i) => {
      console.error(`  ${i + 1}. ${f.message} - ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL PRODUCTION QA AND ROLE ISOLATION LOGIC TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runMasterAudit().catch(err => {
  console.error('Fatal crash in master audit:', err);
  process.exit(1);
});
