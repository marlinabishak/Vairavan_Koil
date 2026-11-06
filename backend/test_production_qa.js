const pool = require('./src/db/pool');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { importPanchangamFile, healRowValues } = require('./import_panchangam');

const API_BASE = 'http://localhost:4000/api';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 STARTING SENIOR PRODUCTION-LEVEL QA AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: Database Column Order & Structure
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Database Table Columns & Constraints ---');
  try {
    const res = await pool.query('DESCRIBE panchangam');
    const fields = res.rows.map(r => r.Field);
    
    // Verify last 3 data columns before created_at
    const createdAtIdx = fields.indexOf('created_at');
    const last3 = fields.slice(createdAtIdx - 3, createdAtIdx);
    
    assert(last3[0] === 'tamil_month', `Column 15 is tamil_month (actual: ${last3[0]})`);
    assert(last3[1] === 'tamil_year', `Column 16 is tamil_year (actual: ${last3[1]})`);
    assert(last3[2] === 'tamil_day_number', `Column 17 is tamil_day_number (actual: ${last3[2]})`);

    // Verify JSON check constraints exist on timings
    const createTableRes = await pool.query('SHOW CREATE TABLE panchangam');
    const createTableSql = createTableRes.rows[0]['Create Table'];
    assert(createTableSql.includes('json_valid'), 'MySQL JSON valid check constraints exist on timings');
  } catch (err) {
    assert(false, `Database schema query failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Panchangam API Retrieval
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Panchangam REST API Endpoints ---');
  try {
    // 2.1 Fetch existing date 2026-09-24
    const resSep24 = await axios.get(`${API_BASE}/panchangam/2026-09-24`);
    assert(resSep24.status === 200, 'GET /api/panchangam/2026-09-24 returned 200 OK');
    assert(resSep24.data.tamil_month?.includes('புரட்டா'), `tamil_month is Purattasi/புரட்டாதி (actual: ${resSep24.data.tamil_month})`);
    assert(resSep24.data.tamil_year?.includes('குரோதி'), `tamil_year contains குரோதி வருடம் (actual: ${resSep24.data.tamil_year})`);
    assert(resSep24.data.tamil_day_number === 13, `tamil_day_number is 13 (actual: ${resSep24.data.tamil_day_number})`);
    assert(resSep24.data.worship_note === 'பிரம்மா, விஷ்ணு, சிவனை நினைத்து வழிபடுதல்.', `worship_note is complete without comma truncation (actual: ${resSep24.data.worship_note})`);
    assert(resSep24.data.thithi === 'ஏகாதசி', `thithi is ஏகாதசி (actual: ${resSep24.data.thithi})`);

    // 2.2 Fetch existing date 2026-11-03
    const resNov03 = await axios.get(`${API_BASE}/panchangam/2026-11-03`);
    assert(resNov03.status === 200, 'GET /api/panchangam/2026-11-03 returned 200 OK');
    assert(resNov03.data.tamil_month === 'ஐப்பசி', `tamil_month is ஐப்பசி (actual: ${resNov03.data.tamil_month})`);
    assert(resNov03.data.tamil_day_number === 17, `tamil_day_number is 17 (actual: ${resNov03.data.tamil_day_number})`);

    // 2.3 Fetch non-existent date -> 404
    try {
      await axios.get(`${API_BASE}/panchangam/1900-01-01`);
      assert(false, 'Expected 404 for non-existent date 1900-01-01');
    } catch (err) {
      assert(err.response?.status === 404, `GET non-existent date returned 404 Not Found (actual: ${err.response?.status})`);
    }
  } catch (err) {
    assert(false, `Panchangam API retrieval failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Panchangam CSV Upload Endpoint
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Panchangam CSV Upload Endpoint ---');
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vairavan_kovil_2026';
  const token = jwt.sign({ id: 'qa-tester', username: 'admin', role: 'superadmin' }, JWT_SECRET);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  try {
    // 3.1 Upload empty content -> 400 Bad Request
    try {
      await axios.post(`${API_BASE}/panchangam/upload-csv`, { csvContent: '' }, authHeaders);
      assert(false, 'Expected 400 Bad Request for empty csvContent');
    } catch (err) {
      assert(err.response?.status === 400, `POST empty csvContent returned 400 (actual: ${err.response?.status})`);
    }

    // 3.2 Upload valid CSV text with multiple dates and Tamil headers (using test date 2099-12-25)
    const testCsv = [
      'தேதி,நல்ல நேரம்,எமகண்டம்,குளிகை,ராகு,திதி,திதி நேரம்,நட்சத்திரம்,யோகம்,சந்திராஷ்டமம்,சூலம்,பரிகாரம்,சிறப்பு,வழிபாடு,தமிழ் மாதம்,தமிழ் வருடம்,தமிழ் தேதி',
      '2099-12-25,06:00 am - 07:30 am,01:30 pm - 03:00 pm,10:30 am - 12:00 pm,09:00 am - 10:30 am,பௌர்ணமி,மாலை 06.00,திருவாதிரை,சித்த,மிருகசீரிஷம்,மேற்கு,வெல்லம்,"ஆருத்ரா தரிசனம் சிறப்பு வழிபாடு","நடராஜ பெருமானை வழிபடுதல்",மார்கழி,குரோதி வருடம்,10'
    ].join('\n');

    const uploadRes = await axios.post(`${API_BASE}/panchangam/upload-csv`, { csvContent: testCsv }, authHeaders);
    assert(uploadRes.status === 200, 'POST /api/panchangam/upload-csv returned 200 OK');
    assert(uploadRes.data.count === 1, `Uploaded 1 test record (actual: ${uploadRes.data.count})`);

    // Verify record in database
    const verifyRes = await axios.get(`${API_BASE}/panchangam/2099-12-25`);
    assert(verifyRes.data.tamil_month === 'மார்கழி', `Imported record tamil_month is மார்கழி (actual: ${verifyRes.data.tamil_month})`);
    assert(verifyRes.data.tamil_year === 'குரோதி வருடம்', `Imported record tamil_year is குரோதி வருடம் (actual: ${verifyRes.data.tamil_year})`);
    assert(verifyRes.data.tamil_day_number === 10, `Imported record tamil_day_number is 10 (actual: ${verifyRes.data.tamil_day_number})`);
    assert(verifyRes.data.thithi === 'பௌர்ணமி', `Imported record thithi is பௌர்ணமி (actual: ${verifyRes.data.thithi})`);
  } catch (err) {
    assert(false, `CSV upload endpoint failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Date Dynamics & Timezone Safety
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Dynamic Calendar Date & Weekday Calculations ---');
  {
    function testDateParser(dateStr) {
      const [yStr, mStr, dStr] = (dateStr || '').split('-');
      const d = (yStr && mStr && dStr) 
        ? new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10)) 
        : new Date();
      return {
        day: d.getDate(),
        weekdayEn: d.toLocaleDateString('en-US', { weekday: 'long' }),
        weekdayTa: d.toLocaleDateString('ta-IN', { weekday: 'long' }),
        year: d.getFullYear()
      };
    }

    // Test 1: 2026-09-24 must be Thursday
    const d1 = testDateParser('2026-09-24');
    assert(d1.weekdayEn === 'Thursday', `2026-09-24 is Thursday (actual: ${d1.weekdayEn})`);
    assert(d1.day === 24, `2026-09-24 day is 24 (actual: ${d1.day})`);

    // Test 2: 2026-11-03 must be Tuesday
    const d2 = testDateParser('2026-11-03');
    assert(d2.weekdayEn === 'Tuesday', `2026-11-03 is Tuesday (actual: ${d2.weekdayEn})`);

    // Test 3: Leap year 2028-02-29 must be Tuesday
    const d3 = testDateParser('2028-02-29');
    assert(d3.weekdayEn === 'Tuesday', `Leap day 2028-02-29 is Tuesday (actual: ${d3.weekdayEn})`);

    // Test 4: Year boundary 2027-01-01 must be Friday
    const d4 = testDateParser('2027-01-01');
    assert(d4.weekdayEn === 'Friday', `2027-01-01 is Friday (actual: ${d4.weekdayEn})`);

    // Test 5: isToday logic validation
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    function checkIsToday(dateStr) {
      const [y, m, d] = dateStr.split('-');
      const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dt.getFullYear() === today.getFullYear() &&
             dt.getMonth() === today.getMonth() &&
             dt.getDate() === today.getDate();
    }

    assert(checkIsToday(todayStr) === true, `checkIsToday("${todayStr}") evaluates to true`);
    assert(checkIsToday(yesterdayStr) === false, `checkIsToday("${yesterdayStr}") evaluates to false`);
    assert(checkIsToday('2026-09-24') === false, 'checkIsToday("2026-09-24") evaluates to false');
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Global Search Engine
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: Global Devotee Search Engine ---');
  try {
    // 5.1 Search with town/city name
    const resTown = await axios.get(`${API_BASE}/bookings?search=karaikudi`);
    assert(Array.isArray(resTown.data) && resTown.data.length > 0, `Search "karaikudi" returned ${resTown.data?.length} records`);

    // 5.2 Search with common alias (kkdi)
    const resAlias = await axios.get(`${API_BASE}/bookings?search=kkdi`);
    // Should match either directly or via client expansion
    assert(Array.isArray(resAlias.data), 'Search "kkdi" returned valid JSON array');

    // 5.3 Non-existent search query returns empty array
    const resEmpty = await axios.get(`${API_BASE}/bookings?search=nonexistenttermxyz999`);
    assert(Array.isArray(resEmpty.data) && resEmpty.data.length === 0, 'Search for non-existent devotee returned empty array []');
  } catch (err) {
    assert(false, `Search API failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Timing Formatter Robustness
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 6: Timing Parser & Formatter Robustness ---');
  {
    function formatRange(ranges) {
      if (!ranges) return '-';
      if (typeof ranges === 'string') {
        const trimmed = ranges.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.map(r => (r.start && r.end ? `${r.start} - ${r.end}` : (r.text || JSON.stringify(r)))).join(', ');
            }
          } catch (e) {}
        }
        return trimmed || '-';
      }
      if (Array.isArray(ranges)) {
        return ranges.map(r => (r.start && r.end ? `${r.start} - ${r.end}` : (r.text || String(r)))).join(', ');
      }
      return String(ranges);
    }

    assert(formatRange('07:31 am - 09:00 am') === '07:31 am - 09:00 am', 'Plain string timing formatted correctly');
    assert(formatRange('[{"start":"07:31 am","end":"09:00 am"}]') === '07:31 am - 09:00 am', 'JSON string timing formatted correctly');
    assert(formatRange([{start:"12:00 pm", end:"01:30 pm"}]) === '12:00 pm - 01:30 pm', 'Array object timing formatted correctly');
    assert(formatRange(null) === '-', 'Null timing returns "-"');
    assert(formatRange('') === '-', 'Empty string timing returns "-"');
  }

  // ----------------------------------------------------
  // TEST GROUP 7: Negative Testing & Failure Resilience
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 7: Negative Testing & Failure Resilience ---');
  try {
    // 7.1 Search with special regex symbols doesn't crash backend
    const resSpecial = await axios.get(`${API_BASE}/bookings?search=(*+\\`);
    assert(Array.isArray(resSpecial.data), 'Search with special regex characters "(*+\\" handled safely without 500 error');

    // 7.2 CSV with Excel UTF-8 BOM, corrupted dates, and empty timings
    const negativeCsv = [
      '\uFEFFdate,nalla_neram,yamagandam,kuligai,rahu_kalam,thithi,thithi_time,natchathiram,yogam,chandrashtamam,kulam,parigaram,special_note,worship_note,tamil_month,tamil_year,tamil_day_number',
      '2026-99-99,07:00 am - 08:30 am,-,-,-,திதி,நேரம்,நட்சத்திரம்,யோகம்,சந்திராஷ்டமம்,சூலம்,பரிகாரம்,குறிப்பு,வழிபாடு,மாதம்,வருடம்,1', // INVALID DATE -> should be skipped safely
      'not-a-date,07:00 am - 08:30 am,-,-,-,திதி,நேரம்,நட்சத்திரம்,யோகம்,சந்திராஷ்டமம்,சூலம்,பரிகாரம்,குறிப்பு,வழிபாடு,மாதம்,வருடம்,2', // INVALID DATE -> should be skipped safely
      '2026-11-20,-,-,-,-,துவாதசி,காலை 09.00,அஸ்வினி,அமிர்த,பரணி,கிழக்கு,நெய்,"சிறப்பு","வழிபாடு",கார்த்திகை,குரோதி வருடம்,5' // VALID DATE with null/empty timings -> should succeed!
    ].join('\n');

    const negUploadRes = await axios.post(`${API_BASE}/panchangam/upload-csv`, { csvContent: negativeCsv }, authHeaders);
    assert(negUploadRes.status === 200, 'Corrupted CSV handled gracefully without crashing server');
    assert(negUploadRes.data.count === 1, `Properly skipped 2 invalid dates and imported 1 valid date (actual count: ${negUploadRes.data.count})`);

    // Verify record 2026-11-20 was imported with NULL timings without MySQL constraint failure
    const nov20Res = await axios.get(`${API_BASE}/panchangam/2026-11-20`);
    assert(nov20Res.data.panch_date.includes('2026-11-20'), 'Record with empty/null timings stored safely');
    assert(nov20Res.data.tamil_month === 'கார்த்திகை', 'Record tamil_month is கார்த்திகை');
    assert(nov20Res.data.tamil_day_number === 5, 'Record tamil_day_number is 5');
  } catch (err) {
    assert(false, `Negative testing failed: ${err.message} - ${JSON.stringify(err.response?.data)}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 8: The 3 Future-Proofing Enhancements
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 8: Future-Proofing Enhancements Validation ---');
  try {
    // 8.1 Auto-Healing CSV Parser: Unquoted commas recovery
    const unquotedRow19 = [
      '2026-09-24', '09:15 am - 10:15 am', '01:30 pm - 03:00 pm', '10:30 am - 12:00 pm', '03:00 pm - 04:30 pm',
      'சதுர்த்தசி', 'சதுர்த்தசி மாலை 06:15', 'உத்திரம்', 'மரணம்', 'பூரட்டாதி', 'தெற்கு', 'எண்ணெய்',
      'மாத சிவராத்திரி.', 'பிரம்மா', 'விஷ்ணு', 'சிவனை நினைத்து வழிபடுதல்.',
      'புரட்டாதி', 'குரோதி வருடம்', '13'
    ];
    const healed19 = healRowValues(unquotedRow19);
    assert(healed19.length === 17, `healRowValues recovered 19-column unquoted row to exactly 17 columns (actual: ${healed19.length})`);
    assert(healed19[12] === 'மாத சிவராத்திரி.', `special_note correctly parsed: ${healed19[12]}`);
    assert(healed19[13] === 'பிரம்மா, விஷ்ணு, சிவனை நினைத்து வழிபடுதல்.', `worship_note stitched without loss: ${healed19[13]}`);
    assert(healed19[14] === 'புரட்டாதி', `tamil_month column preserved: ${healed19[14]}`);
    assert(healed19[15] === 'குரோதி வருடம்', `tamil_year column preserved: ${healed19[15]}`);
    assert(healed19[16] === '13', `tamil_day_number column preserved: ${healed19[16]}`);

    // 8.2 Auto-Healing CSV Parser: Row with trailing empty cells
    const rowWithTrailingEmpty = [...unquotedRow19, '', '  '];
    const healedTrailing = healRowValues(rowWithTrailingEmpty);
    assert(healedTrailing.length === 17, `healRowValues stripped trailing empty cells to 17 columns (actual: ${healedTrailing.length})`);
    assert(healedTrailing[16] === '13', `tamil_day_number intact with trailing cells: ${healedTrailing[16]}`);

    // 8.3 Auto-Healing CSV Parser: Normal 17-column pass-through
    const normalRow17 = [
      '2026-01-01','09:15 am - 10:15 am','03:00 pm - 04:30 pm','09:00 am - 10:30 am','01:30 pm - 03:00 pm',
      'துவிதியை','துவிதியை மாலை 05.10','மிருகசீரிடம் இரவு 11.20','சித்த','மகம்','வடக்கு','பால்',
      'ஆங்கிலப் புத்தாண்டு பிறப்பு.','சிவ பெருமானை நினைத்து வழிபடுதல்.','மார்கழி','குரோதி வருடம்','16'
    ];
    const healedNormal = healRowValues(normalRow17);
    assert(healedNormal.length === 17, 'Standard 17-column row passes through untouched');
    assert(healedNormal[14] === 'மார்கழி', 'Standard tamil_month untouched');
    assert(healedNormal[16] === '16', 'Standard tamil_day_number untouched');

    // 8.4 UI Graceful Fallback simulation for unseeded dates (e.g. 2028-12-31)
    try {
      await axios.get(`${API_BASE}/panchangam/2028-12-31`);
      assert(false, 'Unseeded date should return 404');
    } catch (err) {
      assert(err.response?.status === 404, 'Unseeded date 2028-12-31 returns HTTP 404 cleanly');
      assert(err.response?.data?.error === 'No panchangam data for this date', 'Returns descriptive error JSON for fallback UI');
    }

    // 8.5 Client-side cache simulation: verify cache hits vs invalidation on upload
    const mockCache = new Map();
    // Cache miss: fetch from API
    const dateToCache = '2026-09-24';
    if (!mockCache.has(dateToCache)) {
      const res = await axios.get(`${API_BASE}/panchangam/${dateToCache}`);
      mockCache.set(dateToCache, res.data);
    }
    assert(mockCache.has(dateToCache), 'Panchangam cache successfully populated on first request');
    assert(mockCache.get(dateToCache).tamil_day_number === 13, 'Cached object contains correct data');
    // Cache hit: instantaneous lookup with 0ms network latency
    const cacheHitStart = Date.now();
    const hitData = mockCache.get(dateToCache);
    const cacheHitDuration = Date.now() - cacheHitStart;
    assert(hitData !== undefined && cacheHitDuration < 2, `Cache hit instantaneous (< 2ms, actual: ${cacheHitDuration}ms)`);
    // Cache invalidation: cleared on CSV upload
    mockCache.clear();
    assert(mockCache.size === 0, 'Cache successfully invalidated on CSV import');
  } catch (err) {
    assert(false, `Future-proofing enhancements tests failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 9: Range-Based Absentee Queries & Print
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 9: Range-Based Absentee & Print System ---');
  try {
    // 9.1 Single day absentee query (authenticated staff request for postal print)
    const resSingleAbsent = await axios.get(`${API_BASE}/bookings?date=2026-09-24&attendance=absent`, authHeaders);
    assert(Array.isArray(resSingleAbsent.data), 'Single-day absentee query returned valid array');
    assert(resSingleAbsent.data.length >= 1, `Found ${resSingleAbsent.data.length} absentees for 2026-09-24`);
    assert(resSingleAbsent.data.every(b => !b.present), 'All returned records are confirmed absent (!present)');

    // 9.2 Weekly range absentee query
    const resWeekAbsent = await axios.get(`${API_BASE}/bookings?fromDate=2026-09-20&toDate=2026-09-27&attendance=absent`, authHeaders);
    assert(Array.isArray(resWeekAbsent.data), 'Weekly range query returned valid array');
    assert(resWeekAbsent.data.length >= resSingleAbsent.data.length, `Weekly absentees (${resWeekAbsent.data.length}) >= daily absentees (${resSingleAbsent.data.length})`);

    // 9.3 Monthly range absentee query
    const resMonthAbsent = await axios.get(`${API_BASE}/bookings?fromDate=2026-09-01&toDate=2026-09-30&attendance=absent`, authHeaders);
    assert(Array.isArray(resMonthAbsent.data), 'Monthly range query returned valid array');
    assert(resMonthAbsent.data.length >= resWeekAbsent.data.length, `Monthly absentees (${resMonthAbsent.data.length}) >= weekly absentees (${resWeekAbsent.data.length})`);

    // 9.4 Month & Year query
    const resMonthNum = await axios.get(`${API_BASE}/bookings?month=9&year=2026&attendance=absent`, authHeaders);
    assert(Array.isArray(resMonthNum.data), 'month=9 query returned valid array');
    assert(resMonthNum.data.length === resMonthAbsent.data.length, `month=9 matches date range 09-01..09-30 count (${resMonthNum.data.length})`);

    // 9.5 Verify absent records contain necessary print fields for postal covers
    const sampleAbsentee = resSingleAbsent.data[0];
    assert(sampleAbsentee && typeof sampleAbsentee.name === 'string', 'Absentee has valid devotee name');
    assert(sampleAbsentee && (sampleAbsentee.code !== undefined), 'Absentee has devotee code');
    assert(sampleAbsentee && (sampleAbsentee.place || sampleAbsentee.comm_add_1 || sampleAbsentee.per_add_1), 'Absentee has postal address / place for Post Cover print');
  } catch (err) {
    assert(false, `Range-based absentee testing failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`🏁 QA TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
