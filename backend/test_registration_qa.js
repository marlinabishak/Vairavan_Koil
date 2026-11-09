const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db/pool');
const bookingsController = require('./src/controllers/bookingsController');
const { v4: uuidv4 } = require('uuid');

async function runRegistrationQA() {
  console.log('========================================================================');
  console.log('🧪  VAIRAVAN KOIL: DEEP REGISTRATION & BOOKING QA VERIFICATION SUITE  🧪');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];
  const createdTestBookingIds = [];

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

  // Helper to call bookingsController.createBooking cleanly
  function callCreateBooking(body, user = null) {
    return new Promise((resolve) => {
      const req = { body, user };
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          resolve({ status: this.statusCode, data });
        }
      };
      bookingsController.createBooking(req, res).catch((err) => {
        resolve({ status: 500, data: { error: err.message, stack: err.stack } });
      });
    });
  }

  // Helper to call bookingsController.updateBooking cleanly
  function callUpdateBooking(id, body, user = null) {
    return new Promise((resolve) => {
      const req = { params: { id }, body, user };
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          resolve({ status: this.statusCode, data });
        }
      };
      bookingsController.updateBooking(req, res).catch((err) => {
        resolve({ status: 500, data: { error: err.message, stack: err.stack } });
      });
    });
  }

  // Helper to call bookingsController.transferBooking cleanly
  function callTransferBooking(id, body, user = null) {
    return new Promise((resolve) => {
      const req = { params: { id }, body, user };
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          resolve({ status: this.statusCode, data });
        }
      };
      bookingsController.transferBooking(req, res).catch((err) => {
        resolve({ status: 500, data: { error: err.message, stack: err.stack } });
      });
    });
  }

  try {
    // 0. Fetch active kattalai types
    const { rows: kTypes } = await pool.query('SELECT id, name, name_ta, color_key FROM kattalai_types ORDER BY display_order');
    const uchiType = kTypes.find(t => t.color_key === 'morning') || kTypes[0];
    const arthaType = kTypes.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening') || kTypes[1];

    console.log(`Using Uchikala Type: ${uchiType.name} (${uchiType.id})`);
    console.log(`Using Arthajama Type: ${arthaType.name} (${arthaType.id})\n`);

    // ========================================================================
    // TEST 1: Dashboard New Registration (Uchikalam, within 6 months -> ₹3,700)
    // ========================================================================
    console.log('--- TEST 1: New Nithiya Kattalai (Within 6 months, Uchikalam) ---');
    const today = new Date();
    // 2 months in the future
    const withinSixDate = new Date(today);
    withinSixDate.setMonth(withinSixDate.getMonth() + 2);
    const kDate1 = withinSixDate.getDate();
    const kMonth1 = withinSixDate.getMonth() + 1;

    const payload1 = {
      kattalai_type_id: uchiType.id,
      kattalai_date: kDate1,
      kattalai_month: kMonth1,
      title: 'Thiru',
      name: 'Ramanathan Somu QA',
      star: 'Anusam',
      place: 'CHENNAI',
      code: `U/1/QA1`,
      mobile: '9840112233',
      whatsapp_number: '9840112233',
      whatsapp_same_as_mobile: true,
      email: 'ramanathan.qa@test.com',
      per_add_1: 'No 15, North Mada Street',
      per_add_2: 'Mylapore',
      per_add_3: 'Chennai 600004',
      comm_add_1: 'No 15, North Mada Street',
      comm_add_2: 'Mylapore',
      comm_add_3: 'Chennai 600004',
      comm_add_4: '',
      country_code: '91',
      kat_type: 'Lifetime',
      regn_date: today.toISOString().slice(0, 10),
      title_ta: 'திரு',
      name_ta: 'ராமநாதன் சோமு',
      star_ta: 'அனுஷம்',
      place_ta: 'சென்னை',
      comments: 'Registered by Admin via Dashboard'
    };

    const res1 = await callCreateBooking(payload1, { id: 'admin-uuid', name: 'Admin Staff', role: 'admin' });
    assert(res1.status === 201, 'POST /api/bookings returns 201 Created', `Received ${res1.status}`);
    assert(res1.data && res1.data.id, 'Response contains generated booking ID', res1.data?.id);
    if (res1.data?.id) createdTestBookingIds.push(res1.data.id);

    // Verify DB insertion matches exactly
    const { rows: verify1 } = await pool.query('SELECT * FROM bookings WHERE id = ?', [res1.data?.id]);
    assert(verify1.length === 1, 'Booking record exists in database table');
    const row1 = verify1[0];

    assert(row1.title === 'Thiru' && row1.title_ta === 'திரு', 'Both English Title and Tamil Title saved', `EN: ${row1.title}, TA: ${row1.title_ta}`);
    assert(row1.name === 'Ramanathan Somu QA' && row1.name_ta === 'ராமநாதன் சோமு', 'Both English Name and Tamil Name saved', `EN: ${row1.name}, TA: ${row1.name_ta}`);
    assert(row1.star === 'Anusam' && row1.star_ta === 'அனுஷம்', 'Both English Star and Tamil Star saved', `EN: ${row1.star}, TA: ${row1.star_ta}`);
    assert(row1.place === 'CHENNAI' && row1.place_ta === 'சென்னை', 'Both English Place and Tamil Place saved', `EN: ${row1.place}, TA: ${row1.place_ta}`);
    assert(row1.per_add_1 === 'No 15, North Mada Street' && row1.per_add_2 === 'Mylapore', 'Permanent address fields split and stored');
    assert(row1.code === 'U/1/QA1', 'Office slot code stored');
    assert(row1.kat_type === 'Lifetime', 'Sponsorship type stored as Lifetime');
    assert(parseFloat(row1.amount) === 3700, 'Fee auto-calculated as ₹3,700 (₹3500 base + ₹200 archanai within 6 mos)', `Amount: ${row1.amount}`);

    // ========================================================================
    // TEST 2: Dashboard New Registration (> 6 months -> ₹3,500 Archanai Waived)
    // ========================================================================
    console.log('\n--- TEST 2: New Nithiya Kattalai (> 6 months, Arthajamam, Archanai Waived) ---');
    // 8 months in the future
    const beyondSixDate = new Date(today);
    beyondSixDate.setMonth(beyondSixDate.getMonth() + 8);
    const kDate2 = beyondSixDate.getDate();
    const kMonth2 = beyondSixDate.getMonth() + 1;

    const payload2 = {
      kattalai_type_id: arthaType.id,
      kattalai_date: kDate2,
      kattalai_month: kMonth2,
      title: 'Thirumathi',
      name: 'Geetha Meenakshi QA',
      star: 'Aswini',
      place: 'KALLAL',
      code: `A/1/QA2`,
      mobile: '9443123456',
      whatsapp_number: '9443123456',
      whatsapp_same_as_mobile: true,
      email: 'geetha.qa@test.com',
      per_add_1: 'Sivan Koil Street',
      per_add_2: 'Kallal',
      per_add_3: 'Sivagangai Dist',
      comm_add_1: 'Sivan Koil Street',
      comm_add_2: 'Kallal',
      comm_add_3: 'Sivagangai Dist',
      country_code: '91',
      kat_type: 'Lifetime',
      regn_date: today.toISOString().slice(0, 10),
      title_ta: 'திருமதி',
      name_ta: 'கீதா மீனாட்சி',
      star_ta: 'அஸ்வினி',
      place_ta: 'கல்லல்',
      comments: 'Full amount paid without archanai'
    };

    const res2 = await callCreateBooking(payload2, { id: 'admin-uuid', name: 'Admin Staff', role: 'admin' });
    assert(res2.status === 201, 'POST /api/bookings returns 201 Created for > 6 months');
    if (res2.data?.id) createdTestBookingIds.push(res2.data.id);

    const { rows: verify2 } = await pool.query('SELECT * FROM bookings WHERE id = ?', [res2.data?.id]);
    const row2 = verify2[0];
    assert(row2.title === 'Thirumathi' && row2.title_ta === 'திருமதி', 'Thirumathi title preserved in EN & TA');
    assert(row2.name === 'Geetha Meenakshi QA' && row2.name_ta === 'கீதா மீனாட்சி', 'Name preserved in EN & TA');
    assert(parseFloat(row2.amount) === 3500, 'Fee auto-calculated as exactly ₹3,500 (Archanai waived > 6 mos)', `Amount: ${row2.amount}`);

    // ========================================================================
    // TEST 3: Public Devotee Online Signup (Unauthenticated / Public)
    // ========================================================================
    console.log('\n--- TEST 3: Public Devotee Online Registration (/signup flow) ---');
    const payload3 = {
      kattalai_type_id: uchiType.id,
      kattalai_date: 15,
      kattalai_month: 8,
      title: 'Selvan',
      name: 'Karthik Subramanian QA',
      star: 'Rohini',
      place: 'KARAIKUDI',
      code: `U/2/QA3`,
      mobile: '9841998877',
      whatsapp_number: '9841998877',
      whatsapp_same_as_mobile: true,
      email: 'karthik.subra.qa@gmail.com',
      per_add_1: 'Subramaniapuram 5th Street',
      per_add_2: 'Karaikudi 630002',
      per_add_3: '',
      comm_add_1: 'Subramaniapuram 5th Street',
      comm_add_2: 'Karaikudi 630002',
      comm_add_3: '',
      comm_add_4: '',
      amount: 3500,
      country_code: '91',
      kat_type: 'Lifetime',
      regn_date: today.toISOString().slice(0, 10),
      title_ta: 'செல்வன்',
      name_ta: 'கார்த்திக் சுப்ரமணியன்',
      star_ta: 'ரோகிணி',
      place_ta: 'காரைக்குடி',
      comments: 'Public Online Signup Registration'
    };

    // Note: user = null (unauthenticated public devotee)
    const res3 = await callCreateBooking(payload3, null);
    assert(res3.status === 201, 'Public devotee signup succeeds without authentication token');
    if (res3.data?.id) createdTestBookingIds.push(res3.data.id);

    const { rows: verify3 } = await pool.query('SELECT * FROM bookings WHERE id = ?', [res3.data?.id]);
    const row3 = verify3[0];
    assert(row3.created_by === null, 'created_by is NULL for public online registrations');
    assert(row3.title === 'Selvan' && row3.title_ta === 'செல்வன்', 'Selvan title preserved');
    assert(row3.name_ta === 'கார்த்திக் சுப்ரமணியன்', 'Tamil name stored without charset corruption');
    assert(row3.place_ta === 'காரைக்குடி', 'Tamil place stored without charset corruption');

    // ========================================================================
    // TEST 4: Edit Existing Nithiya Kattalai (Update Details)
    // ========================================================================
    console.log('\n--- TEST 4: Edit Nithiya Kattalai (Update EN & TA Details) ---');
    const updatePayload = {
      name: 'Ramanathan Somu Updated QA',
      name_ta: 'ராமநாதன் சோமு திருத்தியது',
      place: 'COIMBATORE',
      place_ta: 'கோயம்புத்தூர்',
      star: 'Mirugaseeridam',
      star_ta: 'மிருகசீரிடம்',
      comments: 'Updated via Edit Modal'
    };

    const res4 = await callUpdateBooking(res1.data.id, updatePayload, { id: 'admin-uuid', role: 'admin' });
    assert(res4.status === 200, 'PATCH /api/bookings/:id returns 200 OK');

    const { rows: verify4 } = await pool.query('SELECT name, name_ta, place, place_ta, star, star_ta FROM bookings WHERE id = ?', [res1.data.id]);
    const row4 = verify4[0];
    assert(row4.name === 'Ramanathan Somu Updated QA', 'Updated English Name reflected in DB');
    assert(row4.name_ta === 'ராமநாதன் சோமு திருத்தியது', 'Updated Tamil Name reflected in DB');
    assert(row4.place === 'COIMBATORE' && row4.place_ta === 'கோயம்புத்தூர்', 'Updated Place reflected in both EN & TA');
    assert(row4.star_ta === 'மிருகசீரிடம்', 'Updated Star reflected in Tamil');

    // ========================================================================
    // TEST 5: 1-Time Account Transfer Logic
    // ========================================================================
    console.log('\n--- TEST 5: 1-Time Account Transfer (Inheritance & Difference Payable) ---');
    // Prepare a devotee who originally contributed ₹1,000
    const transferBaseId = uuidv4();
    createdTestBookingIds.push(transferBaseId);
    await pool.query(
      `INSERT INTO bookings
        (id, kattalai_type_id, kattalai_date, kattalai_month, title, name, star, place, code, mobile,
         amount, country_code, kat_type, regn_date, title_ta, name_ta, star_ta, place_ta, status)
       VALUES (?, ?, 10, 10, 'Thiru', 'Old Devotee Senior', 'Anusam', 'CHENNAI', 'U/1/TRN', '9840999999',
               1000.00, '91', 'Lifetime', '2020-01-01', 'திரு', 'பழைய அன்பர்', 'அனுஷம்', 'சென்னை', 'booked')`,
      [transferBaseId, uchiType.id]
    );

    // Transfer from 'Old Devotee Senior' to Son 'Muthu Kumar Junior'
    const transferPayload = {
      title: 'Selvan',
      title_ta: 'செல்வன்',
      name: 'Muthu Kumar Junior QA',
      name_ta: 'முத்து குமார்',
      star: 'Aswini',
      star_ta: 'அஸ்வினி',
      place: 'MADURAI',
      place_ta: 'மதுரை',
      mobile: '9840888888',
      whatsapp_number: '9840888888',
      email: 'muthu.junior.qa@test.com',
      payment_method: 'cash'
    };

    const res5 = await callTransferBooking(transferBaseId, transferPayload, { id: 'admin-uuid', role: 'admin' });
    assert(res5.status === 200, 'POST /api/bookings/:id/transfer returns 200 OK');
    assert(res5.data && res5.data.booking, 'Transfer returns updated booking');

    const { rows: verify5 } = await pool.query('SELECT * FROM bookings WHERE id = ?', [transferBaseId]);
    const row5 = verify5[0];
    assert(row5.name === 'Muthu Kumar Junior QA', 'Transferred new devotee name updated');
    assert(row5.name_ta === 'முத்து குமார்', 'Transferred new devotee Tamil name updated');
    assert(row5.kat_type === 'Inheritance', 'Sponsorship type automatically permanently set to "Inheritance"');
    assert(row5.is_transferred === 1, 'is_transferred flagged as 1');
    assert(row5.transferred_at !== null, 'transferred_at timestamp recorded');
    assert(row5.transferred_from_name === 'Old Devotee Senior', 'Previous devotee name recorded in audit column');
    // Difference: Base 3500 - Old 1000 = 2500
    assert(parseFloat(row5.transferred_fee_paid) === 2500, 'Transferred fee paid recorded as difference: ₹2,500 (3500 - 1000)', `Paid: ${row5.transferred_fee_paid}`);

    // Verify negative test: Second transfer attempt must be REJECTED (1-time rule)
    const res5Second = await callTransferBooking(transferBaseId, { name: 'Attempt Second Transfer' }, { id: 'admin-uuid', role: 'admin' });
    assert(res5Second.status === 400, 'Second transfer attempt on already transferred account rejected with 400', res5Second.data?.error);

    // ========================================================================
    // TEST 6: Validation & Error Handling (Missing Fields)
    // ========================================================================
    console.log('\n--- TEST 6: Input Validations & Rejections ---');
    // 6.1 Missing name
    const res6MissingName = await callCreateBooking({ kattalai_type_id: uchiType.id, kattalai_date: 5, kattalai_month: 5 });
    assert(res6MissingName.status === 400, 'Registration without devotee name returns 400 Bad Request');

    // 6.2 Missing date or month
    const res6MissingDate = await callCreateBooking({ kattalai_type_id: uchiType.id, name: 'No Date QA' });
    assert(res6MissingDate.status === 400, 'Registration without kattalai date returns 400 Bad Request');

    // 6.3 Auto-resolution of placeholder type IDs ('morning_default')
    const res6AutoType = await callCreateBooking({
      kattalai_type_id: 'morning_default',
      kattalai_date: 12,
      kattalai_month: 12,
      title: 'Thiru',
      name: 'Auto Resolve Type QA',
      code: 'U/1/AR1'
    });
    assert(res6AutoType.status === 201, 'Placeholder "morning_default" automatically resolves to active Uchikala type ID');
    if (res6AutoType.data?.id) createdTestBookingIds.push(res6AutoType.data.id);

    // ========================================================================
    // TEST 7: Unicode & Tamil UTF-8 Full Roundtrip
    // ========================================================================
    console.log('\n--- TEST 7: Tamil UTF-8 Roundtrip & Panchangam Integrity ---');
    const tamilSample = 'ஸ்ரீ வைராவி அம்மன் திருக்கோயில் திருப்பணி';
    const res7 = await callCreateBooking({
      kattalai_type_id: uchiType.id,
      kattalai_date: 20,
      kattalai_month: 11,
      title: 'Thiru',
      name: 'Tamil UTF8 Test QA',
      title_ta: 'திரு',
      name_ta: tamilSample,
      star: 'Anusam',
      star_ta: 'அனுஷம்',
      place: 'CHENNAI',
      place_ta: 'சென்னை',
      code: 'U/3/UTF8'
    });
    assert(res7.status === 201, 'Booking with complex Tamil text created successfully');
    if (res7.data?.id) createdTestBookingIds.push(res7.data.id);

    const { rows: verify7 } = await pool.query('SELECT name_ta FROM bookings WHERE id = ?', [res7.data?.id]);
    assert(verify7[0].name_ta === tamilSample, 'Complex Tamil string stored and retrieved with 100% byte fidelity', verify7[0].name_ta);

    // ========================================================================
    // TEST 8: Full Clean-up of Test Records
    // ========================================================================
    console.log('\n--- CLEANUP: Removing Test Bookings ---');
    if (createdTestBookingIds.length > 0) {
      for (const tId of createdTestBookingIds) {
        await pool.query('DELETE FROM history_logs WHERE booking_id = ?', [tId]);
        await pool.query('DELETE FROM payments WHERE booking_id = ?', [tId]);
        await pool.query('DELETE FROM devotee_passwords WHERE booking_id = ?', [tId]);
        await pool.query('DELETE FROM bookings WHERE id = ?', [tId]);
      }
      console.log(`  🧹 Cleaned up ${createdTestBookingIds.length} test bookings from database.`);
    }

  } catch (globalErr) {
    console.error('Fatal error during QA suite:', globalErr);
    assert(false, 'Global QA Suite crashed', globalErr.message);
  } finally {
    // Final cleanup sweep in case of crash
    for (const tId of createdTestBookingIds) {
      try { await pool.query('DELETE FROM bookings WHERE id = ?', [tId]); } catch (_) {}
    }
  }

  console.log('\n========================================================================');
  console.log(`🏁  QA RESULTS: ${passed} PASSED | ${failed} FAILED  🏁`);
  console.log('========================================================================');

  if (failed > 0) {
    console.error('\n⚠️  FAILURES REPORT:');
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.testName}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🌟  ALL REGISTRATION PATHS, LOGICS & LOCAL/DATABASE SYSTEMS VERIFIED 100% CLEAN!  🌟\n');
    process.exit(0);
  }
}

runRegistrationQA();
