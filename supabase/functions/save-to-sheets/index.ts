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

  // Import the private key
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

  // Exchange JWT for access token
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function flattenSurveyData(data: any): string[] {
  const values: string[] = [];
  const timestamp = new Date().toISOString();
  
  // Add timestamp first
  values.push(timestamp);
  
  // Identity data
  values.push(data.namaPendata || '');
  values.push(data.kecamatan || '');
  values.push(data.desa || '');
  values.push(data.alamat || '');
  values.push(data.namaKepalaRumahTangga || '');
  values.push(String(data.jumlahAnggotaRumahTangga || 0));
  values.push((data.namaAnggotaRumahTangga || []).join(', '));
  
  // Makanan Minuman (Food data)
  const makananMinumanKeys = Object.keys(data.makananMinuman || {}).sort();
  for (const key of makananMinumanKeys) {
    const item = data.makananMinuman[key];
    values.push(`${key}:pembelian=${item?.pembelian || 0}|produksiSendiri=${item?.produksiSendiri || 0}|jenisPembelian=${item?.jenisPembelian || ''}|jenisProduksiSendiri=${item?.jenisProduksiSendiri || ''}`);
  }
  
  // Non-food commodities (sebulan)
  const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const cat of categories) {
    const komoditiKey = `komoditi${cat}Sebulan`;
    const komoditiData = data[komoditiKey] || {};
    const keys = Object.keys(komoditiData).sort();
    for (const key of keys) {
      const item = komoditiData[key];
      values.push(`${komoditiKey}.${key}:pembelian=${item?.pembelian || 0}|produksiSendiri=${item?.produksiSendiri || 0}`);
    }
  }
  
  // Non-food commodities (setahun)
  const komoditiSetahunKeys = Object.keys(data.komoditiSetahun || {}).sort();
  for (const key of komoditiSetahunKeys) {
    const item = data.komoditiSetahun[key];
    values.push(`komoditiSetahun.${key}:pembelian=${item?.pembelian || 0}|produksiSendiri=${item?.produksiSendiri || 0}`);
  }
  
  // Income - Upah Gaji
  const upahEntries = (data.pendapatanUpah || []).map((u: any, i: number) => 
    `upah${i}:uraian=${u.uraianPekerjaan || ''}|kategoriLU=${u.kategoriLU || ''}|jenisPekerjaan=${u.jenisPekerjaan || ''}|upahUang=${u.upahUang || 0}|upahBarang=${u.upahBarang || 0}|lembur=${u.lembur || 0}|imputasi=${u.imputasiUpahGajiBarang || 0}`
  );
  values.push(upahEntries.join('||'));
  
  // Income - Usaha
  const usahaEntries = (data.pendapatanUsaha || []).map((u: any, i: number) => 
    `usaha${i}:uraian=${u.uraianKegiatan || ''}|kategoriLU=${u.kategoriLU || ''}|jenisPekerjaan=${u.jenisPekerjaan || ''}|nilaiProduksi=${u.nilaiProduksi || 0}|biayaProduksi=${u.biayaProduksi || 0}|surplus=${u.surplus || 0}|imputasi=${u.imputasiNilaiProduksi || 0}`
  );
  values.push(usahaEntries.join('||'));
  
  // Produksi Sendiri
  const ps = data.produksiSendiri || {};
  values.push(`perkiraanSewaRumah:nilaiProduksi=${ps.perkiraanSewaRumah?.nilaiProduksi || 0}|biayaProduksi=${ps.perkiraanSewaRumah?.biayaProduksi || 0}|surplus=${ps.perkiraanSewaRumah?.surplus || 0}|imputasi=${ps.perkiraanSewaRumah?.imputasiNilaiProduksi || 0}`);
  values.push(`hasilPertanian:nilaiProduksi=${ps.hasilPertanian?.nilaiProduksi || 0}|biayaProduksi=${ps.hasilPertanian?.biayaProduksi || 0}|surplus=${ps.hasilPertanian?.surplus || 0}|imputasi=${ps.hasilPertanian?.imputasiNilaiProduksi || 0}`);
  
  // Pendapatan Kepemilikan
  const pk = data.pendapatanKepemilikan || {};
  for (const key of ['sewaLahan', 'bagi_hasil', 'deviden', 'bunga']) {
    values.push(`kepemilikan.${key}:diterima=${pk[key]?.diterima || 0}|dibayar=${pk[key]?.dibayar || 0}`);
  }
  
  // Transfer Berjalan
  const tb = data.transferBerjalan || {};
  for (const key of ['pemerintah', 'pemerintahUangPensiun', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri']) {
    const item = tb[key] || {};
    values.push(`transferBerjalan.${key}:diterimaUang=${item.diterimaUang || 0}|diterimaBarang=${item.diterimaBarang || 0}|dibayarUang=${item.dibayarUang || 0}|dibayarBarang=${item.dibayarBarang || 0}|imputasiDiterimaUang=${item.imputasiTransferDiterimaUang || 0}|imputasiDiterimaBarang=${item.imputasiTransferDiterimaBarang || 0}`);
  }
  
  // Transfer Modal
  const tm = data.transferModal || {};
  for (const entity of ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri']) {
    const entityData = tm[entity] || {};
    for (const direction of ['diterima', 'dibayar']) {
      const dirData = entityData[direction] || {};
      for (const asset of ['bangunanTinggal', 'bangunanBukan', 'alatProduksi', 'tanamanHewan', 'kendaraan', 'lahan']) {
        values.push(`transferModal.${entity}.${direction}.${asset}=${dirData[asset] || 0}`);
      }
    }
  }
  
  // Aset Perubahan
  const ap = data.asetPerubahan || {};
  // Aset Tetap Usaha
  for (const asset of ['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan', 'lainnya']) {
    const item = ap.asetTetapUsaha?.[asset] || {};
    values.push(`asetTetapUsaha.${asset}:pembelian=${item.pembelian || 0}|pemberian=${item.pemberian || 0}|pembuatanSendiri=${item.pembuatanSendiri || 0}|penjualan=${item.penjualan || 0}|pemberianKepada=${item.pemberianKepada || 0}|netto=${item.netto || 0}|imputasiPemberian=${item.imputasiPenamabahanPemberian || 0}|imputasiPemberianKepada=${item.imputasiPenguranganPemberianKepada || 0}`);
  }
  
  // Other assets
  for (const asset of ['bangunanTinggal', 'biayaPemindahan', 'lahanBarang']) {
    const item = ap[asset] || {};
    values.push(`aset.${asset}:pembelian=${item.pembelian || 0}|pemberian=${item.pemberian || 0}|pembuatanSendiri=${item.pembuatanSendiri || 0}|penjualan=${item.penjualan || 0}|pemberianKepada=${item.pemberianKepada || 0}|netto=${item.netto || 0}|imputasiPemberian=${item.imputasiPenamabahanPemberian || 0}|imputasiPemberianKepada=${item.imputasiPenguranganPemberianKepada || 0}`);
  }
  
  // Transaksi Keuangan
  const tk = data.transaksiKeuangan || {};
  values.push(`transaksiKeuangan:pengambilanUangTunai=${tk.pengambilanUangTunai || 0}|meminjamUang=${tk.meminjamUang || 0}|menerimaPembayaranKredit=${tk.menerimaPembayaranKredit || 0}|kreditBarang=${tk.kreditBarang || 0}|lainnyaPenerimaan=${tk.lainnyaPenerimaan || 0}|menyimpanUangTunai=${tk.menyimpanUangTunai || 0}|membayarHutang=${tk.membayarHutang || 0}|memberikanKreditBarang=${tk.memberikanKreditBarang || 0}|membayarKreditBarang=${tk.membayarKreditBarang || 0}|lainnyaPengeluaran=${tk.lainnyaPengeluaran || 0}`);
  
  return values;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData } = await req.json();
    
    if (!surveyData) {
      throw new Error('Survey data is required');
    }

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

    if (!serviceAccountJson || !spreadsheetId) {
      throw new Error('Google credentials or spreadsheet ID not configured');
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(serviceAccount);
    
    console.log('Preparing data for sheets...');
    const rowValues = flattenSurveyData(surveyData);
    
    // Join all values with "|" separator into a single cell per field
    // Actually, let's put each value in its own cell, with "|" as value separator within complex fields
    
    console.log(`Appending ${rowValues.length} values to sheet RAW...`);
    
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/RAW!A:ZZZ:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    
    const appendResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      console.error('Sheets API error:', errorText);
      throw new Error(`Failed to append data to sheet: ${errorText}`);
    }

    const result = await appendResponse.json();
    console.log('Data appended successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data berhasil disimpan ke Google Sheets',
        updatedRange: result.updates?.updatedRange 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-to-sheets function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
