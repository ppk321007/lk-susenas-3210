// Test old format parsing to check if it actually parses correctly

// Simulating old format data that might be in Google Sheets
const oldFormatData = 'ART0_Nama Anggota_100_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain';

console.log('Testing OLD format (underscore) parsing');
console.log('Input:', oldFormatData);
console.log('');

// Simulating the parser logic
const memberGroups = oldFormatData.split(' || ').filter(Boolean);
console.log('memberGroups:', memberGroups);

for (const memberGroup of memberGroups) {
  const byCategory = memberGroup.split(' | ').filter(Boolean);
  console.log('byCategory:', byCategory);
  
  const allItems = [];
  for (const category of byCategory) {
    const byEntry = category.split('; ').filter(Boolean);
    console.log('byEntry:', byEntry);
    allItems.push(...byEntry);
  }
  
  console.log('allItems:', allItems);
  
  for (const item of allItems) {
    console.log('\nProcessing item:', item);
    
    const artMatch = item.match(/^ART(\d+)_(.+)$/);
    if (artMatch) {
      const memberIndex = parseInt(artMatch[1]);
      const restOfItem = artMatch[2];
      
      console.log('memberIndex:', memberIndex);
      console.log('restOfItem:', restOfItem);
      
      // OLD FORMAT PARSING
      const parts = restOfItem.split('_');
      console.log('parts:', parts);
      
      if (parts.length >= 4) {
        const nilaiStr = parts[1];
        const kategoriStr = parts[2];
        const detailParts = parts.slice(3);
        
        const nilai = parseFloat(nilaiStr);
        const kategori = kategoriStr;
        const jenisDetail = detailParts.join('_');
        
        console.log('PARSED:');
        console.log('  nilai:', nilai);
        console.log('  kategori:', kategori);
        console.log('  jenisDetail:', jenisDetail);
        console.log('  detailParts:', detailParts);
      }
    }
  }
}
