import { SurveyData, FoodExpense, ExpenseEntry, UpahGajiEntry, UsahaEntry } from "@/types/survey";

/**
 * Calculate imputasi values from food and non-food consumption data based on category and detail combinations
 * All formula calculations as per requirements
 */
export const calculateImputasiFromFood = (data: SurveyData): Partial<SurveyData> => {
  // Initialize all imputasi variables
  let upahGajiImputasiBarang = 0;
  let usahaImputasiNilaiProduksi = 0;
  let hasilPertanianImputasi = 0;
  let pemerintahBantuanImputasiUang = 0;
  let pemerintahBantuanImputasiBarang = 0;
  let rumahTanggaLainImputasiBarang = 0;
  const rumahTanggaLainBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];
  const pemerintahBantuanUangBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];
  const pemerintahBantuanBarangBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];
  const lembagaNirlabaBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];
  const luarNegeriBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];
  const badanUsahaBreakdown: Array<{ label: string; nilai: number; periode?: string; yearly: number; formula: string }> = [];

  // Helper to clean up raw item keys for display (removes prefixes like "C_yearly_", "A_", etc.)
  const cleanItemLabel = (rawKey: string): string => {
    // Remove patterns like "A_yearly_", "C_yearly_", "B_monthly_", etc.
    let cleaned = rawKey.replace(/^[A-Z]_(?:yearly|monthly)_/, '');
    // Remove single letter category prefixes like "A_", "B_", etc.
    cleaned = cleaned.replace(/^[A-Z]_/, '');
    return cleaned;
  };

  // Helper to build human readable formula for an entry
  const buildFormulaForEntry = (label: string, rawNilai: number, periode: string | undefined, yearly: number) => {
    const formatter = new Intl.NumberFormat('id-ID');
    const cleanLabel = cleanItemLabel(label);
    let multiplierText = '';
    if (!periode || periode === 'minggu' || periode === 'weekly') {
      multiplierText = '× 30/7 × 12';
    } else if (periode === 'bulan' || periode === 'monthly') {
      multiplierText = '× 12';
    } else if (periode === 'tahun' || periode === 'yearly') {
      multiplierText = '× 1';
    } else {
      multiplierText = '× 30/7 × 12';
    }
    return `${cleanLabel} Rp ${formatter.format(rawNilai)} ${multiplierText} = Rp ${formatter.format(yearly)}`;
  };
  let lembagaNirlabaImputasiBarang = 0;
  let luarNegeriImputasiBarang = 0;
  let pengambilanUangTunaiImputasi = 0;
  let meminjamUangImputasi = 0;
  let kreditBarangImputasi = 0;
  let perkiraanSewaRumahImputasi = 0;
  let badanUsahaBarangImputasi = 0; // For asuransi kesehatan special case

  // Auto-generated rows based on Page 2 entries - use Map to consolidate same entries
  const autoUpahEntriesMap = new Map<string, UpahGajiEntry>();
  const autoUsahaEntriesMap = new Map<string, UsahaEntry>();
  let autoVaIndex = 0;
  let autoVbIndex = 0;

  // Function to convert weekly to yearly value (nilai * 30/7 * 12)
  // Use Math.round to prevent floating point precision errors
  const weeklyToYearly = (weeklyValue: number) => Math.round(weeklyValue * 30 / 7 * 12);

  // Function to convert any period to yearly value based on periode field
  const convertToYearly = (value: number, periode?: string): number => {
    if (!periode || periode === 'minggu' || periode === 'weekly') {
      // Weekly: multiply by 30/7 * 12 (converts weekly to daily to monthly to yearly)
      return Math.round(value * 30 / 7 * 12);
    } else if (periode === 'bulan' || periode === 'monthly') {
      // Monthly: multiply by 12
      return Math.round(value * 12);
    } else if (periode === 'tahun' || periode === 'yearly') {
      // Yearly: no conversion needed
      return Math.round(value * 1);
    }
    // Default to weekly conversion if periode is unknown
    return Math.round(value * 30 / 7 * 12);
  };

  console.log("=== IMPUTASI CALCULATION START ===");
  console.log("Food data:", data.makananMinuman);
  console.log("Non-food monthly data:", Object.keys(data).filter(k => k.includes('Sebulan')));
  console.log("Non-food yearly data:", data.komoditiSetahun);

  if (!data.makananMinuman) {
    console.log("No food data found!");
    return {};
  }

  // Process all food categories
  Object.entries(data.makananMinuman || {}).forEach(([key, expense]) => {
    if (!expense) return;

    // Special debug log for M-N categories
    if (key.startsWith('M_') || key.startsWith('N_')) {
      console.log(`📊 FOOD CATEGORY ${key}:`, expense);
      console.log(`   - entries exist: ${!!expense.entries}, length: ${expense.entries?.length || 0}`);
    }

    // Process entries array if available
    if (expense.entries && Array.isArray(expense.entries) && expense.entries.length > 0) {
      console.log(`Processing entries for category: ${key}`, expense.entries);

      expense.entries.forEach((entry: ExpenseEntry) => {
        const yearlyValue = convertToYearly(entry.nilai, entry.periode);
        const isM_N = key.startsWith('M_') || key.startsWith('N_');
        if (isM_N) {
          console.log(`[M-N DEBUG] Category: ${key}, Entry #${expense.entries.indexOf(entry)}`);
          console.log(`  nilai: ${entry.nilai}, kategori: "${entry.kategori}", jenisDetail: "${entry.jenisDetail}"`);
          console.log(`  periode: ${entry.periode}, yearlyValue: ${yearlyValue}`);
        }
        console.log(`Entry: kategori=${entry.kategori}, jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, periode=${entry.periode || 'minggu'}, yearlyValue=${yearlyValue}`);

        // 1. BLOK VA - Imputasi Upah/Gaji Barang
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Pemberian dari Pemerintah Pemberi Kerja sebagai PNS/ TNI/ Polri/ Karyawan/ Buruh' && entry.nilai > 0) {
          upahGajiImputasiBarang += yearlyValue;
          
          const keyMap = 'PNS/TNI/Polri/Karyawan/Buruh';
          if (autoUpahEntriesMap.has(keyMap)) {
            const existing = autoUpahEntriesMap.get(keyMap)!;
            existing.imputasiUpahGajiBarang += yearlyValue;
          } else {
            autoUpahEntriesMap.set(keyMap, {
              id: `auto-imputasi-va-${autoVaIndex++}`,
              uraianPekerjaan: `Pekerjaan dengan tunjangan makanan`,
              kategoriLU: 'Bekerja',
              jenisPekerjaan: 'PNS/TNI/Polri/Karyawan/Buruh',
              upahUang: 0,
              upahBarang: 0,
              lembur: 0,
              imputasiUpahGajiBarang: yearlyValue
            });
          }
          console.log(`✓ BLOK VA Rule 1: upahGajiImputasiBarang += ${yearlyValue} = ${upahGajiImputasiBarang}`);
        }
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Konsumsi beras/palawija hasil upah buruh derep/ panen' && entry.nilai > 0) {
          upahGajiImputasiBarang += yearlyValue;
          
          const keyMap = 'Buruh Tani/Derep/Panen';
          if (autoUpahEntriesMap.has(keyMap)) {
            const existing = autoUpahEntriesMap.get(keyMap)!;
            existing.imputasiUpahGajiBarang += yearlyValue;
          } else {
            autoUpahEntriesMap.set(keyMap, {
              id: `auto-imputasi-va-${autoVaIndex++}`,
              uraianPekerjaan: `Buruh pertanian`,
              kategoriLU: 'Bekerja',
              jenisPekerjaan: 'Buruh Tani/Derep/Panen',
              upahUang: 0,
              upahBarang: 0,
              lembur: 0,
              imputasiUpahGajiBarang: yearlyValue
            });
          }
          console.log(`✓ BLOK VA Rule 2: upahGajiImputasiBarang += ${yearlyValue} = ${upahGajiImputasiBarang}`);
        }

        // 2. BLOK VB - Imputasi Nilai Produksi Usaha
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Pengambilan dari Warung Sendiri' && entry.nilai > 0) {
          usahaImputasiNilaiProduksi += yearlyValue;
          
          const keyMap = 'Pedagang/Warung';
          if (autoUsahaEntriesMap.has(keyMap)) {
            const existing = autoUsahaEntriesMap.get(keyMap)!;
            existing.imputasiNilaiProduksi += yearlyValue;
          } else {
            autoUsahaEntriesMap.set(keyMap, {
              id: `auto-imputasi-vb-${autoVbIndex++}`,
              uraianKegiatan: `Warung/Toko`,
              kategoriLU: 'Berusaha sendiri',
              jenisPekerjaan: 'Pedagang/Warung',
              nilaiProduksi: 0,
              biayaProduksi: 0,
              surplus: 0,
              imputasiNilaiProduksi: yearlyValue
            });
          }
          console.log(`✓ BLOK VB Rule 1: usahaImputasiNilaiProduksi += ${yearlyValue} = ${usahaImputasiNilaiProduksi}`);
        }
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Konsumsi Beras/palawija hasil panenan sendiri' && entry.nilai > 0) {
          usahaImputasiNilaiProduksi += yearlyValue;
          
          const keyMap = 'Petani';
          if (autoUsahaEntriesMap.has(keyMap)) {
            const existing = autoUsahaEntriesMap.get(keyMap)!;
            existing.imputasiNilaiProduksi += yearlyValue;
          } else {
            autoUsahaEntriesMap.set(keyMap, {
              id: `auto-imputasi-vb-${autoVbIndex++}`,
              uraianKegiatan: `Pertanian`,
              kategoriLU: 'Berusaha sendiri',
              jenisPekerjaan: 'Petani',
              nilaiProduksi: 0,
              biayaProduksi: 0,
              surplus: 0,
              imputasiNilaiProduksi: yearlyValue
            });
          }
          console.log(`✓ BLOK VB Rule 2: usahaImputasiNilaiProduksi += ${yearlyValue} = ${usahaImputasiNilaiProduksi}`);
        }

        // Helper to check if kategori is a "Pemberian" type (handles both old and new category names)
        const isPemberianKategori = (kat: string) => kat === 'Produksi Sendiri/Pemberian' || kat === 'Pemberian';

        // BLOK VB Rules for M-N categories with "Produksi Sendiri/Pemberian" - like kategori A-L
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Berasal dari Produksi Sendiri' && entry.nilai > 0) {
          usahaImputasiNilaiProduksi += yearlyValue;
          
          const keyMap = 'Produksi Sendiri Makanan/Minuman/Tembakau';
          if (autoUsahaEntriesMap.has(keyMap)) {
            const existing = autoUsahaEntriesMap.get(keyMap)!;
            existing.imputasiNilaiProduksi += yearlyValue;
          } else {
            autoUsahaEntriesMap.set(keyMap, {
              id: `auto-imputasi-vb-${autoVbIndex++}`,
              uraianKegiatan: `Produksi Sendiri Makanan/Minuman/Tembakau`,
              kategoriLU: 'Berusaha sendiri',
              jenisPekerjaan: 'Produksi Sendiri Makanan/Minuman/Tembakau',
              nilaiProduksi: 0,
              biayaProduksi: 0,
              surplus: 0,
              imputasiNilaiProduksi: yearlyValue
            });
          }
          console.log(`✓ BLOK VB Rule 3 (M-N Produksi Sendiri): usahaImputasiNilaiProduksi += ${yearlyValue} = ${usahaImputasiNilaiProduksi}`);
        }

        // 3. BLOK VC - Imputasi Nilai Produksi Hasil Pertanian
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Berasal dari Produksi Sendiri') {
          hasilPertanianImputasi += yearlyValue;
          console.log(`✓ BLOK VC: hasilPertanianImputasi += ${yearlyValue} = ${hasilPertanianImputasi}`);
        }

        // 4. BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Uang
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Konsumsi Bantuan Pangan BPNT') {
          pemerintahBantuanImputasiUang += yearlyValue;
          pemerintahBantuanUangBreakdown.push({
            label: key,
            nilai: entry.nilai || 0,
            periode: entry.periode,
            yearly: yearlyValue,
            formula: buildFormulaForEntry(key, entry.nilai || 0, entry.periode, yearlyValue)
          });
          console.log(`✓ BLOK VE Pemerintah Uang: pemerintahBantuanImputasiUang += ${yearlyValue} = ${pemerintahBantuanImputasiUang}`);
        }

        // 5. BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Barang
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Subsidi harga dari Pemerintah (Pembelian barang di bawah harga pasar)') {
          pemerintahBantuanImputasiBarang += yearlyValue;
          pemerintahBantuanBarangBreakdown.push({
            label: key,
            nilai: entry.nilai || 0,
            periode: entry.periode,
            yearly: yearlyValue,
            formula: buildFormulaForEntry(key, entry.nilai || 0, entry.periode, yearlyValue)
          });
          console.log(`✓ BLOK VE Pemerintah Barang Rule 1: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
        }
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Pemerintah secara Gratis') {
          pemerintahBantuanImputasiBarang += yearlyValue;
          pemerintahBantuanBarangBreakdown.push({
            label: key,
            nilai: entry.nilai || 0,
            periode: entry.periode,
            yearly: yearlyValue,
            formula: buildFormulaForEntry(key, entry.nilai || 0, entry.periode, yearlyValue)
          });
          console.log(`✓ BLOK VE Pemerintah Barang Rule 2: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
        }

        // 6. BLOK VE - Rumah Tangga Lain - Imputasi Transfer Diterima Barang
        const isM_N_check = key.startsWith('M_') || key.startsWith('N_');
        const isPemb = isPemberianKategori(entry.kategori);
        const isRumahTangga = entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain';
        
        if (isM_N_check && isPemb) {
          console.log(`[BLOK VE CHECK] M-N found in category ${key}`);
          console.log(`  isPemberianKategori: ${isPemb}, jenisDetail: "${entry.jenisDetail}"`);
          console.log(`  isRumahTangga match: ${isRumahTangga}`);
        }
        
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain') {
          rumahTanggaLainImputasiBarang += yearlyValue;
          // build readable label
          let label = cleanItemLabel(key);
          try {
            const underscoreIndex = key.indexOf('_');
            if (underscoreIndex > -1) {
              const prefix = key.substring(0, underscoreIndex);
              const rest = key.substring(underscoreIndex + 1);
              label = cleanItemLabel(rest);
              if ((prefix === 'M' || prefix === 'N') && data && Array.isArray((data as any).namaAnggotaRumahTangga)) {
                const idx = parseInt(rest, 10);
                if (!isNaN(idx) && (data as any).namaAnggotaRumahTangga[idx]) {
                  label = `${(data as any).namaAnggotaRumahTangga[idx]} (anggota)`;
                }
              }
            }
          } catch (e) {
            label = cleanItemLabel(key);
          }

          const rawNilai = entry.nilai || 0;
          const yearly = yearlyValue;
          const formula = buildFormulaForEntry(label, rawNilai, entry.periode, yearly);
          rumahTanggaLainBreakdown.push({ label, nilai: rawNilai, periode: entry.periode, yearly, formula });

          const source = (key.startsWith('M_') || key.startsWith('N_')) ? `(M-N: ${key})` : '';
          console.log(`✓ BLOK VE Rumah Tangga Lain: rumahTanggaLainImputasiBarang += ${yearlyValue} = ${rumahTanggaLainImputasiBarang} | From category: ${key} ${source} | isPemberianKategori: ${isPemberianKategori(entry.kategori)}, jenisDetail match: ${entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain'}`);
        } else if ((key.startsWith('M_') || key.startsWith('N_')) && isPemberianKategori(entry.kategori)) {
          // Debug: log M-N entries that don't match BLOK VE rules
          console.log(`⚠️ M-N entry NOT matched to BLOK VE: kategori=${entry.kategori}, jenisDetail="${entry.jenisDetail}" (looking for "Pemberian dari Rumah Tangga Lain")`);
        }

        // 7. BLOK VE - Lembaga Nirlaba - Imputasi Transfer Diterima Barang
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)') {
          lembagaNirlabaImputasiBarang += yearlyValue;
          lembagaNirlabaBreakdown.push({
            label: key,
            nilai: entry.nilai || 0,
            periode: entry.periode,
            yearly: yearlyValue,
            formula: buildFormulaForEntry(key, entry.nilai || 0, entry.periode, yearlyValue)
          });
          console.log(`✓ BLOK VE Lembaga Nirlaba: lembagaNirlabaImputasiBarang += ${yearlyValue} = ${lembagaNirlabaImputasiBarang}`);
        }

        // 8. BLOK VE - Luar Negeri - Imputasi Transfer Diterima Barang
        if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)') {
          luarNegeriImputasiBarang += yearlyValue;
          luarNegeriBreakdown.push({
            label: key,
            nilai: entry.nilai || 0,
            periode: entry.periode,
            yearly: yearlyValue,
            formula: buildFormulaForEntry(key, entry.nilai || 0, entry.periode, yearlyValue)
          });
          console.log(`✓ BLOK VE Luar Negeri: luarNegeriImputasiBarang += ${yearlyValue} = ${luarNegeriImputasiBarang}`);
        }

        // 9. BLOK VII - Pengambilan Uang Tunai - Imputasi Rincian Penerimaan
        if (entry.kategori === 'Pembelian' && (
          entry.jenisDetail === 'Pembelian Tunai' ||
          entry.jenisDetail === 'Pengambilan dari Warung Sendiri' ||
          entry.jenisDetail === 'Konsumsi Bantuan Pangan BPNT' ||
          entry.jenisDetail === 'Konsumsi Beras/palawija hasil panenan sendiri' ||
          entry.jenisDetail === 'Konsumsi beras/palawija hasil upah buruh derep/panen'
        )) {
          pengambilanUangTunaiImputasi += yearlyValue;
          console.log(`✓ BLOK VII Pengambilan Uang Tunai: pengambilanUangTunaiImputasi += ${yearlyValue} = ${pengambilanUangTunaiImputasi}`);
        }

        // 10. BLOK VII - Meminjam Uang - Imputasi Rincian Penerimaan
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Pembelian Bon/Hutang') {
          meminjamUangImputasi += yearlyValue;
          console.log(`✓ BLOK VII Meminjam Uang: meminjamUangImputasi += ${yearlyValue} = ${meminjamUangImputasi}`);
        }
      });
    } else {
      console.log(`⚠ No entries array for ${key}`, expense);
    }
  });

  // FALLBACK: Process food entries that don't have entries array but have direct fields (pembelian/produksiSendiri)
  // This handles legacy or incomplete entries
  console.log("=== FALLBACK PROCESSING FOR FOOD DATA WITHOUT ENTRIES ARRAY ===");
  Object.entries(data.makananMinuman || {}).forEach(([key, expense]) => {
    if (!expense) return;
    
    // Skip if already has entries array (already processed above)
    if (expense.entries && Array.isArray(expense.entries) && expense.entries.length > 0) {
      return;
    }
    
    console.log(`Processing fallback for ${key}:`, expense);
    
    // If there are direct fields (pembelian/produksiSendiri), we can't determine the imputasi kategori
    // Since we don't know the jenisDetail, we can't apply imputasi rules
    // This is a limitation - imputasi requires knowing the specific category/detail
    // So we skip fallback entries for now
    console.log(`⚠ Skipping ${key} - no entries array and no way to determine imputasi kategori`);
  });

  // Process NON-FOOD data from Page 3
  console.log("=== PROCESSING NON-FOOD DATA (PAGE 3) ===");
  console.log("Non-food data:", data);

  // Process monthly non-food categories (multiply by 12)
  const categoryKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
  categoryKeys.forEach(categoryKey => {
    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
    if (monthlyData) {
      console.log(`Processing monthly category ${categoryKey}:`, monthlyData);
      
      Object.entries(monthlyData).forEach(([itemKey, expense]) => {
        if (expense && expense.entries && Array.isArray(expense.entries)) {
          // Process each entry in the expense entries array
          expense.entries.forEach((entry: any) => {
            if (entry && entry.nilai > 0) {
              // Use the periode field if present, otherwise default to 'bulan' for monthly data
              const yearlyValue = convertToYearly(entry.nilai, entry.periode || 'bulan');
              console.log(`Monthly Entry: item=${itemKey}, kategori="${entry.kategori}", jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, periode=${entry.periode || 'bulan'}, yearlyValue=${yearlyValue}`);
              // push breakdowns for non-food where applicable
              if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)') {
                lembagaNirlabaImputasiBarang += yearlyValue;
                lembagaNirlabaBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'bulan', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'bulan', yearlyValue) });
              }
              if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)') {
                luarNegeriImputasiBarang += yearlyValue;
                luarNegeriBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'bulan', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'bulan', yearlyValue) });
              }
              if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain') {
                rumahTanggaLainImputasiBarang += yearlyValue;
                rumahTanggaLainBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'bulan', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'bulan', yearlyValue) });
              }
              processNonFoodEntry(entry.kategori, entry.jenisDetail, yearlyValue, itemKey, 'monthly');
            }
          });
        }
      });
    }
  });

  // Process yearly non-food data (multiply by 1)
  if (data.komoditiSetahun) {
    console.log("Processing yearly non-food data:", data.komoditiSetahun);
    
    Object.entries(data.komoditiSetahun).forEach(([itemKey, expense]) => {
      if (expense && (expense as any).entries && Array.isArray((expense as any).entries)) {
        // Process each entry in the expense entries array
        (expense as any).entries.forEach((entry: any) => {
          if (entry && entry.nilai > 0) {
            // Use the periode field if present, otherwise default to 'tahun' for yearly data
            const yearlyValue = convertToYearly(entry.nilai, entry.periode || 'tahun');
            console.log(`Yearly Entry: item=${itemKey}, kategori="${entry.kategori}", jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, periode=${entry.periode || 'tahun'}, yearlyValue=${yearlyValue}`);
            // push breakdowns for yearly non-food entries
            if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)') {
              lembagaNirlabaImputasiBarang += yearlyValue;
              lembagaNirlabaBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'tahun', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'tahun', yearlyValue) });
            }
            if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)') {
              luarNegeriImputasiBarang += yearlyValue;
              luarNegeriBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'tahun', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'tahun', yearlyValue) });
            }
            if (isPemberianKategoriNonFood(entry.kategori) && entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain') {
              rumahTanggaLainImputasiBarang += yearlyValue;
              rumahTanggaLainBreakdown.push({ label: cleanItemLabel(itemKey), nilai: entry.nilai || 0, periode: entry.periode || 'tahun', yearly: yearlyValue, formula: buildFormulaForEntry(itemKey, entry.nilai || 0, entry.periode || 'tahun', yearlyValue) });
            }
            processNonFoodEntry(entry.kategori, entry.jenisDetail, yearlyValue, itemKey, 'yearly');
          }
        });
      }
    });
  }

  // Helper to check if kategori is a "Pemberian" type (handles both old and new category names)
  function isPemberianKategoriNonFood(kat: string) {
    return kat === 'Produksi Sendiri/Pemberian' || kat === 'Pemberian';
  }

  // Function to process non-food entries based on mapping rules
  function processNonFoodEntry(kategori: string, jenisDetail: string, yearlyValue: number, itemKey: string, timePeriod: 'monthly' | 'yearly') {
    // === BLOK VA - Imputasi Upah/Gaji Barang Rules ===
    if (kategori === 'Pembelian' && jenisDetail === 'Pemberian dari Pemerintah Pemberi Kerja sebagai PNS/ TNI/ Polri/ Karyawan/ Buruh') {
      upahGajiImputasiBarang += yearlyValue;
      
      const key = 'PNS/TNI/Polri/Karyawan/Buruh';
      if (autoUpahEntriesMap.has(key)) {
        const existing = autoUpahEntriesMap.get(key)!;
        existing.imputasiUpahGajiBarang += yearlyValue;
      } else {
        autoUpahEntriesMap.set(key, {
          id: `auto-imputasi-va-${autoVaIndex++}`,
          uraianPekerjaan: `Pekerjaan dengan tunjangan non-makanan`,
          kategoriLU: 'Bekerja',
          jenisPekerjaan: 'PNS/TNI/Polri/Karyawan/Buruh',
          upahUang: 0,
          upahBarang: 0,
          lembur: 0,
          imputasiUpahGajiBarang: yearlyValue
        });
      }
      console.log(`✓ Non-Food BLOK VA Rule 1: upahGajiImputasiBarang += ${yearlyValue} = ${upahGajiImputasiBarang}`);
    }

    if (kategori === 'Pembelian' && jenisDetail === 'Konsumsi beras/palawija hasil upah buruh derep/ panen') {
      upahGajiImputasiBarang += yearlyValue;
      
      const key = 'Buruh Tani/Derep/Panen';
      if (autoUpahEntriesMap.has(key)) {
        const existing = autoUpahEntriesMap.get(key)!;
        existing.imputasiUpahGajiBarang += yearlyValue;
      } else {
        autoUpahEntriesMap.set(key, {
          id: `auto-imputasi-va-${autoVaIndex++}`,
          uraianPekerjaan: `Buruh pertanian non-makanan`,
          kategoriLU: 'Bekerja',
          jenisPekerjaan: 'Buruh Tani/Derep/Panen',
          upahUang: 0,
          upahBarang: 0,
          lembur: 0,
          imputasiUpahGajiBarang: yearlyValue
        });
      }
      console.log(`✓ Non-Food BLOK VA Rule 2: upahGajiImputasiBarang += ${yearlyValue} = ${upahGajiImputasiBarang}`);
    }

    // === BLOK VB - Imputasi Nilai Produksi Usaha Rules ===
    if (kategori === 'Pembelian' && jenisDetail === 'Pengambilan dari Warung Sendiri') {
      usahaImputasiNilaiProduksi += yearlyValue;
      pengambilanUangTunaiImputasi += yearlyValue;
      
      const key = 'Pedagang/Warung';
      if (autoUsahaEntriesMap.has(key)) {
        const existing = autoUsahaEntriesMap.get(key)!;
        existing.imputasiNilaiProduksi += yearlyValue;
      } else {
        autoUsahaEntriesMap.set(key, {
          id: `auto-imputasi-vb-${autoVbIndex++}`,
          uraianKegiatan: `Warung/Toko non-makanan`,
          kategoriLU: 'Berusaha sendiri',
          jenisPekerjaan: 'Pedagang/Warung',
          nilaiProduksi: 0,
          biayaProduksi: 0,
          surplus: 0,
          imputasiNilaiProduksi: yearlyValue
        });
      }
      console.log(`✓ Non-Food BLOK VB Rule 1: usahaImputasiNilaiProduksi += ${yearlyValue}, pengambilanUangTunaiImputasi += ${yearlyValue}`);
    }

    if (kategori === 'Pembelian' && jenisDetail === 'Konsumsi Beras/palawija hasil panenan sendiri') {
      usahaImputasiNilaiProduksi += yearlyValue;
      pengambilanUangTunaiImputasi += yearlyValue;
      
      const key = 'Petani';
      if (autoUsahaEntriesMap.has(key)) {
        const existing = autoUsahaEntriesMap.get(key)!;
        existing.imputasiNilaiProduksi += yearlyValue;
      } else {
        autoUsahaEntriesMap.set(key, {
          id: `auto-imputasi-vb-${autoVbIndex++}`,
          uraianKegiatan: `Pertanian non-makanan`,
          kategoriLU: 'Berusaha sendiri',
          jenisPekerjaan: 'Petani',
          nilaiProduksi: 0,
          biayaProduksi: 0,
          surplus: 0,
          imputasiNilaiProduksi: yearlyValue
        });
      }
      console.log(`✓ Non-Food BLOK VB Rule 2: usahaImputasiNilaiProduksi += ${yearlyValue}, pengambilanUangTunaiImputasi += ${yearlyValue}`);
    }

    // === BLOK VC - Imputasi Nilai Produksi Hasil Pertanian Rules ===
    // Exclude "Rumah milik sendiri" - it goes to perkiraanSewaRumahImputasi instead (Rule 11)
    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Berasal dari Produksi Sendiri' && itemKey !== 'Rumah milik sendiri') {
      hasilPertanianImputasi += yearlyValue;
      console.log(`✓ Non-Food BLOK VC: hasilPertanianImputasi += ${yearlyValue} = ${hasilPertanianImputasi}`);
    }

    // === BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Uang Rules ===
    if (kategori === 'Pembelian' && jenisDetail === 'Konsumsi Bantuan Pangan BPNT') {
      pemerintahBantuanImputasiUang += yearlyValue;
      pengambilanUangTunaiImputasi += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Pemerintah Uang: pemerintahBantuanImputasiUang += ${yearlyValue}, pengambilanUangTunaiImputasi += ${yearlyValue}`);
    }

    // === BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Barang Rules ===
    if (kategori === 'Pembelian' && jenisDetail === 'Subsidi harga dari Pemerintah (Pembelian barang di bawah harga pasar)') {
      pemerintahBantuanImputasiBarang += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Pemerintah Barang Rule 1: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
    }

    // SPECIAL CASE for "Pemberian dari Pemerintah secara Gratis":
    // - Asuransi kesehatan -> pemerintahBantuanImputasiBarang (Row 1.b - Bantuan Pemerintah BPJS PBI, BLT, PKH, BOS, dll.)
    // - Healthcare facilities (Rumah sakit, Puskesmas, etc.) -> badanUsahaBarangImputasi (Row 2 - Badan Usaha)
    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Pemerintah secara Gratis') {
      // Check if it's a healthcare facility (not insurance)
      const isHealthcareFacility = itemKey.includes('Rumah sakit') || 
                                    itemKey.includes('Puskesmas') || 
                                    itemKey.includes('pustu') || 
                                    itemKey.includes('polindes') || 
                                    itemKey.includes('posyandu') || 
                                    itemKey.includes('Praktik dokter') || 
                                    itemKey.includes('poliklinik') || 
                                    itemKey.includes('Praktik petugas kesehatan');
      
      if (isHealthcareFacility) {
        // Healthcare facilities go to Badan Usaha (Row 2)
        badanUsahaBarangImputasi += yearlyValue;
        console.log(`✓ Non-Food HEALTHCARE FACILITY: badanUsahaBarangImputasi += ${yearlyValue} = ${badanUsahaBarangImputasi}`);
      } else {
        // Everything else including "Asuransi kesehatan" goes to Bantuan Pemerintah (Row 1.b)
        pemerintahBantuanImputasiBarang += yearlyValue;
        console.log(`✓ Non-Food BLOK VE Pemerintah Barang Rule 2: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
      }
    }

    // === BLOK VE - Transfer Diterima Barang from Other Sources ===
    // NOTE: rumahTanggaLain, lembagaNirlaba, luarNegeri accumulation is already done
    // in the inline checks above (lines ~404-449) where breakdowns are also pushed.
    // Do NOT accumulate again here to avoid double counting.

    // === BLOK VII - Transaksi Keuangan Imputasi Rules ===
    if (kategori === 'Pembelian' && (
      jenisDetail === 'Pembelian Tunai' ||
      jenisDetail === 'Pengambilan dari Warung Sendiri' ||
      jenisDetail === 'Konsumsi Bantuan Pangan BPNT' ||
      jenisDetail === 'Konsumsi Beras/palawija hasil panenan sendiri' ||
      jenisDetail === 'Konsumsi beras/palawija hasil upah buruh derep/ panen'
    )) {
      pengambilanUangTunaiImputasi += yearlyValue;
      console.log(`✓ Non-Food BLOK VII Pengambilan Uang Tunai: pengambilanUangTunaiImputasi += ${yearlyValue} = ${pengambilanUangTunaiImputasi}`);
    }

    if (kategori === 'Pembelian' && jenisDetail === 'Pembelian Bon/Hutang') {
      meminjamUangImputasi += yearlyValue;
      console.log(`✓ Non-Food BLOK VII Meminjam Uang: meminjamUangImputasi += ${yearlyValue} = ${meminjamUangImputasi}`);
    }

    // Rule 11: Pertanyaan "Rumah milik sendiri" -> Perkiraan Sewa Rumah Milik Sendiri
    if (itemKey === 'Rumah milik sendiri') {
      perkiraanSewaRumahImputasi += yearlyValue;
      console.log(`✓ Non-Food Rule 11: perkiraanSewaRumahImputasi += ${yearlyValue} = ${perkiraanSewaRumahImputasi}`);
    }

    // Rule 12: Removed - Bebas Sewa no longer automatically adds to Rumah Tangga Lain

    // Rule 13: Removed - Asuransi kesehatan dengan Pemberian dari Pemerintah secara Gratis sekarang dicatat ke Bantuan Pemerintah (pemerintahBantuanImputasiBarang)
  }

  console.log("=== FINAL IMPUTASI CALCULATIONS ===");
  console.log("upahGajiImputasiBarang:", upahGajiImputasiBarang);
  console.log("usahaImputasiNilaiProduksi:", usahaImputasiNilaiProduksi);
  console.log("hasilPertanianImputasi:", hasilPertanianImputasi);
  console.log("pemerintahBantuanImputasiUang:", pemerintahBantuanImputasiUang);
  console.log("pemerintahBantuanImputasiBarang:", pemerintahBantuanImputasiBarang);
  console.log("rumahTanggaLainImputasiBarang:", rumahTanggaLainImputasiBarang);
  console.log("lembagaNirlabaImputasiBarang:", lembagaNirlabaImputasiBarang);
  console.log("luarNegeriImputasiBarang:", luarNegeriImputasiBarang);
  console.log("pengambilanUangTunaiImputasi:", pengambilanUangTunaiImputasi);
  console.log("meminjamUangImputasi:", meminjamUangImputasi);
  console.log("kreditBarangImputasi:", kreditBarangImputasi);
  console.log("perkiraanSewaRumahImputasi:", perkiraanSewaRumahImputasi);
  console.log("badanUsahaBarangImputasi:", badanUsahaBarangImputasi);

  // Convert Maps to Arrays for final preparation
  const autoUpahEntries = Array.from(autoUpahEntriesMap.values());
  const autoUsahaEntries = Array.from(autoUsahaEntriesMap.values());

  console.log("=== AUTO GENERATED ENTRIES ===");
  console.log("autoUpahEntriesMap size:", autoUpahEntriesMap.size);
  console.log("autoUpahEntries:", autoUpahEntries);
  console.log("autoUsahaEntriesMap size:", autoUsahaEntriesMap.size);
  console.log("autoUsahaEntries:", autoUsahaEntries);

  // Prepare final arrays: merge user-edited values with auto-generated entries
  // Only include TRULY manual user entries (not auto-generated ones)
  const existingUpah = (data.pendapatanUpah || []).filter(
    (e) => e && e.id && !e.id.startsWith('auto-imputasi-va-') && e.id !== 'auto-generated-upah'
  );
  
  // For auto-generated entries that have been edited by users, preserve their user-entered values
  // Use lenient matching - only check ID pattern, not field values
  // This ensures entries persist even if optional fields aren't filled by user
  // Also auto-fill empty kategoriLU and jenisPekerjaan with 'belum terdefinisikan'
  const editedAutoUpah = (data.pendapatanUpah || []).filter(
    (e) => e && e.id && e.id.startsWith('auto-imputasi-va-')
  ).map(e => ({
    ...e,
    kategoriLU: e.kategoriLU || 'belum terdefinisikan',
    jenisPekerjaan: e.jenisPekerjaan || 'belum terdefinisikan'
  }));
  
  // Merge auto-generated with existing user values, prioritizing user edits
  const mergedAutoUpah = autoUpahEntries.map(autoEntry => {
    const existingEdit = editedAutoUpah.find(edited => edited.id === autoEntry.id);
    if (existingEdit) {
      return {
        ...autoEntry,
        ...existingEdit,
        imputasiUpahGajiBarang: autoEntry.imputasiUpahGajiBarang
      };
    }
    return autoEntry;
  });

  // Always include regenerated auto entries - they're the source of truth for imputasi
  // But filter out any manual entries with same jenisPekerjaan to avoid duplicates
  const autoJenisPekerjaan = new Set(mergedAutoUpah.map(e => e.jenisPekerjaan));
  const filteredExistingUpah = existingUpah.filter(e => !autoJenisPekerjaan.has(e.jenisPekerjaan));

  const finalUpah = [...filteredExistingUpah, ...mergedAutoUpah].map(e => ({
    ...e,
    kategoriLU: e.kategoriLU || 'belum terdefinisikan',
    jenisPekerjaan: e.jenisPekerjaan || 'belum terdefinisikan'
  }));

  const existingUsaha = (data.pendapatanUsaha || []).filter(
    (e) => e && e.id && !e.id.startsWith('auto-imputasi-vb-') && e.id !== 'auto-generated-usaha'
  );
  
    // For auto-generated entries that have been edited by users, preserve their user-entered values
    // Use lenient matching - only check ID pattern, not field values
  // This ensures entries persist even if optional fields aren't filled by user
  // Also auto-fill empty kategoriLU and jenisPekerjaan with 'belum terdefinisikan'
  const editedAutoUsaha = (data.pendapatanUsaha || []).filter(
    (e) => e && e.id && e.id.startsWith('auto-imputasi-vb-')
  ).map(e => ({
    ...e,
    kategoriLU: e.kategoriLU || 'belum terdefinisikan',
    jenisPekerjaan: e.jenisPekerjaan || 'belum terdefinisikan'
  }));
  
  // Merge auto-generated with existing user values, prioritizing user edits
  const mergedAutoUsaha = autoUsahaEntries.map(autoEntry => {
    // Match by ID instead of jenisPekerjaan - this is more reliable
    // User data will have the same ID as auto-generated (auto-imputasi-vb-X)
    const existingEdit = editedAutoUsaha.find(edited => edited.id === autoEntry.id);
    if (existingEdit) {
      return {
        ...autoEntry,
        ...existingEdit,
        imputasiNilaiProduksi: autoEntry.imputasiNilaiProduksi, // Always use calculated imputasi
        surplus: existingEdit.nilaiProduksi - existingEdit.biayaProduksi // Recalculate surplus
      };
    }
    return autoEntry;
  });
  
  // Always include regenerated auto entries - they're the source of truth for imputasi
  // But filter out any manual entries with same jenisPekerjaan to avoid duplicates
  const autoJenisPekerjaanUsaha = new Set(mergedAutoUsaha.map(e => e.jenisPekerjaan));
  const filteredExistingUsaha = existingUsaha.filter(e => !autoJenisPekerjaanUsaha.has(e.jenisPekerjaan));
  
  const finalUsaha = [...filteredExistingUsaha, ...mergedAutoUsaha].map(e => ({
    ...e,
    kategoriLU: e.kategoriLU || 'belum terdefinisikan',
    jenisPekerjaan: e.jenisPekerjaan || 'belum terdefinisikan'
  }));

  // Return the calculated imputasi values
  return {
    // BLOK VA - Upah/Gaji: rows follow Page 2 entries with values
    pendapatanUpah: finalUpah,

    // BLOK VB - Usaha: rows follow Page 2 entries with values
    pendapatanUsaha: finalUsaha,

    // BLOK VC - Produksi Sendiri
    produksiSendiri: {
      ...data.produksiSendiri,
      perkiraanSewaRumah: {
        ...data.produksiSendiri?.perkiraanSewaRumah,
        imputasiNilaiProduksi: perkiraanSewaRumahImputasi
      },
      hasilPertanian: {
        ...data.produksiSendiri?.hasilPertanian,
        imputasiNilaiProduksi: hasilPertanianImputasi
      }
    },

    // BLOK VE - Transfer Berjalan
    // Only return imputasi-calculated fields merged with existing data
    transferBerjalan: ({
      pemerintah: {
        ...data.transferBerjalan?.pemerintah,
        imputasiTransferDiterimaUang: data.transferBerjalan?.pemerintah?.imputasiTransferDiterimaUang || 0,
        imputasiTransferDiterimaBarang: data.transferBerjalan?.pemerintah?.imputasiTransferDiterimaBarang || 0
      },
      pemerintahBantuan: {
        ...data.transferBerjalan?.pemerintahBantuan,
        imputasiTransferDiterimaUang: pemerintahBantuanImputasiUang,
        imputasiTransferDiterimaBarang: pemerintahBantuanImputasiBarang,
        imputasiTransferDiterimaUangBreakdown: pemerintahBantuanUangBreakdown,
        imputasiTransferDiterimaBarangBreakdown: pemerintahBantuanBarangBreakdown
      },
      pemerintahUangPensiun: {
        ...data.transferBerjalan?.pemerintahUangPensiun,
        imputasiTransferDiterimaUang: data.transferBerjalan?.pemerintahUangPensiun?.imputasiTransferDiterimaUang || 0
      },
      badanUsaha: {
        ...data.transferBerjalan?.badanUsaha,
        imputasiTransferDiterimaBarang: badanUsahaBarangImputasi,
        imputasiTransferDiterimaBarangBreakdown: badanUsahaBreakdown
      },
      rumahTanggaLain: {
        ...data.transferBerjalan?.rumahTanggaLain,
        imputasiTransferDiterimaBarang: rumahTanggaLainImputasiBarang,
        imputasiTransferDiterimaBarangBreakdown: rumahTanggaLainBreakdown
      },
      lembagaNirlaba: {
        ...data.transferBerjalan?.lembagaNirlaba,
        imputasiTransferDiterimaBarang: lembagaNirlabaImputasiBarang,
        imputasiTransferDiterimaBarangBreakdown: lembagaNirlabaBreakdown
      },
      luarNegeri: {
        ...data.transferBerjalan?.luarNegeri,
        imputasiTransferDiterimaBarang: luarNegeriImputasiBarang,
        imputasiTransferDiterimaBarangBreakdown: luarNegeriBreakdown
      }
    } as any),

    // Calculate totals for Transfer Modal (BLOK VF) to map to Asset Changes (BLOK VG)
    transferModal: data.transferModal,

    // Calculate Transfer Modal totals and map to Asset Changes imputations
    asetPerubahan: (() => {
      const transferModalTotals = {
        diterima: {
          bangunanTinggal: 0,
          bangunanBukan: 0,
          alatProduksi: 0,
          tanamanHewan: 0,
          kendaraan: 0,
          lahan: 0
        },
        dibayar: {
          bangunanTinggal: 0,
          bangunanBukan: 0,
          alatProduksi: 0,
          tanamanHewan: 0,
          kendaraan: 0,
          lahan: 0
        }
      };

      // Sum up all entities for each asset type
      const transferEntities = ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri'];
      transferEntities.forEach(entity => {
        const entityData = data.transferModal?.[entity as keyof typeof data.transferModal];
        if (entityData) {
          // Sum diterima values
          transferModalTotals.diterima.bangunanTinggal += entityData.diterima?.bangunanTinggal || 0;
          transferModalTotals.diterima.bangunanBukan += entityData.diterima?.bangunanBukan || 0;
          transferModalTotals.diterima.alatProduksi += entityData.diterima?.alatProduksi || 0;
          transferModalTotals.diterima.tanamanHewan += entityData.diterima?.tanamanHewan || 0;
          transferModalTotals.diterima.kendaraan += entityData.diterima?.kendaraan || 0;
          transferModalTotals.diterima.lahan += entityData.diterima?.lahan || 0;

          // Sum dibayar values
          transferModalTotals.dibayar.bangunanTinggal += entityData.dibayar?.bangunanTinggal || 0;
          transferModalTotals.dibayar.bangunanBukan += entityData.dibayar?.bangunanBukan || 0;
          transferModalTotals.dibayar.alatProduksi += entityData.dibayar?.alatProduksi || 0;
          transferModalTotals.dibayar.tanamanHewan += entityData.dibayar?.tanamanHewan || 0;
          transferModalTotals.dibayar.kendaraan += entityData.dibayar?.kendaraan || 0;
          transferModalTotals.dibayar.lahan += entityData.dibayar?.lahan || 0;
        }
      });

      // Return Asset Changes data with Transfer Modal imputations
      return {
        asetTetapUsaha: {
          // Bangunan Bukan Tempat Tinggal
          bangunanBukan: {
            ...data.asetPerubahan?.asetTetapUsaha?.bangunanBukan,
            imputasiPenamabahanPemberian: transferModalTotals.diterima.bangunanBukan,
            imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.bangunanBukan
          },
          // Kendaraan
          kendaraan: {
            ...data.asetPerubahan?.asetTetapUsaha?.kendaraan,
            imputasiPenamabahanPemberian: transferModalTotals.diterima.kendaraan,
            imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.kendaraan
          },
          // Mesin, Perlengkapan dan Peralatan (mapped from Alat Produksi)
          mesinPeralatan: {
            ...data.asetPerubahan?.asetTetapUsaha?.mesinPeralatan,
            imputasiPenamabahanPemberian: transferModalTotals.diterima.alatProduksi,
            imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.alatProduksi
          },
          // Tanaman dan Hewan Menghasilkan Berulang
          tanamanHewan: {
            ...data.asetPerubahan?.asetTetapUsaha?.tanamanHewan,
            imputasiPenamabahanPemberian: transferModalTotals.diterima.tanamanHewan,
            imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.tanamanHewan
          },
          // Keep existing lainnya data
          lainnya: {
            ...data.asetPerubahan?.asetTetapUsaha?.lainnya
          }
        },
        // Bangunan Tempat Tinggal
        bangunanTinggal: {
          ...data.asetPerubahan?.bangunanTinggal,
          imputasiPenamabahanPemberian: transferModalTotals.diterima.bangunanTinggal,
          imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.bangunanTinggal
        },
        // Keep existing biayaPemindahan data
        biayaPemindahan: {
          ...data.asetPerubahan?.biayaPemindahan
        },
        // Lahan/Tanah dan Barang Berharga
        lahanBarang: {
          ...data.asetPerubahan?.lahanBarang,
          imputasiPenamabahanPemberian: transferModalTotals.diterima.lahan,
          imputasiPenguranganPemberianKepada: transferModalTotals.dibayar.lahan
        }
      };
    })(),

    // BLOK VII - Transaksi Keuangan
    transaksiKeuangan: (() => {
      console.log("=== CALCULATING BLOK VII IMPUTASI ===");

      // ========================================
      // KONTROL MENGAMBIL UANG DAN TABUNGAN
      // ========================================
      
      // --- Total 1 (Pengeluaran) ---
      // 1. Konsumsi (dari Blok IV.3.3 - calculated in Page6)
      // For imputasi, we don't include konsumsi directly here as it's calculated dynamically in Page6
      
      // 2. Biaya Produksi Usaha Rumah Tangga (Blok VB - biayaProduksi)
      const biayaProduksi = (data.pendapatanUsaha || []).reduce((sum, entry) => sum + (entry.biayaProduksi || 0), 0);
      
      // 3. Biaya Produksi untuk Konsumsi Sendiri (Blok VC - biaya produksi pertanian/sewa)
      const biayaProduksiKonsumsi = (data.produksiSendiri?.perkiraanSewaRumah?.biayaProduksi || 0) +
        (data.produksiSendiri?.hasilPertanian?.biayaProduksi || 0);
      
      // 4. Transfer Berjalan yang Dibayar/Diberikan (Blok VE kolom 4 dan 5 - dibayarUang dan dibayarBarang)
      const transferKeluar = Object.values(data.transferBerjalan || {}).reduce((sum, entity) => {
        return sum + (entity?.dibayarUang || 0) + (entity?.dibayarBarang || 0);
      }, 0);
      
      // 5. Pendapatan Kepemilikan yang Dibayar (Blok VD kolom 3)
      const pendapatanKepemilikanDibayar = Object.values(data.pendapatanKepemilikan || {}).reduce((sum, entry) => 
        sum + (entry?.dibayar || 0), 0);
      
      // 6. Transfer Modal/Aset Dibayar/Diberikan (Blok VF kolom 4 dan 5 - dibayar)
      let transferModalKeluar = 0;
      const transferEntities = ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri'];
      transferEntities.forEach(entity => {
        const entityData = data.transferModal?.[entity as keyof typeof data.transferModal];
        if (entityData?.dibayar) {
          transferModalKeluar += (entityData.dibayar.bangunanTinggal || 0) +
            (entityData.dibayar.bangunanBukan || 0) +
            (entityData.dibayar.alatProduksi || 0) +
            (entityData.dibayar.tanamanHewan || 0) +
            (entityData.dibayar.kendaraan || 0) +
            (entityData.dibayar.lahan || 0);
        }
      });
      
      // 7. Penambahan Aset (Blok VG kolom 2 - pembelian)
      const penambahanAset = Object.values(data.asetPerubahan?.asetTetapUsaha || {}).reduce((sum, category) => {
        return sum + (category?.pembelian || 0);
      }, 0) + (data.asetPerubahan?.bangunanTinggal?.pembelian || 0) + 
           (data.asetPerubahan?.lahanBarang?.pembelian || 0) +
           (data.asetPerubahan?.biayaPemindahan?.pembelian || 0);
      
      // 8. Pengeluaran Transaksi Keuangan (Blok VII rincian 2,3,4,5 kolom 4)
      // Rincian 2: membayar hutang, Rincian 3: memberikan kredit barang, 
      // Rincian 4: membayar kredit barang, Rincian 5: lainnya pengeluaran
      const transaksiKeuanganKeluar = (data.transaksiKeuangan?.membayarHutang || 0) +
        (data.transaksiKeuangan?.memberikanKreditBarang || 0) +
        (data.transaksiKeuangan?.membayarKreditBarang || 0) +
        (data.transaksiKeuangan?.lainnyaPengeluaran || 0);
      
      // --- Total 2 (Non-tunai/deduction) ---
      // 1. Upah Gaji dalam Bentuk Barang (Blok VA kolom 6 - upahBarang)
      const upahGajiBarang = (data.pendapatanUpah || []).reduce((sum, entry) => sum + (entry.upahBarang || 0), 0);
      
      // 2. Nilai Produksi Digunakan Sendiri (Blok VC kolom 2 - nilaiProduksi)
      const nilaiProduksiSendiri = (data.produksiSendiri?.perkiraanSewaRumah?.nilaiProduksi || 0) +
        (data.produksiSendiri?.hasilPertanian?.nilaiProduksi || 0);
      
      // 3. Transfer Berjalan Diterima dalam bentuk Barang/Jasa (Blok VE kolom 3 - diterimaBarang dari user input)
      const transferMasukBarang = Object.values(data.transferBerjalan || {}).reduce((sum, entity) => {
        return sum + (entity?.diterimaBarang || 0);
      }, 0);
      
      // 4. Transfer Modal/Aset Diterima (Blok VF kolom 2 dan 3 - diterima)
      let transferMasukModal = 0;
      transferEntities.forEach(entity => {
        const entityData = data.transferModal?.[entity as keyof typeof data.transferModal];
        if (entityData?.diterima) {
          transferMasukModal += (entityData.diterima.bangunanTinggal || 0) +
            (entityData.diterima.bangunanBukan || 0) +
            (entityData.diterima.alatProduksi || 0) +
            (entityData.diterima.tanamanHewan || 0) +
            (entityData.diterima.kendaraan || 0) +
            (entityData.diterima.lahan || 0);
        }
      });
      
      // 5. Pembelian Barang Kredit (Blok VII Rincian 4 kolom 2 - kreditBarang penerimaan)
      const membeliBarangKredit = data.transaksiKeuangan?.kreditBarang || 0;
      
      // 6. Non Transaksi (listrik nyantol, pajak gak bayar, dll) - stored separately if needed
      const nonTransaksi = 0; // This would need a separate field if required
      
      // Calculate Total 1 and Total 2 for Pengambilan Uang
      // Note: Konsumsi is calculated dynamically in Page6, so we pass it as 0 here
      // The actual formula will be completed in Page6.tsx
      // Formula: Konsumsi + BiayaProduksiUsaha + BiayaProduksiKonsumsi + TransferKeluar + 
      //          PendapatanKepemilikanDibayar + TransferModalKeluar + PenambahanAset + TransaksiKeuanganKeluar
      const total1Pengambilan = biayaProduksi + biayaProduksiKonsumsi + transferKeluar + 
        pendapatanKepemilikanDibayar + transferModalKeluar + penambahanAset + transaksiKeuanganKeluar;
      
      // Formula: UpahGajiBarang + NilaiProduksiSendiri + TransferMasukBarang + 
      //          TransferMasukModal + MembeliBarangKredit + NonTransaksi
      const total2Pengambilan = upahGajiBarang + nilaiProduksiSendiri + transferMasukBarang + 
        transferMasukModal + membeliBarangKredit + nonTransaksi;
      
      // Pengambilan Uang = Total1 - Total2 (konsumsi is added in Page6)
      // This base value is partial - Page6 adds konsumsi to get final imputasi
      const pengambilanUangTunaiImputasiBase = total1Pengambilan - total2Pengambilan;

      // ========================================
      // KONTROL MENYIMPAN UANG DAN MENABUNG
      // ========================================
      
      // --- Total 1 (Penerimaan) ---
      // 1. Upah/Gaji Dalam Bentuk Uang (Blok VA kolom 8+9 = upahUang + lembur)
      const upahGajiUang = (data.pendapatanUpah || []).reduce((sum, entry) => 
        sum + (entry.upahUang || 0) + (entry.lembur || 0), 0);
      
      // 2. Nilai Produksi Usaha (Blok VB - nilaiProduksi, NOT surplus)
      const nilaiProduksiUsaha = (data.pendapatanUsaha || []).reduce((sum, entry) => 
        sum + (entry.nilaiProduksi || 0), 0);
      
      // 3. Transfer Masuk Uang (Blok VE kolom 2 - diterimaUang)
      const transferMasukUang = Object.values(data.transferBerjalan || {}).reduce((sum, entity) => {
        return sum + (entity?.diterimaUang || 0);
      }, 0);
      
      // 4. Pendapatan Kepemilikan yang Diterima (Blok VD kolom 2)
      const pendapatanKepemilikanDiterima = Object.values(data.pendapatanKepemilikan || {}).reduce((sum, entry) => 
        sum + (entry?.diterima || 0), 0);
      
      // 5. Pengurangan Aset (Blok VG - penjualan)
      const penguranganAset = Object.values(data.asetPerubahan?.asetTetapUsaha || {}).reduce((sum, category) => {
        return sum + (category?.penjualan || 0);
      }, 0) + (data.asetPerubahan?.bangunanTinggal?.penjualan || 0) + 
           (data.asetPerubahan?.lahanBarang?.penjualan || 0);
      
      // 6. Transaksi Keuangan Diterima (Blok VII masuk rows 2-5)
      const transaksiKeuanganDiterima = (data.transaksiKeuangan?.meminjamUang || 0) +
        (data.transaksiKeuangan?.menerimaPembayaranKredit || 0) +
        (data.transaksiKeuangan?.lainnyaPenerimaan || 0);
      
      // --- Total 2 (for Menyimpan) ---
      // 1. Transfer Modal Keluar (Blok VF - dibayar) - REUSE transferModalKeluar from total1Pengambilan
      // (already calculated above as: transfer modal/aset dibayar)
      
      // 2. Hasil Produksi Belum Terjual - not currently tracked
      const hasilProduksiBelumTerjual = 0;
      
      // Menyimpan Uang = Total1 - Total2
      const total1Menyimpan = upahGajiUang + nilaiProduksiUsaha + transferMasukUang + 
        pendapatanKepemilikanDiterima + penguranganAset + transaksiKeuanganDiterima;
      const total2Menyimpan = transferModalKeluar + hasilProduksiBelumTerjual;
      const menyimpanUangTunaiImputasi = total1Menyimpan - total2Menyimpan;

      console.log(`BLOK VII Kontrol Mengambil Uang:
        Biaya Produksi VB: ${biayaProduksi}
        Biaya Produksi VC: ${biayaProduksiKonsumsi}
        Transfer Keluar VE (uang + barang): ${transferKeluar}
        Pendapatan Kepemilikan Dibayar VD: ${pendapatanKepemilikanDibayar}
        Transfer Modal Keluar VF: ${transferModalKeluar}
        Penambahan Aset VG: ${penambahanAset}
        Transaksi Keuangan Keluar VII: ${transaksiKeuanganKeluar}
        Total 1 (tanpa konsumsi): ${total1Pengambilan}
        ---
        Upah Gaji Barang: ${upahGajiBarang}
        Nilai Produksi Sendiri: ${nilaiProduksiSendiri}
        Transfer Masuk Barang: ${transferMasukBarang}
        Transfer Masuk Modal: ${transferMasukModal}
        Membeli Barang Kredit: ${membeliBarangKredit}
        Total 2: ${total2Pengambilan}
        ---
        Pengambilan Uang Base (Total1-Total2): ${pengambilanUangTunaiImputasiBase}`);

      console.log(`BLOK VII Kontrol Menyimpan Uang:
        Upah Gaji Uang: ${upahGajiUang}
        Nilai Produksi Usaha: ${nilaiProduksiUsaha}
        Transfer Masuk Uang: ${transferMasukUang}
        Pendapatan Kepemilikan Diterima: ${pendapatanKepemilikanDiterima}
        Pengurangan Aset: ${penguranganAset}
        Transaksi Keuangan Diterima: ${transaksiKeuanganDiterima}
        Total 1: ${total1Menyimpan}
        ---
        Transfer Modal Keluar: ${transferModalKeluar}
        Hasil Produksi Belum Terjual: ${hasilProduksiBelumTerjual}
        Total 2: ${total2Menyimpan}
        ---
        Menyimpan Uang Imputasi: ${menyimpanUangTunaiImputasi}`);

      return {
        // Preserve user-editable transaction amounts from existing data
        pengambilanUangTunai: data.transaksiKeuangan?.pengambilanUangTunai || 0,
        meminjamUang: data.transaksiKeuangan?.meminjamUang || 0,
        menerimaPembayaranKredit: data.transaksiKeuangan?.menerimaPembayaranKredit || 0,
        kreditBarang: data.transaksiKeuangan?.kreditBarang || 0,
        lainnyaPenerimaan: data.transaksiKeuangan?.lainnyaPenerimaan || 0,
        menyimpanUangTunai: data.transaksiKeuangan?.menyimpanUangTunai || 0,
        membayarHutang: data.transaksiKeuangan?.membayarHutang || 0,
        memberikanKreditBarang: data.transaksiKeuangan?.memberikanKreditBarang || 0,
        membayarKreditBarang: data.transaksiKeuangan?.membayarKreditBarang || 0,
        lainnyaPengeluaran: data.transaksiKeuangan?.lainnyaPengeluaran || 0,
        // Calculated imputasi values
        imputasiPenerimaanPengambilanUangTunai: pengambilanUangTunaiImputasiBase,
        imputasiPenerimaanMeminjamUang: meminjamUangImputasi,
        imputasiPenerimaanKreditBarang: kreditBarangImputasi,
        imputasiPenerimaanLainnya: data.transaksiKeuangan?.imputasiPenerimaanLainnya || 0,
        imputasiPengeluaranMenyimpanUangTunai: menyimpanUangTunaiImputasi,
        imputasiPengeluaranLainnya: data.transaksiKeuangan?.imputasiPengeluaranLainnya || 0,
        // Store control values for display in Page6 (as extra properties)
        kontrolMengambil: {
          biayaProduksi,
          biayaProduksiFormula: `Biaya Produksi Usaha (Blok VB)`,
          transferKeluar,
          transferKeluarFormula: `Transfer Berjalan Dibayar Uang + Barang (Blok VE)`,
          pendapatanKepemilikanDibayar,
          pendapatanKepemilikanFormula: `Pendapatan Kepemilikan Dibayar (Blok VD)`,
          penambahanAset,
          penambahanAsetFormula: `Penambahan Aset (Blok VG)`,
          transaksiKeuanganKeluar,
          transaksiKeuanganFormula: `Transaksi Keuangan Keluar (Blok VII: bayar hutang + beri kredit + bayar kredit + lainnya)`,
          total1: total1Pengambilan,
          upahGajiBarang,
          nilaiProduksiSendiri,
          transferMasukBarang,
          transferMasukModal,
          membeliBarangKredit,
          nonTransaksi,
          total2: total2Pengambilan
        },
        kontrolMenyimpan: {
          upahGajiUang,
          nilaiProduksiUsaha,
          transferMasukUang,
          pendapatanKepemilikanDiterima,
          penguranganAset,
          transaksiKeuanganDiterima,
          total1: total1Menyimpan,
          transferModalKeluar,
          hasilProduksiBelumTerjual,
          total2: total2Menyimpan
        }
      } as any;
    })()
  };
};

/**
 * Get summary of imputasi calculations for display
 * NOTE: All imputasi formulas have been removed as requested
 */
export const getImputasiSummary = (data: SurveyData) => {
  const calculations = calculateImputasiFromFood(data);
  
  return {
    hasilPertanian: calculations.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0,
    pemerintahBantuanUang: calculations.transferBerjalan?.pemerintah?.imputasiTransferDiterimaUang || 0,
    pemerintahBantuanBarang: calculations.transferBerjalan?.pemerintahBantuan?.imputasiTransferDiterimaBarang || 0,
    rumahTanggaLain: calculations.transferBerjalan?.rumahTanggaLain?.imputasiTransferDiterimaBarang || 0,
    pengambilanUangTunai: calculations.transaksiKeuangan?.imputasiPenerimaanPengambilanUangTunai || 0
  };
};
