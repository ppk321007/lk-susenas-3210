# Perbaikan Imputasi dan Perhitungan Konsumsi - February 2026

## Ringkasan Perbaikan

### 1. Masalah: Nilai Imputasi Double Conversion pada Periode 1 Tahun
**Deskripsi:**
- User input nilai 109.400.000 untuk periode "1 tahun" di Blok 4 (Halaman 3)
- Nilai yang terekam di Halaman 6 menjadi 109.400.004 (selisih 4)
- Masalahnya: data yang sudah dalam periode tahun dikonversi lagi ke monthly kemudian dikalikan 12

**Penyebab:**
1. Function `getNonFoodMonthlyTotal()` mengasumsikan semua nilai adalah bulanan
2. Ketika nilai tahun (109.400.000) diasumsikan bulanan dan dikalikan 12
3. Terjadi floating point precision error yang menghasilkan selisih ±4

**Solusi:**
- Update `getNonFoodMonthlyTotal()` untuk mengecek field `periode` di setiap entry
- Jika periode adalah "tahun", nilai dibagi 12 (bukan dikalikan 12)
- Jika periode adalah "minggu", nilai dikonversi ke monthly (30/7)
- Jika periode adalah "bulan", nilai tetap (no conversion)

**Perubahan File:**
- `src/utils/expenseNormalizer.ts` - Update `getNonFoodMonthlyTotal()`

### 2. Masalah: V.A dan V.B Entries Blank
**Deskripsi:**
- Sebelumnya V.A (Upah/Gaji Imputasi) dan V.B (Usaha Imputasi) berhasil menampilkan auto-generated entries
- Sekarang entries tersebut blank/kosong
- Auto-generated entries tidak ter-load dengan benar

**Solusi:**
- Menambahkan debug logging untuk track pembuatan auto entries
- Verifikasi bahwa `autoUpahEntriesMap` dan `autoUsahaEntriesMap` ter-populate dengan benar
- Logging ditambahkan di:
  - Awal kalkulasi (food & non-food data)
  - Akhir kalkulasi (ukuran dan isi Map)

**Perubahan File:**
- `src/utils/imputasiCalculations.ts` - Add debug logging

### 3. Perbaikan: Perhitungan Konsumsi yang Lebih Akurat
**Deskripsi:**
- Function `calculateKonsumsiRT()` di Page6 menghitung rata-rata konsumsi tahunan
- Perlu konversi yang tepat dari berbagai periode input

**Solusi:**
- Food data: Weekly → multiply by 30/7 untuk monthly
- Non-food monthly: tetap monthly (no conversion)
- Non-food yearly: divide by 12 untuk monthly
- Final: multiply by 12 untuk annual consumption

**Perubahan File:**
- `src/pages/survey/Page6.tsx` - Update `calculateKonsumsiRT()`
- `src/utils/expenseNormalizer.ts` - Improve `getFoodCategoryTotals()`

## Rumus Pengambilan Uang Tunai Imputasi

Tetap menggunakan rumus:
```
Imputasi Pengambilan Uang Tunai = Konsumsi + Total1 - Total2

Dimana:
Total1 = Biaya Produksi + Transfer Keluar + Pendapatan Kepemilikan Dibayar + 
         Penambahan Aset + Transaksi Keuangan Keluar

Total2 = Upah Gaji Barang + Nilai Produksi Sendiri + Transfer Masuk Barang + 
         Transfer Masuk Modal + Membeli Barang Kredit + Non Transaksi
```

## Testing

Untuk verifikasi perbaikan:

1. **Test Periode 1 Tahun:**
   - Input nilai 109.400.000 dengan periode "1 tahun" di Blok 4
   - Nilai di Halaman 6 seharusnya tetap 109.400.000 (atau dengan rounding minor)

2. **Test V.A dan V.B:**
   - Check browser DevTools Console
   - Lihat debug log: "AUTO GENERATED ENTRIES"
   - Verify bahwa `autoUpahEntriesMap size` > 0
   - V.A dan V.B seharusnya muncul di Page5Income

3. **Test Konsumsi:**
   - Input data dengan berbagai periode (minggu, bulan, tahun)
   - Verify konsumsi RT di Halaman 6 dihitung dengan benar

## Debugging Tips

Jika V.A atau V.B masih blank:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for "=== AUTO GENERATED ENTRIES ===" log
4. Check:
   - `autoUpahEntriesMap size`: should be > 0
   - `autoUsahaEntriesMap size`: should be > 0
   - Array contents should show generated entries

Jika nilai imputasi masih tidak sesuai:
1. Check "=== FINAL IMPUTASI CALCULATIONS ===" log
2. Verify control values di halaman 6 display
3. Ensure periode field ada di setiap entry (default: 'minggu' untuk food, 'tahun' untuk non-food yearly)

---

**Updated: 2026-02-01**
