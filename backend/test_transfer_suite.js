const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure environment for Aiven MySQL without committing raw secrets
process.env.DB_HOST = 'mysql-1affff53-projectvairavankoil.h.aivencloud.com';
process.env.DB_PORT = '16613';
process.env.DB_USER = 'avnadmin';
process.env.DB_NAME = 'defaultdb';
process.env.DB_SSL = 'true';

const pool = require('./src/db/pool');

const settingsController = require('./src/controllers/settingsController');
const bookingsController = require('./src/controllers/bookingsController');

const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    results.push({ test: description, status: 'PASS', details });
    console.log(`[PASS] ${description} ${details ? `(${details})` : ''}`);
  } else {
    results.push({ test: description, status: 'FAIL', details });
    console.error(`[FAIL] ${description}: ${details}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   STARTING 1-TIME TRANSFER & SETTINGS TEST SUITE   ');
  console.log('====================================================\n');

  let testBookingId = null;
  let femaleBookingId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Database Schema Verification
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Database Schema ---');
    const { rows: settingsTable } = await pool.query("SHOW TABLES LIKE 'system_settings'");
    assert('system_settings table exists', settingsTable.length > 0);

    const { rows: cols } = await pool.query("SHOW COLUMNS FROM bookings");
    const colNames = cols.map(c => c.Field);
    assert("bookings table has 'is_transferred'", colNames.includes('is_transferred'));
    assert("bookings table has 'transferred_at'", colNames.includes('transferred_at'));
    assert("bookings table has 'transferred_from_name'", colNames.includes('transferred_from_name'));
    assert("bookings table has 'transferred_from_title'", colNames.includes('transferred_from_title'));
    assert("bookings table has 'transferred_fee_paid'", colNames.includes('transferred_fee_paid'));

    // ----------------------------------------------------
    // TEST 2: System Settings Controller (GET & PUT)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: System Settings API ---');
    let capturedSettings = null;
    await settingsController.getSettings({}, {
      json: (data) => { capturedSettings = data; }
    });
    assert('getSettings returns transfer_base_amount', capturedSettings && capturedSettings.transfer_base_amount !== undefined, `Value: ${capturedSettings?.transfer_base_amount}`);

    // Update setting to 4500
    let putSuccess = false;
    await settingsController.updateSetting({
      body: { key: 'transfer_base_amount', value: 4500 }
    }, {
      json: (data) => { putSuccess = data.success; },
      status: () => ({ json: () => {} })
    });
    assert('updateSetting dynamically updates to 4500', putSuccess);

    // Verify DB updated
    const { rows: verifyRows } = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'transfer_base_amount'");
    assert('DB reflects updated base fee 4500', verifyRows[0]?.setting_value === '4500');

    // Reset back to 3500
    await settingsController.updateSetting({
      body: { key: 'transfer_base_amount', value: 3500 }
    }, {
      json: () => {},
      status: () => ({ json: () => {} })
    });
    const { rows: resetRows } = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'transfer_base_amount'");
    assert('DB reset cleanly to 3500', resetRows[0]?.setting_value === '3500');

    // ----------------------------------------------------
    // TEST 3: Create Temporary Test Bookings
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Booking Setup for Transfer Testing ---');
    const { rows: kTypes } = await pool.query('SELECT id FROM kattalai_types LIMIT 1');
    const kTypeId = kTypes[0].id;

    // Create eligible booking (Thiru with 600 amount paid)
    testBookingId = uuidv4();
    await pool.query(
      `INSERT INTO bookings (id, kattalai_type_id, title, name, star, place, mobile, amount, status)
       VALUES ($1, $2, 'Thiru', 'Ramanathan Father', 'Anusam', 'Karaikudi', '9876543210', 600.00, 'booked')`,
      [testBookingId, kTypeId]
    );
    assert('Created eligible test booking (Thiru, paid: ₹600)', Boolean(testBookingId));

    // Create ineligible booking (Thirumathi)
    femaleBookingId = uuidv4();
    await pool.query(
      `INSERT INTO bookings (id, kattalai_type_id, title, name, star, place, mobile, amount, status)
       VALUES ($1, $2, 'Thirumathi', 'Meenakshi Mother', 'Hastham', 'Madurai', '9876543211', 1000.00, 'booked')`,
      [femaleBookingId, kTypeId]
    );
    assert('Created ineligible test booking (Thirumathi, female title)', Boolean(femaleBookingId));

    // ----------------------------------------------------
    // TEST 4: Eligibility Enforcement (Thirumathi must be rejected)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Eligibility Rule Validation ---');
    let rejectFemaleCode = null;
    let rejectFemaleError = null;
    await bookingsController.transferBooking({
      params: { id: femaleBookingId },
      body: { name: 'Daughter Test', title: 'Selvi' }
    }, {
      status: (code) => ({
        json: (data) => {
          rejectFemaleCode = code;
          rejectFemaleError = data.error;
        }
      }),
      json: () => {}
    });
    assert('Transfer rejected for Thirumathi title', rejectFemaleCode === 400, `Error: "${rejectFemaleError}"`);

    // ----------------------------------------------------
    // TEST 5: Transfer Execution & Dynamic Difference Math
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Transfer Execution & Math Validation ---');
    // Base fee is 3500, previous paid is 600 -> Expected difference: 2900
    let transferSuccess = false;
    let transferDiffAmount = null;
    let transferUpdatedBooking = null;

    await bookingsController.transferBooking({
      params: { id: testBookingId },
      body: {
        title: 'Selvi',
        name: 'Valli Daughter',
        star: 'Rohini',
        place: 'Chennai',
        mobile: '9123456780',
        payment_method: 'upi'
      }
    }, {
      status: (code) => ({
        json: (d) => { console.error('Transfer failed with status', code, d); }
      }),
      json: (data) => {
        transferSuccess = data.success;
        transferDiffAmount = data.differenceAmount;
        transferUpdatedBooking = data.booking;
      }
    });

    assert('Transfer API returned success', transferSuccess);
    assert('Calculated difference is EXACTLY ₹2900 (₹3500 - ₹600)', transferDiffAmount === 2900, `Calculated: ₹${transferDiffAmount}`);
    assert("Booking updated to new title 'Selvi'", transferUpdatedBooking?.title === 'Selvi');
    assert("Booking updated to new name 'Valli Daughter'", transferUpdatedBooking?.name === 'Valli Daughter');
    assert("Booking is_transferred flag set to 1", transferUpdatedBooking?.is_transferred === 1);
    assert("Booking transferred_from_name recorded 'Ramanathan Father'", transferUpdatedBooking?.transferred_from_name === 'Ramanathan Father');
    assert("Booking transferred_at timestamp is set", Boolean(transferUpdatedBooking?.transferred_at));

    // Verify payment record in DB
    const { rows: payRows } = await pool.query("SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1", [testBookingId]);
    assert('Payment record inserted for difference amount ₹2900', parseFloat(payRows[0]?.amount) === 2900 && payRows[0]?.method === 'upi');

    // Verify audit log in DB
    const { rows: logRows } = await pool.query("SELECT * FROM history_logs WHERE booking_id = $1 AND action = 'ACCOUNT_TRANSFER'", [testBookingId]);
    assert('Audit log inserted in history_logs', logRows.length > 0, `Log: "${logRows[0]?.details}"`);

    // ----------------------------------------------------
    // TEST 6: 1-Time Transfer Restriction (Second attempt must fail)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: 1-Time Transfer Lock Enforcement ---');
    let secondTransferCode = null;
    let secondTransferError = null;

    await bookingsController.transferBooking({
      params: { id: testBookingId },
      body: {
        title: 'Selvan',
        name: 'Grandson Test'
      }
    }, {
      status: (code) => ({
        json: (data) => {
          secondTransferCode = code;
          secondTransferError = data.error;
        }
      }),
      json: () => {}
    });

    assert('Second transfer attempt strictly blocked (HTTP 400)', secondTransferCode === 400, `Message: "${secondTransferError}"`);

  } catch (err) {
    console.error('Test Suite encountered fatal error:', err);
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Delete temporary test bookings
    // ----------------------------------------------------
    console.log('\n--- CLEANUP ---');
    if (testBookingId) {
      await pool.query('DELETE FROM payments WHERE booking_id = $1', [testBookingId]);
      await pool.query('DELETE FROM history_logs WHERE booking_id = $1', [testBookingId]);
      await pool.query('DELETE FROM bookings WHERE id = $1', [testBookingId]);
      console.log('Cleaned up test booking:', testBookingId);
    }
    if (femaleBookingId) {
      await pool.query('DELETE FROM bookings WHERE id = $1', [femaleBookingId]);
      console.log('Cleaned up female test booking:', femaleBookingId);
    }
    await pool.end();
  }

  // Final Summary Report
  console.log('\n====================================================');
  console.log('               TEST RESULTS SUMMARY                 ');
  console.log('====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS : ${results.length}`);
  console.log(`PASSED      : ${passed} ✅`);
  console.log(`FAILED      : ${failed} ❌`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
