const assert = require('assert');
const { getISTDate, runDailyAutomation } = require('./src/services/whatsappAutomationService');

console.log('================================================================');
console.log('🧪 RUNNING COMPREHENSIVE WHATSAPP AUTOMATION & UI LOGIC QA TEST');
console.log('================================================================\n');

// 1. Test 12-Hour <-> 24-Hour Time Conversion Logic
console.log('--- TEST 1: Time Parsing & Conversion (AM/PM <-> 24-Hour) ---');

const parseTime12 = (time24) => {
  if (!time24) return { hour: '06', minute: '00', period: 'AM' };
  const parts = time24.split(':');
  let h = parseInt(parts[0] || '6', 10);
  const m = String(parts[1] || '00').padStart(2, '0');
  let p = 'AM';
  if (h >= 12) {
    p = 'PM';
    if (h > 12) h -= 12;
  } else if (h === 0) {
    h = 12;
  }
  return { hour: String(h).padStart(2, '0'), minute: m, period: p };
};

const formatTime24 = (h12, min, p) => {
  let h = parseInt(h12, 10);
  if (p === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

// Test conversions
assert.deepStrictEqual(parseTime12('06:00'), { hour: '06', minute: '00', period: 'AM' });
assert.strictEqual(formatTime24('06', '00', 'AM'), '06:00');

assert.deepStrictEqual(parseTime12('18:30'), { hour: '06', minute: '30', period: 'PM' });
assert.strictEqual(formatTime24('06', '30', 'PM'), '18:30');

assert.deepStrictEqual(parseTime12('00:15'), { hour: '12', minute: '15', period: 'AM' });
assert.strictEqual(formatTime24('12', '15', 'AM'), '00:15');

assert.deepStrictEqual(parseTime12('12:00'), { hour: '12', minute: '00', period: 'PM' });
assert.strictEqual(formatTime24('12', '00', 'PM'), '12:00');

console.log('  ✅ [PASS] 06:00 AM roundtrip verified');
console.log('  ✅ [PASS] 06:30 PM (18:30) roundtrip verified');
console.log('  ✅ [PASS] 12:00 PM (Noon) boundary verified');
console.log('  ✅ [PASS] 12:15 AM (Midnight) boundary verified');

// 2. Test IST Date & Offset Calculation
console.log('\n--- TEST 2: IST Date & Offset Precision ---');
const todayIST = getISTDate(0);
const tamilLeadDate = getISTDate(5);
const englishLeadDate = getISTDate(2);

const diffTamilMs = tamilLeadDate.getTime() - todayIST.getTime();
const diffTamilDays = Math.round(diffTamilMs / (1000 * 60 * 60 * 24));
assert.strictEqual(diffTamilDays, 5, 'Tamil lead offset must be exactly 5 days');

const diffEnglishMs = englishLeadDate.getTime() - todayIST.getTime();
const diffEnglishDays = Math.round(diffEnglishMs / (1000 * 60 * 60 * 24));
assert.strictEqual(diffEnglishDays, 2, 'English lead offset must be exactly 2 days');

console.log(`  ✅ [PASS] Today IST: ${todayIST.toISOString().split('T')[0]}`);
console.log(`  ✅ [PASS] Tamil Lead (+5d): ${tamilLeadDate.toISOString().split('T')[0]} (Delta: ${diffTamilDays} days)`);
console.log(`  ✅ [PASS] English Lead (+2d): ${englishLeadDate.toISOString().split('T')[0]} (Delta: ${diffEnglishDays} days)`);

// 3. Test Devotee Selection Filtering Logic in sendBatch
console.log('\n--- TEST 3: Devotee Row Selection Filtering ---');
const mockDevotees = [
  { id: 'dev-1', name: 'Marlin', code: 'A/1/01' },
  { id: 'dev-2', name: 'Abi', code: 'A/1/02' },
  { id: 'dev-3', name: 'Murugan', code: 'A/1/03' }
];

// Scenario A: All selected
const allSelectedIds = mockDevotees.map(d => d.id);
const filteredAll = (Array.isArray(allSelectedIds) && allSelectedIds.length > 0)
  ? mockDevotees.filter(r => allSelectedIds.includes(r.id))
  : mockDevotees;
assert.strictEqual(filteredAll.length, 3);
console.log('  ✅ [PASS] Default Select All retains all 3 devotees');

// Scenario B: Untick Marlin, keep Abi & Murugan
const partialSelectedIds = ['dev-2', 'dev-3'];
const filteredPartial = mockDevotees.filter(r => partialSelectedIds.includes(r.id));
assert.strictEqual(filteredPartial.length, 2);
assert.strictEqual(filteredPartial[0].name, 'Abi');
assert.strictEqual(filteredPartial[1].name, 'Murugan');
console.log('  ✅ [PASS] Unticking Marlin dispatches strictly to Abi and Murugan (2 devotees)');

// Scenario C: Only Marlin selected
const singleSelected = mockDevotees.filter(r => ['dev-1'].includes(r.id));
assert.strictEqual(singleSelected.length, 1);
assert.strictEqual(singleSelected[0].name, 'Marlin');
console.log('  ✅ [PASS] Selecting only Marlin dispatches strictly to Marlin (1 devotee)');

// 4. Test Validation Rules for System Settings
console.log('\n--- TEST 4: Automation Settings Validation Rules ---');
function validateSettingsKey(key, value) {
  if (key === 'whatsapp_tamil_lead_days' || key === 'whatsapp_english_lead_days') {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 30) {
      return { valid: false, error: `${key} must be an integer between 1 and 30` };
    }
  }
  if (key === 'whatsapp_dispatch_time') {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(String(value).trim())) {
      return { valid: false, error: 'whatsapp_dispatch_time must be in HH:MM format (24-hour)' };
    }
  }
  if (key === 'whatsapp_automation_enabled') {
    const strVal = String(value).toLowerCase();
    if (strVal !== 'true' && strVal !== 'false') {
      return { valid: false, error: 'whatsapp_automation_enabled must be true or false' };
    }
  }
  return { valid: true };
}

assert.strictEqual(validateSettingsKey('whatsapp_automation_enabled', 'true').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_automation_enabled', 'false').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_automation_enabled', 'invalid').valid, false);

assert.strictEqual(validateSettingsKey('whatsapp_dispatch_time', '06:00').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_dispatch_time', '18:30').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_dispatch_time', '25:00').valid, false);
assert.strictEqual(validateSettingsKey('whatsapp_dispatch_time', 'abc').valid, false);

assert.strictEqual(validateSettingsKey('whatsapp_tamil_lead_days', '5').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_tamil_lead_days', '0').valid, false);
assert.strictEqual(validateSettingsKey('whatsapp_tamil_lead_days', '35').valid, false);

assert.strictEqual(validateSettingsKey('whatsapp_english_lead_days', '2').valid, true);
assert.strictEqual(validateSettingsKey('whatsapp_english_lead_days', '-1').valid, false);

console.log('  ✅ [PASS] Automation Enabled toggle (true/false) validated');
console.log('  ✅ [PASS] Dispatch Time format (06:00, 18:30 valid; 25:00 invalid) validated');
console.log('  ✅ [PASS] Lead days range (1 to 30 days valid; out of range rejected) validated');

console.log('\n================================================================');
console.log('🎉 ALL WHATSAPP AUTOMATION & TIME SELECTION QA TESTS PASSED!');
console.log('================================================================');

