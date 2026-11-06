const assert = require('assert');
const axios = require('axios');
const pool = require('./src/db/pool');

const BASE_URL = 'http://localhost:4000/api';

async function runPrintTrackingAudit() {
  console.log('\n======================================================');
  console.log('🖨️  PRINT AUDIT & REPRINT SEQUENCE VERIFICATION SUITE  🖨️');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  // 1. Get staff users
  const { rows: users } = await pool.query("SELECT id, name, email, role FROM users WHERE role IN ('admin', 'superadmin')");
  const adminUser = users.find(u => u.role === 'admin') || { id: 'admin-id', name: 'marlin', role: 'admin' };
  const superadminUser = users.find(u => u.role === 'superadmin') || { id: 'super-id', name: 'Super Administrator', role: 'superadmin' };

  const testDate = '15 Oct 2027'; // unique date for testing

  // Clean up any test records for this date
  await pool.query("DELETE FROM print_records WHERE target_date = $1", [testDate]);
  await pool.query("DELETE FROM history_logs WHERE details LIKE $1", [`%for Date: ${testDate}%`]);

  console.log('--- Step 1: Initial Print Status Check ---');
  const res1 = await axios.get(`${BASE_URL}/history/print-status?target_date=${encodeURIComponent(testDate)}`);
  test('Initial print status has count 0', () => {
    assert.strictEqual(res1.data.print_count, 0);
    assert.strictEqual(res1.data.next_print_number, 1);
  });

  console.log('\n--- Step 2: 1st Print by Admin (marlin) ---');
  const print1Res = await axios.post(`${BASE_URL}/history/print-log`, {
    user_id: adminUser.id,
    user_name: adminUser.name || 'marlin',
    user_role: 'admin',
    target_date: testDate,
    list_title: 'Viboothi to be sent to',
    devotee_count: 2,
    devotee_names: 'Devotee A, Devotee B'
  });

  test('1st print recorded with print_number 1', () => {
    assert.strictEqual(print1Res.status, 201);
    assert.strictEqual(print1Res.data.print_number, 1);
    assert.strictEqual(print1Res.data.ordinal, '1st');
  });

  test('1st print details format contains "1st time printed by ... for Date: ..."', () => {
    assert.ok(print1Res.data.details.includes(`1st time printed by ${adminUser.name || 'marlin'} [admin]`));
    assert.ok(print1Res.data.details.includes(`for Date: ${testDate}`));
    assert.ok(print1Res.data.details.includes('(2 Prasatham letters)'));
  });

  console.log('\n--- Step 3: Print Status Check After 1st Print ---');
  const res2 = await axios.get(`${BASE_URL}/history/print-status?target_date=${encodeURIComponent(testDate)}`);
  test('Status reflects 1 prior print and next print is 2', () => {
    assert.strictEqual(res2.data.print_count, 1);
    assert.strictEqual(res2.data.next_print_number, 2);
    assert.strictEqual(res2.data.history[0].user_name, adminUser.name || 'marlin');
  });

  console.log('\n--- Step 4: 2nd Print by Super Admin ---');
  const print2Res = await axios.post(`${BASE_URL}/history/print-log`, {
    user_id: superadminUser.id,
    user_name: superadminUser.name || 'Super Administrator',
    user_role: 'superadmin',
    target_date: testDate,
    list_title: 'Viboothi to be sent to',
    devotee_count: 2,
    devotee_names: 'Devotee A, Devotee B'
  });

  test('2nd print recorded with print_number 2 and ordinal 2nd', () => {
    assert.strictEqual(print2Res.status, 201);
    assert.strictEqual(print2Res.data.print_number, 2);
    assert.strictEqual(print2Res.data.ordinal, '2nd');
  });

  test('2nd print details mentions who printed 1st time', () => {
    assert.ok(print2Res.data.details.includes(`2nd time printed by ${superadminUser.name || 'Super Administrator'} [superadmin]`));
    assert.ok(print2Res.data.details.includes(`1st time printed by ${adminUser.name || 'marlin'} [admin]`));
    assert.ok(print2Res.data.details.includes(`for Date: ${testDate}`));
  });

  console.log('\n--- Step 5: 3rd Print (Reprint) ---');
  const print3Res = await axios.post(`${BASE_URL}/history/print-log`, {
    user_id: adminUser.id,
    user_name: adminUser.name || 'marlin',
    user_role: 'admin',
    target_date: testDate,
    list_title: 'Viboothi to be sent to',
    devotee_count: 2,
    devotee_names: 'Devotee A, Devotee B'
  });

  test('3rd print recorded with print_number 3 and ordinal 3rd', () => {
    assert.strictEqual(print3Res.status, 201);
    assert.strictEqual(print3Res.data.print_number, 3);
    assert.strictEqual(print3Res.data.ordinal, '3rd');
  });

  test('3rd print details mentions total previous prints and who printed first and last', () => {
    assert.ok(print3Res.data.details.includes('3rd time printed by'));
    assert.ok(print3Res.data.details.includes('Previously printed 2 times'));
    assert.ok(print3Res.data.details.includes(`1st: ${adminUser.name || 'marlin'}`));
  });

  console.log('\n--- Step 6: Query /api/history with Printing Category ---');
  const histRes = await axios.get(`${BASE_URL}/history?category=printing&search=${encodeURIComponent(testDate)}`);
  test('/api/history returns recorded print logs', () => {
    assert.strictEqual(histRes.status, 200);
    assert.ok(histRes.data.logs.length >= 3);
  });

  test('Print logs have action "Printed Labels"', () => {
    const testLogs = histRes.data.logs.filter(l => l.details.includes(testDate));
    assert.strictEqual(testLogs.length, 3);
    testLogs.forEach(l => assert.strictEqual(l.action, 'Printed Labels'));
  });

  // Clean up test records
  await pool.query("DELETE FROM print_records WHERE target_date = $1", [testDate]);
  await pool.query("DELETE FROM history_logs WHERE details LIKE $1", [`%for Date: ${testDate}%`]);

  console.log('\n======================================================');
  console.log(`🏁 PRINT TRACKING AUDIT: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runPrintTrackingAudit().catch(err => {
  console.error('Fatal error during print tracking audit:', err);
  process.exit(1);
});
