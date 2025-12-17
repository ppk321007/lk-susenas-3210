import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface UserData {
  role: string;
  nama: string;
  password: string;
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: credentials.token_uri,
    exp: exp,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const claimSetB64 = btoa(JSON.stringify(claimSet)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signatureInput = `${headerB64}.${claimSetB64}`;

  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function getUsersFromSheet(accessToken: string, spreadsheetId: string): Promise<UserData[]> {
  const range = 'USER!A:C';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error fetching sheet data:', errorText);
    throw new Error(`Failed to fetch sheet data: ${response.status}`);
  }

  const data = await response.json();
  const rows = data.values || [];
  
  // Skip header row and map data
  const users: UserData[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 3) {
      users.push({
        role: row[0] || '',
        nama: row[1] || '',
        password: row[2] || '',
      });
    }
  }
  
  return users;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nama, password } = await req.json();
    
    console.log('Login attempt for user:', nama);

    if (!nama || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Nama dan password harus diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get credentials from environment
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const spreadsheetId = Deno.env.get('GOOGLE_USER_SPREADSHEET_ID');

    if (!serviceAccountJson || !spreadsheetId) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ success: false, message: 'Konfigurasi server tidak lengkap' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountJson);
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(credentials);
    
    console.log('Fetching users from sheet...');
    const users = await getUsersFromSheet(accessToken, spreadsheetId);
    
    console.log(`Found ${users.length} users in sheet`);

    // Find matching user
    const user = users.find(u => 
      u.nama.toLowerCase() === nama.toLowerCase() && 
      u.password === password
    );

    if (user) {
      console.log('Login successful for user:', nama);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Login berhasil',
          user: {
            nama: user.nama,
            role: user.role
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Login failed - invalid credentials for:', nama);
      return new Response(
        JSON.stringify({ success: false, message: 'Nama atau password salah' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

  } catch (error) {
    console.error('Error in verify-login:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Terjadi kesalahan pada server' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
