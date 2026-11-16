// Convenience entry point from backend directory
const runImport = require('./src/db/import_year_csv');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const targetFile = args[0];

runImport(targetFile).catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
