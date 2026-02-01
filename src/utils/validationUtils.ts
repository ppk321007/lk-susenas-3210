import { SurveyData, ExpenseEntry } from "@/types/survey";

export interface IncompleteEntry {
  categoryKey: string;
  itemKey: string;
  entryIndex: number;
  entryValue: number;
  missingField: 'jenisDetail';
  categoryType: 'Pembelian' | 'Produksi Sendiri/Pemberian' | 'Pemberian';
  itemName: string;
  message: string;
}

// Validate Page 2 (Food) incomplete entries
export const validatePage2Entries = (data: SurveyData): IncompleteEntry[] => {
  const incompleteEntries: IncompleteEntry[] = [];

  Object.entries(data.makananMinuman || {}).forEach(([itemKey, value]: [string, any]) => {
    if (value?.entries?.length > 0) {
      value.entries.forEach((entry: ExpenseEntry, index: number) => {
        if (entry.nilai > 0) {
          // Determine item name based on key pattern
          let itemName = '';
          const categoryKey = itemKey.split('_')[0];
          
          // For categories M and N, use member name
          if (categoryKey === 'M' || categoryKey === 'N') {
            const memberIndex = parseInt(itemKey.split('_')[1]);
            itemName = data.namaAnggotaRumahTangga?.[memberIndex] || `Anggota ${memberIndex + 1}`;
          } else {
            // For other categories, use item name
            itemName = itemKey.split('_').slice(1).join(' ');
          }
          
          if (entry.kategori === 'Pembelian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
            incompleteEntries.push({
              categoryKey,
              itemKey,
              entryIndex: index,
              entryValue: entry.nilai,
              missingField: 'jenisDetail',
              categoryType: 'Pembelian',
              itemName,
              message: 'Pilih jenis pembelian'
            });
          } else if (entry.kategori === 'Produksi Sendiri/Pemberian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
            incompleteEntries.push({
              categoryKey,
              itemKey,
              entryIndex: index,
              entryValue: entry.nilai,
              missingField: 'jenisDetail',
              categoryType: 'Produksi Sendiri/Pemberian',
              itemName,
              message: 'Pilih asal produksi'
            });
          }
        }
      });
    }
  });

  return incompleteEntries;
};

// Validate Page 3 (Non-Food) incomplete entries
export const validatePage3Entries = (data: SurveyData): IncompleteEntry[] => {
  const incompleteEntries: IncompleteEntry[] = [];
  
  const nonFoodCategories = [
    'komoditiASebulan', 'komoditiBSebulan', 'komoditiCSebulan', 
    'komoditiDSebulan', 'komoditiESebulan', 'komoditiFSebulan', 'komoditiSetahun'
  ];

  nonFoodCategories.forEach(category => {
    Object.entries(data[category] || {}).forEach(([itemKey, value]: [string, any]) => {
      if (value?.entries?.length > 0) {
        value.entries.forEach((entry: ExpenseEntry, index: number) => {
          if (entry.nilai > 0) {
            if (entry.kategori === 'Pembelian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
              incompleteEntries.push({
                categoryKey: category,
                itemKey,
                entryIndex: index,
                entryValue: entry.nilai,
                missingField: 'jenisDetail',
                categoryType: 'Pembelian',
                itemName: itemKey,
                message: 'Pilih jenis pembelian'
              });
            } else if (entry.kategori === 'Pemberian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
              incompleteEntries.push({
                categoryKey: category,
                itemKey,
                entryIndex: index,
                entryValue: entry.nilai,
                missingField: 'jenisDetail',
                categoryType: 'Pemberian',
                itemName: itemKey,
                message: 'Pilih jenis pemberian'
              });
            }
          }
        });
      }
    });
  });

  return incompleteEntries;
};

// Check if specific entry is incomplete
export const isEntryIncomplete = (
  entry: ExpenseEntry, 
  itemKey: string, 
  entryIndex: number, 
  incompleteEntries: IncompleteEntry[]
): boolean => {
  return incompleteEntries.some(
    incomplete => 
      incomplete.itemKey === itemKey && 
      incomplete.entryIndex === entryIndex
  );
};