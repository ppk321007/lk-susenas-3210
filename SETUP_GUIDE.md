# LK Susenas 3210 - Setup Guide

## Prerequisites

- Node.js 16+
- Supabase account
- Google Cloud project dengan Google Sheets API enabled
- Git

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/ppk321007/lk-susenas-3210.git
cd lk-susenas-3210
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env` file in root directory:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

Get these values from [Supabase Dashboard](https://app.supabase.com)

### 4. Setup Google Sheets API

#### 4.1 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Sheets API:
   - Search for "Google Sheets API"
   - Click Enable
4. Create Service Account:
   - Go to Credentials → Create Credentials → Service Account
   - Fill in details (name, email auto-filled)
   - Skip optional steps
5. Create Key:
   - Click on created service account
   - Go to Keys tab
   - Click Add Key → Create new key → JSON
   - Save the JSON file

#### 4.2 Add Service Account to Google Sheets

1. Open your Google Sheets workbook
2. Share it with service account email (from JSON key file)
   - Copy `client_email` from JSON key
   - Share as "Editor"

#### 4.3 Get Spreadsheet ID

From Google Sheets URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

Update in function: `supabase/functions/get-user-assignments/index.ts`

```typescript
const spreadsheetId = extractSpreadsheetId('YOUR_SPREADSHEET_ID_HERE');
```

### 5. Deploy Supabase Functions

#### 5.1 Install Supabase CLI

```bash
npm install -g @supabase/cli
```

#### 5.2 Login to Supabase

```bash
supabase login
```

#### 5.3 Link Project

```bash
supabase link --project-ref your-project-id
```

Get project ref from Supabase URL: `https://your-project.supabase.co`

#### 5.4 Create Secrets

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT "$(cat /path/to/service-account.json)"
```

On Windows PowerShell:

```powershell
$serviceAccountJson = Get-Content "C:\path\to\service-account.json" -Raw
supabase secrets set GOOGLE_SERVICE_ACCOUNT $serviceAccountJson
```

#### 5.5 Deploy Functions

```bash
supabase functions deploy
```

Verify deployment:

```bash
supabase functions list
```

## Running the Application

### Development

```bash
npm run dev
```

Access at `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## Google Sheets Structure

The `PETUGAS` sheet should have the following columns (starting row 2):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| User | Pencacah | Pemeriksa | NKS | Kecamatan | Desa/Kelurahan | SLS | No Sampel | Alamat | Nama KRT |

### Example:

| User | Pencacah | Pemeriksa | NKS | Kecamatan | Desa | SLS | No Sampel | Alamat | Nama KRT |
|------|----------|-----------|-----|-----------|------|-----|-----------|--------|----------|
| ppk321007 | BUDI SANTOSO | AHMAD HIDAYAT | 123101001 \| 123101002 | Kec. Temon \| Kec. Panjatan | Desa A \| Desa B | SLS 001 \| SLS 002 | 001 \| 002 \| 003; 004 \| 005 | Jl. Test 1 \| Jl. Test 2 | NAMA1 \| NAMA2; NAMA3 \| NAMA4 |

### Data Format:

- **Multiple NKS per user**: Use `|` (pipe) separator
  - Example: `123101001 | 123101002 | 123101003`
  
- **Multiple No Sampel per NKS**: 
  - First NKS samples: `001 | 002 | 003`
  - Second NKS samples: `004 | 005`
  - Combined: `001 | 002 | 003; 004 | 005` (semicolon separates NKS groups)

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Debug Checklist

- [ ] `.env` file exists with correct Supabase credentials
- [ ] Google Sheets API enabled in Google Cloud
- [ ] Service account created and has JSON key
- [ ] Service account email added to Google Sheets (shared)
- [ ] Supabase functions deployed
- [ ] `GOOGLE_SERVICE_ACCOUNT` secret set in Supabase
- [ ] Username exists in PETUGAS sheet column A
- [ ] Browser console shows error details (F12)

## File Structure

```
lk-susenas-3210/
├── src/
│   ├── pages/
│   │   ├── Login.tsx              # Login page
│   │   ├── Index.tsx              # Dashboard/Home
│   │   └── survey/
│   │       ├── Page1Identity.tsx   # Assignment & identity data
│   │       ├── Page2Food.tsx       # Food consumption
│   │       ├── Page3NonFood.tsx    # Non-food expenses
│   │       ├── Page4Recap.tsx      # Review & recap
│   │       └── ...
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts          # Supabase client config
│   └── components/                # Reusable UI components
├── supabase/
│   └── functions/
│       ├── verify-login/          # Login verification
│       ├── get-user-assignments/  # Load assignments from Sheets
│       ├── load-survey-data/      # Load survey data
│       └── save-to-sheets/        # Save survey data to Sheets
├── .env                            # Environment variables
└── README.md
```

## API Functions

### 1. `verify-login`
- Input: `{ nama, password }`
- Output: `{ success, user: { nama, ... } }`

### 2. `get-user-assignments`
- Input: `{ username }`
- Output: `{ success, data: { user, pencacah, pemeriksa, assignments: [...] } }`

### 3. `load-survey-data`
- Input: `{ nks, noSampel }`
- Output: `{ success, data: { surveyData: {...} } }`

### 4. `save-to-sheets`
- Input: Survey data
- Output: `{ success, message }`

## Support

For issues:
1. Check browser DevTools (F12 → Console)
2. Check Supabase function logs
3. See TROUBLESHOOTING.md
4. Contact administrator

---

**Last Updated:** 2026-02-01
