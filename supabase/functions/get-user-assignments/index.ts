import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: exp,
    iat: now
  }));

  const encoder = new TextEncoder();
  const signatureInput = encoder.encode(`${header}.${payload}`);

  const pemContents = credentials.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${payload}.${signatureBase64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function extractSpreadsheetId(input: string): string {
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  return input;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    console.log(`Fetching assignments for user: ${username}`);

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT not configured');
    }

    const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(credentials);

    // Spreadsheet for user assignments - using PETUGAS sheet
    const spreadsheetId = extractSpreadsheetId('1YNxMezrawePnG_pSdgrnnmnXf_OUB8aM_HcJhP82p4E');
    const range = 'PETUGAS!A2:J';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    console.log(`Fetching from URL: ${url}`);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Sheets API error: ${errorText}`);
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    console.log(`Found ${rows.length} data rows`);

    // Find user's row
    const userRow = rows.find((row: string[]) => row[0]?.toLowerCase() === username.toLowerCase());

    if (!userRow) {
      console.log(`No assignment found for user: ${username}`);
      return new Response(
        JSON.stringify({ success: false, message: 'No assignment found for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the data
    // Headers: User, Pencacah, Pemeriksa, NKS, Kecamatan, Desa/Kelurahan, SLS, No Sampel, Alamat, Nama KRT
    const [user, pencacah, pemeriksa, nksRaw, kecamatanRaw, desaRaw, slsRaw, noSampelRaw, alamatRaw, namaKrtRaw] = userRow;

    // NKS and related fields use | as separator for different NKS
    const nksList = nksRaw?.split(' | ').map((n: string) => n.trim()) || [];
    const kecamatanList = kecamatanRaw?.split(' | ').map((k: string) => k.trim()) || [];
    const desaList = desaRaw?.split(' | ').map((d: string) => d.trim()) || [];
    const slsList = slsRaw?.split(' | ').map((s: string) => s.trim()) || [];
    const alamatList = alamatRaw?.split(' | ').map((a: string) => a.trim()) || [];
    
    // No Sampel uses ; to separate groups for different NKS, and | within each group
    const noSampelGroups = noSampelRaw?.split(' ; ').map((g: string) => 
      g.split(' | ').map((n: string) => n.trim())
    ) || [];
    
    // Nama KRT uses ; to separate groups for different NKS, and | within each group
    const namaKrtGroups = namaKrtRaw?.split(' ; ').map((g: string) => 
      g.split(' | ').map((n: string) => n.trim())
    ) || [];

    // Build assignments array
    const assignments = nksList.map((nks: string, index: number) => ({
      nks,
      kecamatan: kecamatanList[index] || '',
      desa: desaList[index] || '',
      sls: slsList[index] || '',
      alamat: alamatList[index] || '',
      noSampelList: noSampelGroups[index] || [],
      namaKrtList: namaKrtGroups[index] || []
    }));

    console.log(`Found ${assignments.length} NKS assignments for user: ${username}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user,
          pencacah,
          pemeriksa,
          assignments
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching user assignments:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
