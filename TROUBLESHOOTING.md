# Troubleshooting Guide - LK Susenas 3210

## Error: "Gagal memuat data penugasan" (Failed to load assignment data)

### Penyebab Kemungkinan

1. **Supabase Edge Function tidak ter-deploy**
   - Periksa apakah `get-user-assignments` function sudah di-deploy ke Supabase

2. **Google Sheets API credentials tidak dikonfigurasi**
   - Function membutuhkan service account credentials untuk akses Google Sheets
   - Set environment variables di Supabase:
     - `GOOGLE_SHEETS_SPREADSHEET_ID`
     - `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string)

3. **Username tidak ditemukan di spreadsheet**
   - Pastikan nama pengguna sesuai dengan data di Google Sheets
   - Username bersifat case-insensitive dan akan di-trim dari whitespace

4. **Network/Connectivity issues**
   - Periksa koneksi internet
   - Cek network tab di browser DevTools

### Solusi

#### 1. Deploy Supabase Functions

```bash
# Install Supabase CLI jika belum
npm install -g @supabase/cli

# Login ke Supabase
supabase login

# Deploy functions
supabase functions deploy
```

#### 2. Setup Google Sheets API

1. Buat service account di Google Cloud Console
2. Download JSON key file
3. Di Supabase Dashboard:
   - Buka Project Settings → Edge Functions → Secrets
   - Tambahkan secrets:
     ```
     GOOGLE_SHEETS_SPREADSHEET_ID=<your-spreadsheet-id>
     GOOGLE_SERVICE_ACCOUNT_KEY=<entire-json-content>
     ```

#### 3. Verify Data
- Check that username exists in the first column of Google Sheets
- Username harus match exactly (setelah case normalization)

### Debug Steps

1. **Open Browser DevTools** (F12)
   - Go to Console tab
   - Look for error messages starting with "Error fetching user assignments:"
   - Copy full error message

2. **Check Network tab**
   - Filter for "get-user-assignments"
   - Look at response status and body
   - Status 500 = server error (check function logs)
   - Status 404 = function not deployed

3. **View Supabase Function Logs**
   - Go to Supabase Dashboard
   - Navigate to Functions section
   - Click on `get-user-assignments`
   - Check logs for errors

4. **Check localStorage**
   - Open DevTools → Application → Local Storage
   - Look for `userInfo` key
   - Verify `nama` field is populated correctly

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Supabase Function Error" | Function not deployed or URL wrong | Deploy function using CLI |
| "Respons kosong dari server" | Function returning null/undefined | Check function implementation |
| "Tidak ada penugasan..." | User not found in spreadsheet | Add user to Google Sheets |
| "Data penugasan tidak tersedia" | API response missing data | Check Google Sheets structure |

### Testing

1. Use Postman or curl to test function directly:
```bash
curl -X POST https://xerhknlimexezgtdzpbl.supabase.co/functions/v1/get-user-assignments \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user"}'
```

2. Check Google Sheets API quota
3. Verify service account has spreadsheet access

---

**Last Updated:** 2026-02-01  
**For issues, check browser DevTools Console for detailed error messages**

---

## Troubleshooting: BLOK VII Transaksi Keuangan Data Loss on Reload

### Problem
- BLOK VII (Rekapitulasi Pengeluaran) data berhasil disave ke spreadsheet
- Tapi saat reload data, nilai menjadi 0

### Root Cause Analysis

Data loss terjadi di tahap **parsing/loading** dari Google Sheets. Beberapa kemungkinan:

1. **Sheet columns bergeser** - `colIndex` pada saat loading tidak sesuai dengan saat save
   - Contoh: Page 6 cells di-expect di column 120, tapi sebenarnya di column 125
   
2. **Format parsing tidak match** - Regex di `parsePage6Data()` tidak match format yang disave
   - Save format: `Pengambilan Uang Tunai_Nilai:100_Imputasi:20`
   - Regex: `/(.+?)_Nilai:(\d+)_Imputasi:(\d+)/`

3. **Cells kosong** - Sheet cells untuk Page 6 memang tidak terisi data

### Debug Steps

1. **Enable Function Logs**
   - Deploy latest code dari branch main (includes debug logging)
   - Check Supabase edge function logs saat reload data

2. **Check Console Logs untuk ini:**
   ```
   📊 PAGE 6 cells at index X-Y: ["...","..."]
   🔍 parsePage6Data called with cells: ["...","..."]
   📥 Penerimaan cell: ...
   📤 Pengeluaran cell: ...
   ✅ Final parsed transaksiKeuangan: {...}
   ```

3. **Check Save Logs:**
   ```
   💾 formatPage6Data - transaksiKeuangan: {...}
   📥 Penerimaan formatted: ...
   📤 Pengeluaran formatted: ...
   ```

### Solutions

**If cells are empty:**
- Check Google Sheets manually - verify BLOK VII columns have data
- Might need to re-save data

**If format mismatch:**
- Verify save format matches parsing regex
- Check formatPage6Data() output

**If column index wrong:**
- Compare colIndex value saat loading dengan saat saving
- Sheet columns might have been reorganized
- May need to adjust colIndex offset

### Recommended Action for Users

1. Deploy latest code with debug logging
2. Test: Save BLOK VII data → Reload
3. Check browser console (F12) for the debug logs above
4. Share logs dengan developer untuk debug lebih lanjut

#### Reproducing the Issue

1. Fill BLOK VII form with some values
2. Click "Simpan"
3. Logout/Close browser
4. Login again and load the same record
5. Check if BLOK VII values are still 0
