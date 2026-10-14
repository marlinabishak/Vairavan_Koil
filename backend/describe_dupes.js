const fs = require('fs');

const content = fs.readFileSync('c:/Users/marlin/OneDrive/Desktop/workss/vairavan-kovil_figma/sep20_backup_Final_DB_VK_2026.csv', 'utf8');
const lines = content.split('\n').filter(l => l.trim().replace(/,/g, '').length > 0);
const dataLines = lines.slice(1);

function parseCsvLine(text) {
  const result = [];
  let inQuotes = false;
  let currentVal = '';
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  result.push(currentVal);
  return result;
}

let codes = {};
dataLines.forEach((line, index) => {
  const cols = parseCsvLine(line.trim());
  if (cols.length < 23) {
    console.log('\n--- SKIPPED ROW DUE TO FORMATTING ERROR ---');
    console.log('Line ' + (index + 2) + ':\n' + line);
    return;
  }
  const code = cols[3];
  if (code) {
    if (codes[code]) {
      codes[code].push({lineNum: index + 2, name: cols[2], line: line});
    } else {
      codes[code] = [{lineNum: index + 2, name: cols[2], line: line}];
    }
  }
});

console.log('\n--- DUPLICATE ROWS (SAME OFFICE CODE) ---');
for (const code in codes) {
  if (codes[code].length > 1) {
    console.log('\nOffice Code: ' + code);
    codes[code].forEach(entry => {
      console.log(' - Line ' + entry.lineNum + ': ' + entry.name);
    });
  }
}
