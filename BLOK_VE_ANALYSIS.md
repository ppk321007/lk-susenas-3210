# BLOK V.E - Transfer Diterima Imputasi Analysis

## 📊 Data Comparison

### Perubahan Nilai saat Reload

| Field | Nilai Awal | Setelah Reload | Selisih |
|-------|------------|----------------|---------|
| **pemerintahBantuan ImputasiBarang** | 7,787,714 | 4,084,857 | **-3,702,857** ⚠️ |
| **rumahTanggaLain ImputasiBarang** | 4,837,143 | **0** | **-4,837,143** 🔴 |

---

## 🔍 Trigger Conditions & Calculation

### 1. pemerintahBantuan ImputasiBarang
**Trigger:** `kategori === 'Produksi Sendiri/Pemberian'` AND `jenisDetail === 'Pemberian dari Pemerintah secara Gratis'`

#### BLOK II (Makanan) - Items yang Match:
```
Susu cair pabrik_30000_Produksi Sendiri/Pemberian_Pemberian dari Pemerintah secara Gratis
  → 30,000 Rp/bulan = 360,000 Rp/tahun ✓

Jeruk, jeruk bali_7000_Produksi Sendiri/Pemberian_Pemberian dari Pemerintah secara Gratis
  → 7,000 Rp/bulan = 84,000 Rp/tahun ✓

BLOK II Subtotal: 444,000 Rp/tahun
```

#### BLOK III (Non-Makanan) - Items yang Match:
```
Asuransi kesehatan (BPJS PBI, asuransi kesehatan)_1260000_Pemberian_Pemberian dari Pemerintah secara Gratis
  → 1,260,000 Rp/tahun ✓

Uang sekolah (SPP/UKT dan iuran komite)_922000_Pemberian_Pemberian dari Pemerintah secara Gratis
  → 922,000 Rp/tahun ✓

BLOK III Subtotal: 2,182,000 Rp/tahun
```

**Calculated Total: 444,000 + 2,182,000 = 2,626,000 Rp/tahun**

❌ **TETAPI Sheet menyimpan: 7,787,714** (LEBIH BESAR 5.16M!)

---

### 2. rumahTanggaLain ImputasiBarang
**Trigger:** `kategori === 'Produksi Sendiri/Pemberian'` AND `jenisDetail === 'Pemberian dari Rumah Tangga Lain'`

#### BLOK II (Makanan) - Items yang Match:
```
Sawi hijau_5000_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain
  → 5,000 Rp/bulan = 60,000 Rp/tahun ✓

Tomat sayur, tomat ceri_2000_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain
  → 2,000 Rp/bulan = 24,000 Rp/tahun ✓

Ketela rambat/ubi Jalar_5000_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain
  → 5,000 Rp/bulan = 60,000 Rp/tahun ✓

Talas/keladi_4000_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain
  → 4,000 Rp/bulan = 48,000 Rp/tahun ✓

Mie instan_10000_Produksi Sendiri/Pemberian_Pemberian dari Rumah Tangga Lain
  → 10,000 Rp/bulan = 120,000 Rp/tahun ✓

BLOK II Subtotal: 312,000 Rp/tahun
```

#### BLOK III (Non-Makanan) - Items yang Match:
```
(Tidak ada item dengan jenis detail "Pemberian dari Rumah Tangga Lain")
BLOK III Subtotal: 0 Rp/tahun
```

**Calculated Total: 312,000 + 0 = 312,000 Rp/tahun**

❌ **TETAPI Sheet menyimpan: 4,837,143** (JAUH LEBIH BESAR 4.5M!)

---

## 🚨 Masalah Setelah Reload

Ketika data di-load kembali, `calculateImputasiFromFood()` di-call dan re-calculate nilai:

```typescript
let pemerintahBantuanImputasiBarang = 0;
let rumahTanggaLainImputasiBarang = 0;

// Loop through BLOK II dan BLOK III items
// Add ke imputasi jika match trigger conditions
```

**Hasil setelah reload:**
- pemerintahBantuan: 4,084,857 (BERKURANG dari 7.8M)
- rumahTanggaLain: 0 (HILANG dari 4.8M)

### Kemungkinan Penyebab:

#### Scenario 1: Item BLOK III tidak ter-recognize
```typescript
// Di imputasiCalculations.ts
if (isPemberianKategoriNonFood(kategori) && jenisDetail === 'Pemberian dari Pemerintah secara Gratis') {
  // Add to pemerintahBantuanImputasiBarang
}
```

Jika `isPemberianKategoriNonFood()` return false untuk item tertentu, item tidak di-count!
- Kemungkinan: kategori itemKey tidak ada di `nonFoodDetailCategories.ts`
- Contoh: "Asuransi kesehatan" mungkin tidak ter-list dengan key yang exact

#### Scenario 2: Data parsing error
Saat load dari sheet, format data mungkin berbeda:
- Data di-save: `Asuransi kesehatan (Setahun)_1260000_Pemberian_Pemberian dari Pemerintah secara Gratis`
- Data di-load: Item key tidak match, atau jenisDetail ter-truncate

#### Scenario 3: BLOK V.A data hilang
Sheet menunjukkan data dari pendapatan upah/pemerintah juga berubah:
- Awal: 3 entry VA (Dahana, Kader, Mitra BPS)
- Reload: 0 entry VA

Jika VA data hilang, mungkin JUGA ada transformasi pada VB yang memicu perubahan VE.

---

## ✅ Debugging Checklist

- [ ] **Check `nonFoodDetailCategories.ts`** - Apakah semua item non-food ter-list?
- [ ] **Verify non-food item keys** - Apakah format key match dengan yang di-load dari sheet?
- [ ] **Add logging** di `calculateImputasiFromFood()` untuk trace setiap item kategori pemerintah/rumah tangga
- [ ] **Compare save vs load** - `formatNonFoodData()` vs `parseNonFoodData()`
- [ ] **Check sheet data** - Verify non-food columns ter-save dengan format benar
- [ ] **Investigate BLOK V.A** - Mengapa VA entries hilang saat reload?

---

**Status:** 🔴 Under Investigation  
**Last Updated:** 2026-02-02
