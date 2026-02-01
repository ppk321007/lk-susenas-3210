# Period Conversion Formula Verification

## ✅ Formula Implemented

### Periode Weekly → Yearly Conversion

**Formula yang digunakan:**
```
Nilai Setahun = Nilai Minggu × (30/7) × 12
```

### Lokasi Implementasi

#### 1. **BLOK II - Makanan (Food)**
File: [src/pages/survey/Page6.tsx](src/pages/survey/Page6.tsx#L174)

```typescript
// Line 174: Food is in weekly period - convert to yearly (30/7 * 12), don't round yet
const foodYearlyTotal = foodSubtotal * 30 / 7 * 12;
```

**Penjelasan:**
- Makanan input dalam periode **mingguan** (weekly)
- Konversi: minggu → bulan = `nilai × 30/7`
- Konversi: bulan → tahun = `nilai × 12`
- **Combined:** `nilai × 30/7 × 12` ✅

#### 2. **BLOK III - Non-Makanan (Non-Food) - Bulanan**
File: [src/pages/survey/Page6.tsx](src/pages/survey/Page6.tsx#L179)

```typescript
// Line 179: Convert monthly to yearly
return totalYearly + (getNonFoodMonthlyTotal(monthlyData) * 12);
```

**Penjelasan:**
- Non-makanan input dalam periode **bulanan** (monthly)
- Konversi: bulan → tahun = `nilai × 12`
- Tidak perlu konversi 30/7 ✅

#### 3. **BLOK III - Non-Makanan (Non-Food) - Tahunan**
File: [src/pages/survey/Page6.tsx](src/pages/survey/Page6.tsx#L183-L185)

```typescript
// Line 183-185: Use yearly value directly (no conversion needed)
const nonFoodYearlyTotal = Object.keys(NON_FOOD_CATEGORIES).reduce((totalYearly, categoryKey) => {
  const yearlyTotal = getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
  return totalYearly + yearlyTotal; // Use yearly value directly
}, 0);
```

**Penjelasan:**
- Non-makanan input dalam periode **tahunan** (yearly)
- Tidak perlu konversi, gunakan langsung ✅

---

## 📊 Rincian Konversi

### Weekly → Yearly

#### Contoh Perhitungan:
```
Nilai Input (minggu):  30,000 Rp
         ↓ × 30/7
Nilai Bulanan:         30,000 × 30/7 = 128,571.43 Rp
         ↓ × 12
Nilai Setahun:         128,571.43 × 12 = 1,542,857.14 Rp
```

**Atau langsung:**
```
Nilai Setahun = 30,000 × 30/7 × 12 = 1,542,857.14 Rp
```

### Monthly → Yearly

#### Contoh Perhitungan:
```
Nilai Input (bulanan): 100,000 Rp
         ↓ × 12
Nilai Setahun:         100,000 × 12 = 1,200,000 Rp
```

### Yearly → Yearly

```
Nilai Input (tahunan): 1,200,000 Rp
Nilai Setahun:         1,200,000 Rp (tidak ada konversi)
```

---

## ✅ Verification Checklist

- [x] Formula `minggu × 30/7 × 12` diimplementasikan di calculateKonsumsiRT()
- [x] Food data (BLOK II) menggunakan periode weekly
- [x] Non-food monthly (BLOK III sebulan) menggunakan × 12
- [x] Non-food yearly (BLOK III setahun) gunakan langsung
- [x] Rounding hanya dilakukan pada FINAL total (tidak pada intermediate values)

---

## 🎯 Status

✅ **SUDAH MEMENUHI ATURAN PERIODE CONVERSION**

Formula yang digunakan:
- **Weekly → Yearly:** `nilai × 30/7 × 12` ✅
- **Monthly → Yearly:** `nilai × 12` ✅  
- **Yearly → Yearly:** `nilai` (no conversion) ✅

---

**Last Verified:** 2026-02-02  
**Implementation Status:** ✅ Correct & Complete
