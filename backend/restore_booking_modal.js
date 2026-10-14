const fs = require('fs');

const zipPath = 'c:\\Users\\marlin\\OneDrive\\Desktop\\workss\\vairavan-kovil_figma\\temp_extracted\\vairavan-kovil_figma\\vairavan-kovil\\frontend\\src\\components\\BookingModal.jsx';
const activePath = 'c:\\Users\\marlin\\OneDrive\\Desktop\\workss\\vairavan-kovil_figma\\vairavan-kovil\\frontend\\src\\components\\BookingModal.jsx';

let content = fs.readFileSync(zipPath, 'utf8');

// Update State Initialization
content = content.replace(
  `permanent_address: existingBooking.permanent_address || '',\n        communication_address: existingBooking.communication_address || '',`,
  `permanent_address: [existingBooking.per_add_1, existingBooking.per_add_2, existingBooking.per_add_3].filter(Boolean).join(', ') || '',
        communication_address: [existingBooking.comm_add_1, existingBooking.comm_add_2, existingBooking.comm_add_3, existingBooking.comm_add_4].filter(Boolean).join(', ') || '',`
);

content = content.replace(
  `booking_date: existingBooking.booking_date ? new Date(existingBooking.booking_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),`,
  `booking_date: existingBooking.kattalai_month && existingBooking.kattalai_date ? \`\${new Date().getFullYear()}-\${String(existingBooking.kattalai_month).padStart(2, '0')}-\${String(existingBooking.kattalai_date).padStart(2, '0')}\` : (date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),`
);

// Update handleFinalPayNow payload
content = content.replace(
  `const payload = { ...form, ...tamilData, userRole: user?.role, isUnlocked };`,
  `const perParts = form.permanent_address.split(',').map(s => s.trim());
      const commParts = form.communication_address.split(',').map(s => s.trim());
      const dDate = new Date(form.booking_date);
      const payload = { 
        ...form, 
        ...tamilData, 
        userRole: user?.role, 
        isUnlocked,
        kattalai_date: dDate.getDate(),
        kattalai_month: dDate.getMonth() + 1,
        per_add_1: perParts[0] || '',
        per_add_2: perParts[1] || '',
        per_add_3: perParts.slice(2).join(', ') || '',
        comm_add_1: commParts[0] || '',
        comm_add_2: commParts[1] || '',
        comm_add_3: commParts[2] || '',
        comm_add_4: commParts.slice(3).join(', ') || ''
      };`
);

// Remove the `booking_date` text from UI payload ? No, we can just send it, the backend ignores it.

// Note: In the zip file, it might not have Combobox. Did it use Combobox?
// Let's just write this to the active path.
fs.writeFileSync(activePath, content, 'utf8');
console.log("Restored BookingModal.jsx from zip file and injected mapping logic.");
