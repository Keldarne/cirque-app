const xlsx = require('xlsx');
const path = require('path');

function inspectSpecificSheets() {
  const filePath = path.join(process.cwd(), 'docs', 'First 100 skills per disciplines.xlsx');
  console.log('Inspecting file:', filePath);
  
  try {
    const workbook = xlsx.readFile(filePath);
    
    ['Condition physique', 'Acrobatie'].forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      // Get raw data (array of arrays) to see structure before header parsing
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      console.log(`
--- Sheet: ${sheetName} (Raw Dump first 5 rows) ---`);
      data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectSpecificSheets();
