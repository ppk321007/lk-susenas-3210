import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${claimB64}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = serviceAccount.private_key.replace(pemHeader, '').replace(pemFooter, '').replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function extractSpreadsheetId(input: string): string {
  if (!input.includes('/')) {
    return input;
  }
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, nks, noSampel } = await req.json();
    
    console.log(`Loading survey data for user: ${username}, NKS: ${nks}, NoSampel: ${noSampel}`);
    
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const spreadsheetIdRaw = Deno.env.get('GOOGLE_SPREADSHEET_ID');
    
    if (!serviceAccountJson || !spreadsheetIdRaw) {
      throw new Error('Missing required environment variables');
    }
    
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdRaw);
    const sheetName = 'RAW';
    
    const accessToken = await getAccessToken(serviceAccount);
    
    // Fetch all data from the sheet
    const range = `${sheetName}!A:ZZZ`;
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch data:', errorText);
      throw new Error(`Failed to fetch data: ${errorText}`);
    }
    
    const result = await response.json();
    const rows = result.values || [];
    
    console.log(`Found ${rows.length} rows in spreadsheet`);
    
    // Column layout based on save-to-sheets:
    // A=timestamp, B=username, C=namaPendata, D=pencacah, E=pemeriksa, F=nks, 
    // G=kecamatan, H=desa, I=sls, J=noSampel, K=alamat, L=namaKepalaRumahTangga,
    // M=jumlahAnggota, N=namaAnggota, O onwards = food/non-food data
    
    const normalize = (v: unknown) => (v ?? "").toString().trim().toLowerCase();
    
    // Find matching row by username, NKS, and noSampel
    let matchingRow: string[] | null = null;
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const rowUsername = normalize(row[1]); // Column B
      const rowNks = normalize(row[5]); // Column F
      const rowNoSampel = normalize(row[9]); // Column J
      
      if (rowUsername === normalize(username) && 
          rowNks === normalize(nks) && 
          rowNoSampel === normalize(noSampel)) {
        matchingRow = row;
        console.log(`Found matching row at index ${i}`);
        break;
      }
    }
    
    if (!matchingRow) {
      console.log('No existing survey data found');
      return new Response(
        JSON.stringify({ success: true, data: null, message: 'No existing data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Parse the row back into survey data structure
    // Basic identity fields (columns indexed from 0)
    const surveyData: Record<string, any> = {
      namaPendata: matchingRow[2] || '',
      pencacah: matchingRow[3] || '',
      pemeriksa: matchingRow[4] || '',
      nks: matchingRow[5] || '',
      kecamatan: matchingRow[6] || '',
      desa: matchingRow[7] || '',
      sls: matchingRow[8] || '',
      noSampel: matchingRow[9] || '',
      alamat: matchingRow[10] || '',
      namaKepalaRumahTangga: matchingRow[11] || '',
      jumlahAnggotaRumahTangga: parseInt(matchingRow[12]) || 1,
      namaAnggotaRumahTangga: matchingRow[13] ? matchingRow[13].split(', ').filter(Boolean) : [''],
    };
    
    // Parse food items starting from column 14 (index 14)
    // The format is: ItemName_Value_Category_Detail; ItemName_Value_Category_Detail | ...
    // We need to parse this back into the makananMinuman structure
    surveyData.makananMinuman = {};
    
    // Parse expense entry format back to object
    const parseExpenseCell = (cellValue: string): { entries: Array<{ nilai: number; kategori: string; jenisDetail: string }> } => {
      if (!cellValue || cellValue === '0') {
        return { entries: [] };
      }
      
      const entries: Array<{ nilai: number; kategori: string; jenisDetail: string }> = [];
      
      // Split by | first (separates Pembelian from Pemberian groups)
      const groups = cellValue.split(' | ').filter(Boolean);
      
      for (const group of groups) {
        // Split by ; for multiple entries within same category
        const items = group.split('; ').filter(Boolean);
        
        for (const item of items) {
          // Format: ItemName_Value_Category_Detail
          const parts = item.split('_');
          if (parts.length >= 4) {
            const nilai = parseFloat(parts[1]) || 0;
            const kategori = parts[2] || '';
            const jenisDetail = parts[3] || '';
            
            if (nilai > 0) {
              entries.push({ nilai, kategori, jenisDetail });
            }
          }
        }
      }
      
      return { entries };
    };
    
    // We'll store the raw column data for food items starting at index 14
    // Since reconstructing the full structure is complex, we store the raw format
    // and let the frontend handle the display
    
    // For simplicity, we'll return what we have and let components handle parsing
    console.log('Successfully parsed survey data');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: surveyData,
        rawRow: matchingRow // Send raw row for complex fields
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error loading survey data:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to load survey data', error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
