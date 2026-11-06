const pool = require('./pool');

async function migratePrintTracking() {
  console.log('Running migration for print_records table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS print_records (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      user_name VARCHAR(120),
      user_role VARCHAR(50),
      target_date VARCHAR(100) NOT NULL,
      list_title VARCHAR(120),
      devotee_count INT DEFAULT 0,
      devotee_names TEXT,
      print_number INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_target_date (target_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('print_records table is ready.');

  // Backfill existing history_logs print rows
  const { rows: logs } = await pool.query(
    "SELECT id, user_id, details, created_at FROM history_logs WHERE action LIKE '%Print%' ORDER BY created_at ASC"
  );

  console.log(`Found ${logs.length} print logs to backfill...`);

  // Fetch users for accurate name & role
  const { rows: users } = await pool.query("SELECT id, name, role FROM users");
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  // Group by rough session/date
  // The existing logs were on dates: 2026-09-24, 2026-10-12, 2026-10-13, 2026-10-28, 2026-10-31, 2026-11-03, 2026-11-04
  const targetDateGroups = {};

  for (const log of logs) {
    const user = userMap[log.user_id] || { name: 'Staff', role: 'staff' };
    const createdAt = new Date(log.created_at);
    
    // Determine target date from log
    let targetDate = '24 Sep 2026';
    const logDateStr = createdAt.toISOString().slice(0, 10);
    if (logDateStr === '2026-09-24') targetDate = '24 Sep 2026';
    else if (logDateStr === '2026-10-12') targetDate = '12 Oct 2026';
    else if (logDateStr === '2026-10-13') targetDate = '13 Oct 2026';
    else if (logDateStr === '2026-10-28') targetDate = '28 Oct 2026';
    else if (logDateStr === '2026-10-31') targetDate = '31 Oct 2026';
    else if (logDateStr >= '2026-11-03') targetDate = '24 Sep 2026'; // Marlin & Ulthurai tested 24 Sep Viboothi list on Nov 3 & 4

    if (!targetDateGroups[targetDate]) {
      targetDateGroups[targetDate] = [];
    }
    const previousPrints = targetDateGroups[targetDate];
    const printNumber = previousPrints.length + 1;

    // Ordinal helper
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const countMatch = (log.details || '').match(/(\d+)\s+Prasatham/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 2;

    let newDetails = '';
    if (printNumber === 1) {
      newDetails = `1st time printed by ${user.name} [${user.role}] for Date: ${targetDate} (${count} Prasatham letters).`;
    } else if (printNumber === 2) {
      const first = previousPrints[0];
      newDetails = `2nd time printed by ${user.name} [${user.role}] for Date: ${targetDate} (${count} Prasatham letters). 1st time printed by ${first.userName} [${first.userRole}].`;
    } else {
      const first = previousPrints[0];
      const prevPrint = previousPrints[previousPrints.length - 1];
      newDetails = `${getOrdinal(printNumber)} time printed by ${user.name} [${user.role}] for Date: ${targetDate} (${count} Prasatham letters). Previously printed ${previousPrints.length} times (1st: ${first.userName} [${first.userRole}], Last: ${prevPrint.userName} [${prevPrint.userRole}]).`;
    }

    // Update history_logs row
    await pool.query('UPDATE history_logs SET details = $1 WHERE id = $2', [newDetails, log.id]);

    // Insert into print_records
    await pool.query(
      `INSERT INTO print_records (id, user_id, user_name, user_role, target_date, list_title, devotee_count, print_number, created_at)
       VALUES ($1, $2, $3, $4, $5, 'Viboothi to be sent to', $6, $7, $8)`,
      [log.id, log.user_id, user.name, user.role, targetDate, count, printNumber, log.created_at]
    );

    previousPrints.push({
      userName: user.name,
      userRole: user.role,
      printNumber,
      createdAt
    });
  }

  console.log('Migration and backfill completed successfully!');
  process.exit(0);
}

migratePrintTracking().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
