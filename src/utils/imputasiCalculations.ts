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
  const weeklyToYearly = (weeklyValue: number) => weeklyValue * 30 / 7 * 12;

  console.log("=== IMPUTASI CALCULATION START ===");
  console.log("Food data:", data.makananMinuman);

  if (!data.makananMinuman) {
    console.log("No food data found!");
    return {};
  }

  // Process all food categories
  Object.entries(data.makananMinuman || {}).forEach(([key, expense]) => {
    if (!expense || !expense.entries) return;

    console.log(`Processing category: ${key}`, expense.entries);

    expense.entries.forEach((entry: ExpenseEntry) => {
      const yearlyValue = weeklyToYearly(entry.nilai);
      console.log(`Entry: kategori=${entry.kategori}, jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, yearlyValue=${yearlyValue}`);

      // 1. BLOK VA - Imputasi Upah/Gaji Barang
      if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Pemberian dari Pemerintah Pemberi Kerja sebagai PNS/ TNI/ Polri/ Karyawan/ Buruh' && entry.nilai > 0) {
        upahGajiImputasiBarang += yearlyValue;
        
        const key = 'PNS/TNI/Polri/Karyawan/Buruh';
        if (autoUpahEntriesMap.has(key)) {
          const existing = autoUpahEntriesMap.get(key)!;
          existing.imputasiUpahGajiBarang += yearlyValue;
        } else {
          autoUpahEntriesMap.set(key, {
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
        
        const key = 'Buruh Tani/Derep/Panen';
        if (autoUpahEntriesMap.has(key)) {
          const existing = autoUpahEntriesMap.get(key)!;
          existing.imputasiUpahGajiBarang += yearlyValue;
        } else {
          autoUpahEntriesMap.set(key, {
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
        
        const key = 'Pedagang/Warung';
        if (autoUsahaEntriesMap.has(key)) {
          const existing = autoUsahaEntriesMap.get(key)!;
          existing.imputasiNilaiProduksi += yearlyValue;
        } else {
          autoUsahaEntriesMap.set(key, {
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
        
        const key = 'Petani';
        if (autoUsahaEntriesMap.has(key)) {
          const existing = autoUsahaEntriesMap.get(key)!;
          existing.imputasiNilaiProduksi += yearlyValue;
        } else {
          autoUsahaEntriesMap.set(key, {
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

      // 3. BLOK VC - Imputasi Nilai Produksi Hasil Pertanian
      if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Berasal dari Produksi Sendiri') {
        hasilPertanianImputasi += yearlyValue;
        console.log(`✓ BLOK VC: hasilPertanianImputasi += ${yearlyValue} = ${hasilPertanianImputasi}`);
      }

      // 4. BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Uang
      if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Konsumsi Bantuan Pangan BPNT') {
        pemerintahBantuanImputasiUang += yearlyValue;
        console.log(`✓ BLOK VE Pemerintah Uang: pemerintahBantuanImputasiUang += ${yearlyValue} = ${pemerintahBantuanImputasiUang}`);
      }

      // 5. BLOK VE - Bantuan Pemerintah - Imputasi Transfer Diterima Barang
      if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Subsidi harga dari Pemerintah (Pembelian barang di bawah harga pasar)') {
        pemerintahBantuanImputasiBarang += yearlyValue;
        console.log(`✓ BLOK VE Pemerintah Barang Rule 1: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
      }
      if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Pemerintah secara Gratis') {
        pemerintahBantuanImputasiBarang += yearlyValue;
        console.log(`✓ BLOK VE Pemerintah Barang Rule 2: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
      }

      // 6. BLOK VE - Rumah Tangga Lain - Imputasi Transfer Diterima Barang
      if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Rumah Tangga Lain') {
        rumahTanggaLainImputasiBarang += yearlyValue;
        console.log(`✓ BLOK VE Rumah Tangga Lain: rumahTanggaLainImputasiBarang += ${yearlyValue} = ${rumahTanggaLainImputasiBarang}`);
      }

      // 7. BLOK VE - Lembaga Nirlaba - Imputasi Transfer Diterima Barang
      if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)') {
        lembagaNirlabaImputasiBarang += yearlyValue;
        console.log(`✓ BLOK VE Lembaga Nirlaba: lembagaNirlabaImputasiBarang += ${yearlyValue} = ${lembagaNirlabaImputasiBarang}`);
      }

      // 8. BLOK VE - Luar Negeri - Imputasi Transfer Diterima Barang
      if (isPemberianKategori(entry.kategori) && entry.jenisDetail === 'Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)') {
        luarNegeriImputasiBarang += yearlyValue;
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
              const yearlyValue = entry.nilai * 12; // Monthly * 12
              console.log(`Monthly Entry: item=${itemKey}, kategori="${entry.kategori}", jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, yearlyValue=${yearlyValue}`);
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
            const yearlyValue = entry.nilai * 1; // Yearly * 1
            console.log(`Yearly Entry: item=${itemKey}, kategori="${entry.kategori}", jenisDetail="${entry.jenisDetail}", nilai=${entry.nilai}, yearlyValue=${yearlyValue}`);
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
    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Berasal dari Produksi Sendiri') {
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

    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Pemerintah secara Gratis' && !itemKey.includes('Asuransi kesehatan')) {
      pemerintahBantuanImputasiBarang += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Pemerintah Barang Rule 2: pemerintahBantuanImputasiBarang += ${yearlyValue} = ${pemerintahBantuanImputasiBarang}`);
    }

    // === BLOK VE - Transfer Diterima Barang from Other Sources ===
    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Rumah Tangga Lain') {
      rumahTanggaLainImputasiBarang += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Rumah Tangga Lain: rumahTanggaLainImputasiBarang += ${yearlyValue} = ${rumahTanggaLainImputasiBarang}`);
    }

    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)') {
      lembagaNirlabaImputasiBarang += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Lembaga Nirlaba: lembagaNirlabaImputasiBarang += ${yearlyValue} = ${lembagaNirlabaImputasiBarang}`);
    }

    if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)') {
      luarNegeriImputasiBarang += yearlyValue;
      console.log(`✓ Non-Food BLOK VE Luar Negeri: luarNegeriImputasiBarang += ${yearlyValue} = ${luarNegeriImputasiBarang}`);
    }

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

    // Rule 13: Special handling for "Asuransi kesehatan" - Pemberian dari Pemerintah secara Gratis
    if (itemKey.includes('Asuransi kesehatan') && isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Pemerintah secara Gratis') {
      // Add to Badan Usaha (Uang Pensiun, Asuransi, dll) instead of Bantuan Pemerintah
      badanUsahaBarangImputasi += yearlyValue;
      console.log(`✓ Non-Food Rule 13: asuransi kesehatan badanUsahaBarangImputasi += ${yearlyValue} = ${badanUsahaBarangImputasi}`);
    }
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

  // Prepare final arrays: merge user-edited values with auto-generated entries
  const existingUpah = (data.pendapatanUpah || []).filter(
    (e) => e && e.id && !e.id.startsWith('auto-imputasi-va-') && e.id !== 'auto-generated-upah'
  );
  
  // For auto-generated entries that have been edited by users, preserve their user-entered values
  const editedAutoUpah = (data.pendapatanUpah || []).filter(
    (e) => e && e.id && e.id.startsWith('auto-imputasi-va-') && (
      e.upahUang > 0 || 
      e.upahBarang > 0 || 
      e.lembur > 0 || 
      (!e.uraianPekerjaan.includes('Pekerjaan dengan tunjangan makanan') && e.uraianPekerjaan !== 'Buruh pertanian')
    )
  );
  
  // Merge auto-generated with existing user values, prioritizing user edits
  const mergedAutoUpah = autoUpahEntries.map(autoEntry => {
    const existingEdit = editedAutoUpah.find(edited => edited.jenisPekerjaan === autoEntry.jenisPekerjaan);
    if (existingEdit) {
      return {
        ...autoEntry,
        ...existingEdit,
        imputasiUpahGajiBarang: autoEntry.imputasiUpahGajiBarang // Always use calculated imputasi
      };
    }
    return autoEntry;
  });
  
  const finalUpah = [...existingUpah, ...mergedAutoUpah];

  const existingUsaha = (data.pendapatanUsaha || []).filter(
    (e) => e && e.id && !e.id.startsWith('auto-imputasi-vb-') && e.id !== 'auto-generated-usaha'
  );
  
  // For auto-generated entries that have been edited by users, preserve their user-entered values  
  const editedAutoUsaha = (data.pendapatanUsaha || []).filter(
    (e) => e && e.id && e.id.startsWith('auto-imputasi-vb-') && (
      e.nilaiProduksi > 0 || 
      e.biayaProduksi > 0 || 
      (e.uraianKegiatan !== 'Warung/Toko' && e.uraianKegiatan !== 'Pertanian')
    )
  );
  
  // Merge auto-generated with existing user values, prioritizing user edits
  const mergedAutoUsaha = autoUsahaEntries.map(autoEntry => {
    const existingEdit = editedAutoUsaha.find(edited => edited.jenisPekerjaan === autoEntry.jenisPekerjaan);
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
  
  const finalUsaha = [...existingUsaha, ...mergedAutoUsaha];

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
    transferBerjalan: {
      ...data.transferBerjalan,
      // Regular pemerintah section (not bantuan)
      pemerintah: {
        ...data.transferBerjalan?.pemerintah,
        diterimaUang: data.transferBerjalan?.pemerintah?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.pemerintah?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.pemerintah?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.pemerintah?.dibayarBarang || 0,
        imputasiTransferDiterimaUang: data.transferBerjalan?.pemerintah?.imputasiTransferDiterimaUang || 0,
        imputasiTransferDiterimaBarang: data.transferBerjalan?.pemerintah?.imputasiTransferDiterimaBarang || 0
      },
      // Point 4 & 5: Map BPNT to Uang and Subsidi+Gratis to Barang in "Bantuan Pemerintah" section
      pemerintahBantuan: {
        ...data.transferBerjalan?.pemerintahBantuan,
        diterimaUang: data.transferBerjalan?.pemerintahBantuan?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.pemerintahBantuan?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.pemerintahBantuan?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.pemerintahBantuan?.dibayarBarang || 0,
        imputasiTransferDiterimaUang: pemerintahBantuanImputasiUang, // Point 4: BPNT goes to Uang in Bantuan Pemerintah
        imputasiTransferDiterimaBarang: pemerintahBantuanImputasiBarang // Point 5: Subsidi + Gratis to Barang in Bantuan Pemerintah
      },
      pemerintahUangPensiun: {
        ...data.transferBerjalan?.pemerintahUangPensiun,
        diterimaUang: data.transferBerjalan?.pemerintahUangPensiun?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.pemerintahUangPensiun?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.pemerintahUangPensiun?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.pemerintahUangPensiun?.dibayarBarang || 0,
        imputasiTransferDiterimaUang: data.transferBerjalan?.pemerintahUangPensiun?.imputasiTransferDiterimaUang || 0
      },
      badanUsaha: {
        ...data.transferBerjalan?.badanUsaha,
        diterimaUang: data.transferBerjalan?.badanUsaha?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.badanUsaha?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.badanUsaha?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.badanUsaha?.dibayarBarang || 0,
        imputasiTransferDiterimaBarang: badanUsahaBarangImputasi // Only use calculated value, not add to existing
      },
      // Point 6: Map "Pemberian dari Rumah Tangga Lain" to Rumah Tangga Lain
      rumahTanggaLain: {
        ...data.transferBerjalan?.rumahTanggaLain,
        diterimaUang: data.transferBerjalan?.rumahTanggaLain?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.rumahTanggaLain?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.rumahTanggaLain?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.rumahTanggaLain?.dibayarBarang || 0,
        imputasiTransferDiterimaBarang: rumahTanggaLainImputasiBarang
      },
      lembagaNirlaba: {
        ...data.transferBerjalan?.lembagaNirlaba,
        diterimaUang: data.transferBerjalan?.lembagaNirlaba?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.lembagaNirlaba?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.lembagaNirlaba?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.lembagaNirlaba?.dibayarBarang || 0,
        imputasiTransferDiterimaBarang: lembagaNirlabaImputasiBarang
      },
      luarNegeri: {
        ...data.transferBerjalan?.luarNegeri,
        diterimaUang: data.transferBerjalan?.luarNegeri?.diterimaUang || 0,
        diterimaBarang: data.transferBerjalan?.luarNegeri?.diterimaBarang || 0,
        dibayarUang: data.transferBerjalan?.luarNegeri?.dibayarUang || 0,
        dibayarBarang: data.transferBerjalan?.luarNegeri?.dibayarBarang || 0,
        imputasiTransferDiterimaBarang: luarNegeriImputasiBarang
      }
    },

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
    transaksiKeuangan: {
      ...data.transaksiKeuangan,
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
      imputasiPenerimaanPengambilanUangTunai: pengambilanUangTunaiImputasi,
      imputasiPenerimaanMeminjamUang: meminjamUangImputasi,
      imputasiPenerimaanKreditBarang: kreditBarangImputasi,
      imputasiPenerimaanLainnya: data.transaksiKeuangan?.imputasiPenerimaanLainnya || 0,
      imputasiPengeluaranMenyimpanUangTunai: (() => {
        // BLOK VII - Menyimpan Uang Tunai dan Menabung Imputasi calculation
        console.log("=== CALCULATING BLOK VII MENYIMPAN UANG TUNAI ===");
        
        // Sum all income and transfer values for savings calculation
        const vaUpahUangJumlah = (data.pendapatanUpah || []).reduce((sum, entry) => sum + (entry.upahUang || 0), 0);
        const vaLemburJumlah = (data.pendapatanUpah || []).reduce((sum, entry) => sum + (entry.lembur || 0), 0);
        const vbSurplusJumlah = (data.pendapatanUsaha || []).reduce((sum, entry) => sum + (entry.surplus || 0), 0);
        const vdDiterimaJumlah = Object.values(data.pendapatanKepemilikan || {}).reduce((sum, entry) => sum + (entry?.diterima || 0), 0);
        const veTransferDiterimaUangJumlah = Object.values(data.transferBerjalan || {}).reduce((sum, entity) => {
          return sum + (entity?.diterimaUang || 0);
        }, 0);
        const vgPenguranganPenjualanTotal = Object.values(data.asetPerubahan?.asetTetapUsaha || {}).reduce((sum, category) => {
          return sum + (category?.penjualan || 0);
        }, 0) + (data.asetPerubahan?.bangunanTinggal?.penjualan || 0) + 
             (data.asetPerubahan?.lahanBarang?.penjualan || 0);
        
        // Current BLOK VII values (rows 2, 3, 5)
        const vii2MeminjamUang = data.transaksiKeuangan?.meminjamUang || 0; // Row 2 (Meminjam Uang)
        const vii3KreditBarang = data.transaksiKeuangan?.menerimaPembayaranKredit || 0; // Row 3 (Menerima Pembayaran Kredit)
        const vii5Lainnya = data.transaksiKeuangan?.lainnyaPenerimaan || 0; // Row 5 (Lainnya Penerimaan)
        
        const menyimpanUangTunaiImputasi = vaUpahUangJumlah + vaLemburJumlah + vbSurplusJumlah + 
          vdDiterimaJumlah + veTransferDiterimaUangJumlah + vgPenguranganPenjualanTotal + 
          vii2MeminjamUang + vii3KreditBarang + vii5Lainnya;

        console.log(`BLOK VII Savings calculation:
          VA Upah Uang: ${vaUpahUangJumlah}
          VA Lembur: ${vaLemburJumlah}
          VB Surplus: ${vbSurplusJumlah}
          VD Diterima: ${vdDiterimaJumlah}
          VE Transfer Diterima Uang: ${veTransferDiterimaUangJumlah}
          VG Pengurangan Penjualan: ${vgPenguranganPenjualanTotal}
          VII.2 Meminjam Uang: ${vii2MeminjamUang}
          VII.3 Kredit Barang: ${vii3KreditBarang}
          VII.5 Lainnya: ${vii5Lainnya}
          Total Menyimpan Uang Tunai Imputasi: ${menyimpanUangTunaiImputasi}`);

        return menyimpanUangTunaiImputasi;
      })(),
      imputasiPengeluaranLainnya: data.transaksiKeuangan?.imputasiPengeluaranLainnya || 0
    }
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
