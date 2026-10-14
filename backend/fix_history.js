const pool = require('./src/db/pool');
const fs = require('fs');

async function fixHistory() {
  // 1. Update bookingsController.js
  const cPath = './src/controllers/bookingsController.js';
  let content = fs.readFileSync(cPath, 'utf8');
  
  content = content.replace(
    /SELECT id, name, CONCAT\(kattalai_date, '-', kattalai_month\) as date_str, present, updated_at[\s\S]*?FROM bookings[\s\S]*?WHERE code = \$1 AND present IS NOT NULL[\s\S]*?ORDER BY updated_at DESC/g,
    `SELECT b.id, b.name, kt.name as kattalai_name, CONCAT(YEAR(CURRENT_DATE()), '-', LPAD(b.kattalai_month, 2, '0'), '-', LPAD(b.kattalai_date, 2, '0')) as date_str, b.present, b.updated_at
       FROM bookings b
       LEFT JOIN kattalai_types kt ON b.kattalai_type_id = kt.id
       WHERE b.code = $1 AND b.present IS NOT NULL
       ORDER BY b.updated_at DESC`
  );
  
  fs.writeFileSync(cPath, content, 'utf8');
  console.log("Updated bookingsController.js");

  // 2. Update MyHistory.jsx
  const mPath = '../frontend/src/pages/MyHistory.jsx';
  let mContent = fs.readFileSync(mPath, 'utf8');
  
  mContent = mContent.replace(
    `{record.name}`,
    `{record.kattalai_name || 'Kattalai'} - {record.name}`
  );
  
  fs.writeFileSync(mPath, mContent, 'utf8');
  console.log("Updated MyHistory.jsx");
}

fixHistory();
