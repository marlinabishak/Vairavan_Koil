const pool = require('./pool');
const bcrypt = require('bcryptjs');

const UCHIKALA_TYPE_ID = '6ac54970-b720-11f1-a912-40c2ba2be375';
const ARTHAJAMA_TYPE_ID = '6ac58b1d-b720-11f1-a912-40c2ba2be375';

const DEMO_PASSWORD_PLAIN = 'vkndps2027';

async function seedDemoUsers() {
  try {
    const today = new Date();
    const currDate = today.getDate();
    const currMonth = today.getMonth() + 1;
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD_PLAIN, 10);

    // 1. Uchikkalam Demo Booking (U/0/00)
    const uBookingId = 'demo-uchikkalam-0000-000000000001';
    await pool.query(`
      INSERT INTO bookings (
        id, kattalai_type_id, kattalai_date, kattalai_month,
        title, title_ta, name, name_ta, star, star_ta,
        place, place_ta, code, mobile, whatsapp_number,
        whatsapp_same_as_mobile, email, per_add_1, per_add_2, per_add_3,
        comm_add_1, comm_add_2, comm_add_3, amount, kat_type,
        status, comments
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27
      )
      ON DUPLICATE KEY UPDATE
        kattalai_type_id = VALUES(kattalai_type_id),
        kattalai_date = VALUES(kattalai_date),
        kattalai_month = VALUES(kattalai_month),
        title = VALUES(title),
        title_ta = VALUES(title_ta),
        name = VALUES(name),
        name_ta = VALUES(name_ta),
        star = VALUES(star),
        star_ta = VALUES(star_ta),
        place = VALUES(place),
        place_ta = VALUES(place_ta),
        code = VALUES(code),
        mobile = VALUES(mobile),
        whatsapp_number = VALUES(whatsapp_number),
        email = VALUES(email),
        kat_type = VALUES(kat_type),
        status = VALUES(status)
    `, [
      uBookingId, UCHIKALA_TYPE_ID, currDate, currMonth,
      'Thiru', 'திரு', 'Demo Devotee (Uchikkalam)', 'டெமோ பக்தர் (உச்சிகாலம்)', 'Aswathi', 'அசுவினி',
      'Karaikudi', 'காரைக்குடி', 'U/0/00', '9876543210', '9876543210',
      1, 'demo.uchikkalam@vairavankoil.org',
      'Demo Illam, No. 1 Sannathi Street', 'Vairavanpatti', 'Sivagangai District - 630212',
      'Demo Illam, No. 1 Sannathi Street', 'Vairavanpatti', 'Sivagangai District - 630212',
      3500.00, 'Lifetime', 'active',
      'Demo Account for Uchikala Kattalai (11:30 AM Pooja) testing and verification'
    ]);

    // 2. Arthajamam Demo Booking (A/0/00)
    const aBookingId = 'demo-arthajamam-0000-000000000002';
    await pool.query(`
      INSERT INTO bookings (
        id, kattalai_type_id, kattalai_date, kattalai_month,
        title, title_ta, name, name_ta, star, star_ta,
        place, place_ta, code, mobile, whatsapp_number,
        whatsapp_same_as_mobile, email, per_add_1, per_add_2, per_add_3,
        comm_add_1, comm_add_2, comm_add_3, amount, kat_type,
        status, comments
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27
      )
      ON DUPLICATE KEY UPDATE
        kattalai_type_id = VALUES(kattalai_type_id),
        kattalai_date = VALUES(kattalai_date),
        kattalai_month = VALUES(kattalai_month),
        title = VALUES(title),
        title_ta = VALUES(title_ta),
        name = VALUES(name),
        name_ta = VALUES(name_ta),
        star = VALUES(star),
        star_ta = VALUES(star_ta),
        place = VALUES(place),
        place_ta = VALUES(place_ta),
        code = VALUES(code),
        mobile = VALUES(mobile),
        whatsapp_number = VALUES(whatsapp_number),
        email = VALUES(email),
        kat_type = VALUES(kat_type),
        status = VALUES(status)
    `, [
      aBookingId, ARTHAJAMA_TYPE_ID, currDate, currMonth,
      'Thiru', 'திரு', 'Demo Devotee (Arthajamam)', 'டெமோ பக்தர் (அர்த்தஜாமம்)', 'Rohini', 'ரோகிணி',
      'Devakottai', 'தேவகோட்டை', 'A/0/00', '9876543211', '9876543211',
      1, 'demo.arthajamam@vairavankoil.org',
      'Demo Illam, No. 2 Kovil Theru', 'Vairavanpatti', 'Sivagangai District - 630212',
      'Demo Illam, No. 2 Kovil Theru', 'Vairavanpatti', 'Sivagangai District - 630212',
      3500.00, 'Lifetime', 'active',
      'Demo Account for Arthajama Kattalai (7:30 PM Pooja) testing and verification'
    ]);

    // 3. Upsert Passwords into devotee_passwords
    await pool.query(`
      INSERT INTO devotee_passwords (id, booking_id, office_code, email, password_hash, is_custom_password)
      VALUES ($1, $2, $3, $4, $5, 1)
      ON DUPLICATE KEY UPDATE
        office_code = VALUES(office_code),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        is_custom_password = 1
    `, [
      'demo-pw-uchikkalam-000000000001',
      uBookingId,
      'U/0/00',
      'demo.uchikkalam@vairavankoil.org',
      passwordHash
    ]);

    await pool.query(`
      INSERT INTO devotee_passwords (id, booking_id, office_code, email, password_hash, is_custom_password)
      VALUES ($1, $2, $3, $4, $5, 1)
      ON DUPLICATE KEY UPDATE
        office_code = VALUES(office_code),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        is_custom_password = 1
    `, [
      'demo-pw-arthajamam-000000000002',
      aBookingId,
      'A/0/00',
      'demo.arthajamam@vairavankoil.org',
      passwordHash
    ]);

    // 4. Ensure payments exist for demo bookings
    await pool.query(`
      INSERT INTO payments (id, booking_id, amount, method, status, transaction_ref, paid_at)
      VALUES ($1, $2, $3, 'cash', 'paid', $4, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        status = VALUES(status)
    `, [
      'demo-pay-uchikkalam-000000000001',
      uBookingId,
      3500.00,
      'DEMO-TXN-U000'
    ]);

    await pool.query(`
      INSERT INTO payments (id, booking_id, amount, method, status, transaction_ref, paid_at)
      VALUES ($1, $2, $3, 'cash', 'paid', $4, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        status = VALUES(status)
    `, [
      'demo-pay-arthajamam-000000000002',
      aBookingId,
      3500.00,
      'DEMO-TXN-A000'
    ]);

    return true;
  } catch (err) {
    console.error('Error seeding demo users:', err);
    throw err;
  }
}

if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDemoUsers;
