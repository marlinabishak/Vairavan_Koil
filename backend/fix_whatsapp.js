const fs = require('fs');

async function fixWhatsappLogic() {
  const file1 = './src/controllers/whatsappController.js';
  let c1 = fs.readFileSync(file1, 'utf8');

  // Fix Date Format and Kattalai Name
  c1 = c1.replace(
    /const formattedKattalaiDate = `\$\{kDate\}\.\$\{kMonth\}\.\$\{String\(new Date\(\)\.getFullYear\(\)\)\.slice\(2\)\}`;/g,
    `const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedKattalaiDate = \`\${kDate}.\${monthNames[parseInt(row.kattalai_month) - 1]}.\${String(new Date().getFullYear()).slice(2)}\`;

      let finalKattalaiName = row.kattalai_name || '';
      let finalKattalaiNameTa = row.kattalai_name_ta || '';
      if (finalKattalaiName.toLowerCase().includes('uchi')) {
        finalKattalaiName = 'Uchikkalam';
        finalKattalaiNameTa = 'உச்சிக்காலம்';
      } else if (finalKattalaiName.toLowerCase().includes('artha')) {
        finalKattalaiName = 'Arthajamam';
        finalKattalaiNameTa = 'அர்த்தஜாமம்';
      }`
  );
  
  // Update where finalKattalaiName is used
  c1 = c1.replace(
    /row\.kattalai_name,/g,
    `finalKattalaiName,`
  );
  c1 = c1.replace(
    /row\.kattalai_name_ta \|\| row\.kattalai_name,/g,
    `finalKattalaiNameTa || finalKattalaiName,`
  );

  fs.writeFileSync(file1, c1, 'utf8');
  console.log("Updated whatsappController.js");
  
  // Repeat for bookingsController.js (exportWhatsappCampaign function)
  const file2 = './src/controllers/bookingsController.js';
  let c2 = fs.readFileSync(file2, 'utf8');
  
  c2 = c2.replace(
    /if \(row\.booking_date\) \{[\s\S]*?formattedKattalaiDate = \`\$\{day\}\.\$\{month\}\.\$\{year\}\`;[\s\S]*?\}/g,
    `if (row.kattalai_date && row.kattalai_month) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const kDate = String(row.kattalai_date).padStart(2, '0');
        const kMonthStr = monthNames[parseInt(row.kattalai_month) - 1];
        const kYear = String(new Date().getFullYear()).slice(2);
        formattedKattalaiDate = \`\${kDate}.\${kMonthStr}.\${kYear}\`;
      }
      
      let finalKattalaiName = row.kattalai_name || '';
      let finalKattalaiNameTa = row.kattalai_name_ta || '';
      if (finalKattalaiName.toLowerCase().includes('uchi')) {
        finalKattalaiName = 'Uchikkalam';
        finalKattalaiNameTa = 'உச்சிக்காலம்';
      } else if (finalKattalaiName.toLowerCase().includes('artha')) {
        finalKattalaiName = 'Arthajamam';
        finalKattalaiNameTa = 'அர்த்தஜாமம்';
      }`
  );
  
  // For whatsapp export
  c2 = c2.replace(
    /isTamil \? \(row\.kattalai_name_ta \|\| row\.kattalai_name \|\| ''\) : \(row\.kattalai_name \|\| ''\)/g,
    `isTamil ? (finalKattalaiNameTa || finalKattalaiName || '') : (finalKattalaiName || '')`
  );

  fs.writeFileSync(file2, c2, 'utf8');
  console.log("Updated bookingsController.js (whatsapp export)");
}

fixWhatsappLogic();
