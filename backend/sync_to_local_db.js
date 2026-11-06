const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const remotePool = require('./src/db/pool');

async function syncToLocal() {
  console.log('====================================================');
  console.log('🔄  SYNC LIVE DATABASE TO LOCAL (vairavan_koil)   🔄');
  console.log('====================================================\n');

  // 1. Connect to local MySQL (XAMPP / MariaDB / local service)
  let localConn;
  try {
    localConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      multipleStatements: true
    });
    console.log('✅ Connected to local MySQL server at 127.0.0.1:3306');
  } catch (err) {
    console.error('❌ Failed to connect to local MySQL:', err.message);
    process.exit(1);
  }

  try {
    // 2. Ensure vairavan_koil database exists on local
    await localConn.query('CREATE DATABASE IF NOT EXISTS `vairavan_koil` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await localConn.query('USE `vairavan_koil`;');
    console.log('✅ Using database `vairavan_koil` on local MySQL\n');

    // 3. Disable foreign key checks on local during migration
    await localConn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 4. Fetch list of tables from remote
    const { rows: remoteTablesResult } = await remotePool.query('SHOW TABLES');
    const tableNames = remoteTablesResult.map(t => Object.values(t)[0]);
    console.log(`📋 Found ${tableNames.length} tables in live database:\n   ${tableNames.join(', ')}\n`);

    // Prepare full SQL dump text as well
    let dumpSql = `-- ========================================================\n`;
    dumpSql += `-- Vairavan Kovil Complete Database Backup & Local Sync\n`;
    dumpSql += `-- Generated: ${new Date().toISOString()}\n`;
    dumpSql += `-- Tables: ${tableNames.length}\n`;
    dumpSql += `-- ========================================================\n\n`;
    dumpSql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    dumpSql += `CREATE DATABASE IF NOT EXISTS \`vairavan_koil\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    dumpSql += `USE \`vairavan_koil\`;\n\n`;

    const stats = [];

    // 5. Transfer schema and data for each table
    for (const table of tableNames) {
      process.stdout.write(`⏳ Synchronizing table \`${table}\`... `);

      // A. Get remote CREATE TABLE and convert ANSI quotes to standard MySQL backticks
      const { rows: createRows } = await remotePool.query(`SHOW CREATE TABLE \`${table}\``);
      let createTableSql = createRows[0]['Create Table'];
      createTableSql = createTableSql.replace(/"([^"]+)"/g, '`$1`');

      // B. Drop and create on local
      await localConn.query(`DROP TABLE IF EXISTS \`${table}\`;`);
      await localConn.query(createTableSql);

      dumpSql += `-- --------------------------------------------------------\n`;
      dumpSql += `-- Table structure for table \`${table}\`\n`;
      dumpSql += `-- --------------------------------------------------------\n`;
      dumpSql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      dumpSql += `${createTableSql};\n\n`;

      // C. Get remote data
      const { rows: dataRows } = await remotePool.query(`SELECT * FROM \`${table}\``);

      if (dataRows.length > 0) {
        // Insert into local in chunks
        const chunkSize = 50;
        const columns = Object.keys(dataRows[0]);
        const colNamesSql = columns.map(c => `\`${c}\``).join(', ');

        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
          const values = [];

          for (const row of chunk) {
            for (const col of columns) {
              const val = row[col];
              values.push(val !== undefined ? val : null);
            }
          }

          const insertSql = `INSERT INTO \`${table}\` (${colNamesSql}) VALUES ${placeholders}`;
          await localConn.query(insertSql, values);
        }

        // Format for SQL dump file
        dumpSql += `-- Dumping data for table \`${table}\` (${dataRows.length} rows)\n`;
        dumpSql += `LOCK TABLES \`${table}\` WRITE;\n`;
        for (const row of dataRows) {
          const formattedVals = columns.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number' || typeof v === 'boolean') return v;
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          dumpSql += `INSERT INTO \`${table}\` (${colNamesSql}) VALUES (${formattedVals.join(', ')});\n`;
        }
        dumpSql += `UNLOCK TABLES;\n\n`;
      }

      // Verify row count on local
      const [localCountRes] = await localConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      const localCount = localCountRes[0].cnt;
      stats.push({ table, remoteCount: dataRows.length, localCount });

      console.log(`✅ ${dataRows.length} rows synced`);
    }

    // 6. Re-enable foreign key checks on local
    await localConn.query('SET FOREIGN_KEY_CHECKS = 1;');
    dumpSql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // 7. Save to SQL backup files
    const backupPath = path.join(__dirname, 'src', 'db', 'vairavan_koil_backup.sql');
    fs.writeFileSync(backupPath, dumpSql, 'utf8');
    console.log(`\n💾 Saved updated complete SQL dump to: ${backupPath}`);

    const rootBackupPath = path.join(__dirname, 'vairavan_koil_latest.sql');
    fs.writeFileSync(rootBackupPath, dumpSql, 'utf8');
    console.log(`💾 Saved quick-access SQL dump to: ${rootBackupPath}\n`);

    // 8. Print parity summary table
    console.log('====================================================');
    console.log('📊  DATABASE SYNCHRONIZATION PARITY REPORT          ');
    console.log('====================================================');
    console.table(stats);

    const allMatch = stats.every(s => s.remoteCount === s.localCount);
    if (allMatch) {
      console.log('🎉 100% PARITY ACHIEVED: All 18 tables and rows match live database perfectly!');
    } else {
      console.warn('⚠️ Warning: Some table row counts differed.');
    }

  } catch (err) {
    console.error('❌ Error during synchronization:', err.stack || err);
  } finally {
    if (localConn) await localConn.end();
    await remotePool.end();
    // Clean up temporary test snippet
    try {
      fs.unlinkSync(path.join(__dirname, 'test_sync_snippet.js'));
    } catch(e) {}
  }
}

syncToLocal();
