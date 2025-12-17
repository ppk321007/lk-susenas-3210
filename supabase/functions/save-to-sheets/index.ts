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

// All food category items
const FOOD_ITEMS = [
  // A - PADI-PADIAN
  "Beras (beras lokal, medium, premium, impor)", "Beras Ketan", "Jagung basah dengan kulit", 
  "Jagung pipilan/beras jagung/jagung titi", "Tepung terigu", "Padi-padian Lainnya",
  // B - UMBI-UMBIAN
  "Ketela pohon/singkong", "Ketela rambat/ubi Jalar", "Sagu (bukan dari ketela pohon)", 
  "Talas/keladi", "Kentang", "Gaplek", "Umbi-umbi Lainnya",
  // C - IKAN
  "Ekor kuning", "Tongkol", "Tuna", "cakalang,dencis", "Tenggiri", "Selar",
  "Kembung, lema/tatare,banyar/banyara", "Teri basah", "Bandeng", "Gabus", "Mujair", "Mas",
  "Nila", "Lele", "Kakap", "Baronang", "Patin", "Bawal", "Gurame", "Ikan layang",
  "Ikan baung", "Ikan belanak", "Ikan wader/seluang", "Belut", "Ikan segar/ basah lainnya…",
  "Olahan ikan segar (siomay ikan, otak-otak ikan, dll.)", "Udang, lobster",
  "Cumi-cumi,sotong,gurita", "Ketam,kepiting,rajungan", "Kerang,siput,bekicot,remis",
  "Udang dan hewan air segar lainnya", "Kembung Diawetkan/Peda", "Tenggiri Diawetkan",
  "Tongkol/Tuna/Cakalang, dencis, ikan kayu diawetkan", "Teri diawetkan", "Selar diawetkan",
  "Sepat diawetkan", "Bandeng diawetkan", "Gabus diawetkan", "Ikan dalam kaleng (sardencis,tuna dll)",
  "Ikan diawetkan lainnya", "Udang diawetkan (ebi, rebon)", "Cumi-cumi,sotong,gurita diawetkan",
  "Udang dan Hewan Air Lainnya yang diawetkan",
  // D - DAGING
  "Daging sapi", "Daging kerbau", "Daging Kambing,domba,biri-biri", "Daging Babi",
  "Daging ayam ras", "Daging ayam kampung", "Daging Segar Lainnya",
  "Daging sapi diawetkan/olahan daging sapi (sosis sapi, abon sapi, bakso sapi,dll)",
  "Daging ayam diawetkan/olahan daging sapi (sosis ayam, abon ayam, bakso ayam,dll)",
  "Daging lainnya diawetkan", "Tetelan, sandung lamur",
  "Lainnya (hati, jeroan, iga, kaki, buntut, kepala, dsb)",
  // E - TELUR DAN SUSU
  "Telur ayam ras", "Telur ayam kampung", "Telur itik/itik manila",
  "Telur lainnya (telur puyuh, telur asin, telur penyu, telur angsa dsb)",
  "Susu cair pabrik", "Susu kental manis", "Susu bubuk", "Susu bubuk bayi",
  "Susu murni", "Hasil lain dari susu (keju, yoghurt,dsb)",
  // F - SAYUR
  "Bayam", "Kangkung", "Kol/Kubis", "Sawi Putih (petsai)", "Sawi hijau", "Buncis",
  "Kacang Panjang", "Tomat sayur,tomat ceri", "Wortel", "Mentimun",
  "Daun ketela pohon/daun singkong", "Terong", "Tauge", "Labu,labu siam,labu parang",
  "Bahan sayur sop/capcay /kimlo (paket)", "Bahan sayur asem/lodeh (paket)",
  "Nangka muda", "pepaya muda", "Jengkol", "Bawang merah", "Bawang putih",
  "Bawang Bombay", "Cabe Merah", "Cabe hijau", "Cabe rawit", "Daun pepaya",
  "Daun kelor", "Daun katuk", "Daun bawang", "Duan pakis", "Daun kemanggi",
  "Oyang/Gambas", "Rebung", "Jamur (jamur tiram, enoki, dll)", "Sayur-sayuran Lainnya",
  // G - KACANG
  "Kacang tanah tanpa kulit", "Kacang kedelai", "Kacang lainnya", "Tahu", "Tempe",
  "Oncom", "Hasil lain dari kacang-kacangan",
  // H - BUAH
  "Jeruk, jeruk bali", "Mangga", "Apel", "Rambutan", "Duku, langsat", "Durian",
  "Salak", "Pisang ambon", "Pisang lainnya", "Pepaya", "Semangka", "Tomat buah",
  "Alpukat", "Jambu Biji", "Nanas", "Nangka muda", "Pir", "Anggur", "Buah Naga",
  "Jambu Air", "Melon", "Manggis", "Kelengkeng", "Buah-buahan lainnya",
  // I - MINYAK
  "Minyak Kelapa", "Minyak goreng (kelapa sawit, bunga matahari)",
  "Kelapa (tidak termasuk santan instan)", "Minyak dan kelapa lainnya",
  // J - BAHAN MINUMAN
  "Gula pasir", "Gula merah, gula air (pohon aren, kelapa, lontar)", "Teh bubuk",
  "Teh celup (sachet)", "Kopi (bubuk, biji)", "Kopi instant (sachet)", "Bahan Minuman Lainnya",
  // K - BUMBU
  "Garam", "Kemiri", "Ketumbar/jinten", "Merica/lada", "Jahe", "Kunyit", "Asam",
  "Terasi/petis", "Kecap", "Penyedap masakan/vetsin", "Sambal jadi", "Saus tomat",
  "Bumbu masak jadi/kemasan, bumbu racik", "Bumbu Lainnya (kencur, pala, kapulaga, dsb.)",
  // L - BAHAN MAKANAN LAINNYA
  "Mie instan", "Kerupuk", "Bubur bayi kemasan", "Lainnya",
  // M - MAKANAN MINUMAN JADI
  "Makanan_Minuman_Jadi",
  // N - ROKOK
  "Rokok_Tembakau"
];

// Non-food monthly items
const NONFOOD_MONTHLY_A = [
  "Rumah milik sendiri", "Bebas Sewa", "Sewa/Kontrak", "Dinas atau lainnya", "Listrik",
  "Air (PAM/pikulan/beli)", "Generator (BBM, Minyak Tanah)",
  "Bensin (pertalite, pertamax, shell, total, dsb.) Kendaraan Bermotor",
  "Solar Kendaraan Bermotor", "Minyak tanah", "L P G (gas tabung)", "Gas kota",
  "Arang/batu bara/briket", "Biogas", "Kayu bakar dan bahan bakar lainnya",
  "Rekening telepon rumah", "Pulsa HP", "Biaya internet, warnet"
];

const NONFOOD_MONTHLY_B = [
  "Sabun mandi, pasta gigi, sikat gigi, dan sampo",
  "Perawatan kulit, muka, kuku, rambut (ongkos pangkas rambut, kriting, rebounding, cream bath, lulur/spa, dsb.)",
  "Sabun cuci (batangan, bubuk, krim, dan cair)",
  "Bahan pemeliharaan pakaian (pelembut dan pengharum, pemutih, pelicin, dsb.)",
  "Surat kabar, majalah, buku-buku, dan alat-alat tulis (di luar keperluan sekolah dan kursus) termasuk sewa majalah/bacaan",
  "Barang lainnya (tisue, pampers, kantong plastik, tali/tambang plastik, tusuk gigi, cotton bud, kapur barus, tusuk sate, masker sekali pakai, dsb.)",
  "Gaji/upah pembantu rumah tangga, satpam, tukang kebun, dan sopir"
];

// Non-food yearly items
const NONFOOD_YEARLY_A = [
  "Pemeliharaan rumah dan perbaikan ringan (cat kayu, kapur, cat tembok, genteng, kaca jendela, engsel, dsb.)",
  "Minyak pelumas (Generator)", "Pemeliharaan dan perbaikan generator",
  "Minyak pelumas (kendaraan bermotor)", "Perbaikan dan pemeliharaan kendaraan bermotor",
  "Pengeluaran kebutuhan lainnya untuk rumah (cairan pembersih lantai, pewangi ruangan, bola lampu, keran, shower, sekring listrik, obat nyamuk, korek api, batu baterai, aki, dsb.)",
  "Benda pos (wesel, materai, perangko, dsb.)", "Lainnya (nomor perdana, kirim paket, dsb.)"
];

const NONFOOD_YEARLY_B = [
  "Barang kecantikan (minyak wangi, minyak rambut, deodoran, bedak, kawat gigi, lensa kontak, gunting kuku, rambut palsu/wig, lipstik, sisir, dsb.), dan pembalut wanita",
  "Rumah sakit pemerintah", "Rumah sakit swasta", "Puskesmas/pustu/polindes/posyandu",
  "Praktik dokter/poliklinik", "Praktik petugas kesehatan (bidan/perawat/mantri kesehatan)",
  "Praktik pengobatan tradisional", "Dukun penolong persalinan",
  "Obat yang dibeli dengan resep dari tenaga kesehatan (dokter, bidan, perawat)",
  "Obat modern yang dibeli tanpa resep dari tenaga kesehatan",
  "Obat tradisional/jamu untuk pengobatan", "Periksa kehamilan", "Imunisasi",
  "Tes kesehatan/deteksi dini/Medical Check Up", "Keluarga Berencana",
  "Biaya pemeliharaan kesehatan lainnya (urut, fitness, bekam, detox, yoga, futsal, senam kebugaran, vitamin, jamu untuk menjaga kesehatan, handsanitizer, dsb.)",
  "Sumbangan pembangunan sekolah (uang pangkal)",
  "Uang sekolah (SPP/UKT) dan iuran komite sekolah/POMG",
  "Iuran sekolah lainnya (keterampilan, les, tes, dsb.)",
  "Buku pelajaran, foto copy bahan pelajaran",
  "Alat-alat tulis (pulpen, pensil, penghapus, penggaris, kalkulator, jangka, dsb.)",
  "Uang kursus/bimbingan belajar di luar sekolah",
  "Transportasi darat (biaya naik becak, ojek, taksi, mikrolet, minibus, bus, kereta api, sewa mobil, dsb.)",
  "Transportasi udara/pesawat (tiket, airport tax, dsb.)",
  "Transportasi laut/kapal feri, kapal laut", "Lainnya (uang parkir, karcis tol, dsb.)",
  "Hotel/motel/penginapan",
  "Hiburan (menonton di bioskop, menonton sandiwara/pertunjukkan, menonton pertandingan olah raga, dekoder, langganan TV kabel, dan rekreasi lain (tidak termasuk transpor dan pembelian barang untuk rekreasi))",
  "Jasa lembaga keuangan (jasa ATM, jasa kartu kredit, biaya transfer, dsb.)",
  "Jasa lainnya (pembuatan KTP, SIM, akta kelahiran, fotokopi, foto, jasa penitipan bayi, dsb.)"
];

const NONFOOD_YEARLY_C = [
  "Pakaian jadi untuk laki-laki dewasa (jas, seragam, kemeja, jaket, sarung, celana, kaus oblong, pakaian dalam, dsb.)",
  "Pakaian jadi untuk perempuan dewasa (seragam, gaun, kain panjang, blus, blazer/jas wanita, daster, baju hangat, rok, sarung, selendang, angkin, pakaian dalam, dsb.)",
  "Pakaian jadi untuk anak-anak (seragam, baju, celana, kaus, pakaian dalam, popok bayi, dsb.)",
  "Bahan pakaian untuk laki-laki, perempuan, dan anak anak (wool, poliester, katun, sutra, dsb.)",
  "Upah menjahit, memperbaiki pakaian, benang jahit, dan barang lain untuk keperluan menjahit",
  "Alas kaki (sepatu, sandal, kaus kaki, dsb.)",
  "Tutup kepala untuk laki-laki, perempuan, dan anak-anak (topi, kopiah, kerudung, dsb.)",
  "Lainnya (handuk, ikat pinggang, semir sepatu, dasi, binatu/ laundry, gantungan pakaian/hanger, mukena, jas hujan, masker kain, dsb.)"
];

const NONFOOD_YEARLY_D = [
  "Meubelair (meja, kursi, tempat tidur, lemari pakaian, lemari pajang, rak pajang, kaca/cermin, rak sepatu, dsb.)",
  "Peralatan rumah tangga (mesin jahit, lemari es, kipas angin, mesin cuci, AC, dsb.)",
  "Perlengkapan perabot rumah tangga (kasur, bantal, taplak, seprai, sarung bantal, selimut, gorden, sajadah, karpet, permadani, tikar, dsb.)",
  "Perkakas rumah tangga (setrika, sapu, gunting, pisau, golok, cangkul, gergaji, vacum cleaner, gantungan baju, jemuran, alat solder, dsb.)",
  "Alat-alat dapur/makan (rak piring, kompor, periuk, panci, ember, pisau dapur, penggorengan, sendok, termos, piring, gelas, mixer, rice cooker, blender, microwave, oven, dan pecah belah lainnya yang terbuat dari gelas/keramik/melamin/plastik, dsb.)",
  "Barang-barang pajangan/hiasan (hiasan dinding, aquarium, barang hiasan terbuat dari keramik, porselen, onyx, marmer, kayu, dsb.)",
  "Perbaikan perabot, perlengkapan, dan perkakas rumah tangga",
  "Pembelian HP/smartphone dan aksesorinya, termasuk perbaikannya",
  "Pembelian kamera, kacamata, video camera, alat-alat optik lainnya, termasuk perbaikannya",
  "Pembelian arloji, jam, payung, tas, koper, termasuk perbaikannya",
  "Perhiasan mahal terbuat dari logam dan batu mulia (emas, berlian, mutiara, dsb.), termasuk perbaikannya",
  "Pembelian mainan anak (sepeda roda tiga), perhiasan murah, dan imitasi, termasuk perbaikannya",
  "Pembelian televisi, radio, video, DVD, kaset, radio kaset, gitar, piano/organ, komputer, laptop, tablet, termasuk perbaikannya",
  "Pembelian alat dan perlengkapan olahraga (catur, raket, bola, net, bet, stik, baju renang, baju senam, sepatu bola/roda, kacamata renang), termasuk perbaikannya",
  "Pembelian kendaraan untuk transportasi (mobil, sepeda motor, sepeda, perahu motor, dsb.)",
  "Binatang dan tanaman peliharaan, termasuk biaya pemeliharaannya (makanan, kandang, kesehatan, pupuk, dll.)",
  "Barang tahan lama lainnya (instalasi listrik/telepon/leding, ayunan, kereta bayi, dsb.), termasuk perbaikannya"
];

const NONFOOD_YEARLY_E = [
  "Pajak bumi dan bangunan (PBB)", "Pajak kendaraan bermotor (STNK) dan tak bermotor",
  "Pungutan/retribusi (iuran RT/RW, sampah, keamanan, kuburan, dsb.)",
  "Asuransi kesehatan",
  "Asuransi jiwa lainnya dan asuransi kerugian (asuransi kematian, kecelakaan, mobil, rumah, dsb.)",
  "Lainnya (tilang, PPh, dsb.)"
];

const NONFOOD_YEARLY_F = [
  "Perkawinan (sewa alat seperti peralatan pengantin, kursi, tenda, piring, jasa seperti ongkos perias pengantin, penghulu, jasa penyelenggaraan, serta sewa gedung, dsb.)",
  "Khitanan dan ulang tahun (ongkos bengkong, biaya dokter/mantri/dukun sunat, pembungkus makanan, pita/kertas penghias ruangan/balon, sewa kursi, sewa gedung, sewa hiburan)",
  "Perayaan hari raya agama (sewa kursi, sewa tenda, dsb.)",
  "Biaya Penyelenggaraan Ibadah Haji (BPIH), umrah, perjalanan rohani",
  "Upacara agama atau adat lainnya (memanggil Ustaz, Pendeta, sesajen, dsb.)",
  "Biaya pemakaman (ongkos memandikan jenazah, kain kafan, jasa penggali kubur, peti mati, biaya krematorium, biaya ngaben, dsb.)"
];

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

function flattenSurveyData(data: any, username: string): string[] {
  const values: string[] = [];
  const timestamp = new Date().toISOString();
  
  // Column 1: Timestamp
  values.push(timestamp);
  
  // Column 2: Username (logged in user)
  values.push(username || '');
  
  // Identity data (columns 3-9)
  values.push(data.namaPendata || '');
  values.push(data.kecamatan || '');
  values.push(data.desa || '');
  values.push(data.alamat || '');
  values.push(data.namaKepalaRumahTangga || '');
  values.push(String(data.jumlahAnggotaRumahTangga || 0));
  values.push((data.namaAnggotaRumahTangga || []).join(', '));
  
  // Food items - each item gets 4 columns: pembelian, produksiSendiri, jenisPembelian, jenisProduksiSendiri
  for (const item of FOOD_ITEMS) {
    const expense = data.makananMinuman?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food monthly A - each item gets 4 columns
  for (const item of NONFOOD_MONTHLY_A) {
    const expense = data.komoditiASebulan?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food monthly B
  for (const item of NONFOOD_MONTHLY_B) {
    const expense = data.komoditiBSebulan?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly A
  for (const item of NONFOOD_YEARLY_A) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly B
  for (const item of NONFOOD_YEARLY_B) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly C
  for (const item of NONFOOD_YEARLY_C) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly D
  for (const item of NONFOOD_YEARLY_D) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly E
  for (const item of NONFOOD_YEARLY_E) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Non-food yearly F
  for (const item of NONFOOD_YEARLY_F) {
    const expense = data.komoditiSetahun?.[item] || {};
    values.push(String(expense.pembelian || 0));
    values.push(String(expense.produksiSendiri || 0));
    values.push(expense.jenisPembelian || '');
    values.push(expense.jenisProduksiSendiri || '');
  }
  
  // Income - Upah Gaji (max 10 entries)
  const upahEntries = data.pendapatanUpah || [];
  for (let i = 0; i < 10; i++) {
    const u = upahEntries[i] || {};
    values.push(u.uraianPekerjaan || '');
    values.push(u.kategoriLU || '');
    values.push(u.jenisPekerjaan || '');
    values.push(String(u.upahUang || 0));
    values.push(String(u.upahBarang || 0));
    values.push(String(u.lembur || 0));
    values.push(String(u.imputasiUpahGajiBarang || 0));
  }
  
  // Income - Usaha (max 10 entries)
  const usahaEntries = data.pendapatanUsaha || [];
  for (let i = 0; i < 10; i++) {
    const u = usahaEntries[i] || {};
    values.push(u.uraianKegiatan || '');
    values.push(u.kategoriLU || '');
    values.push(u.jenisPekerjaan || '');
    values.push(String(u.nilaiProduksi || 0));
    values.push(String(u.biayaProduksi || 0));
    values.push(String(u.surplus || 0));
    values.push(String(u.imputasiNilaiProduksi || 0));
  }
  
  // Produksi Sendiri
  const ps = data.produksiSendiri || {};
  values.push(String(ps.perkiraanSewaRumah?.nilaiProduksi || 0));
  values.push(String(ps.perkiraanSewaRumah?.biayaProduksi || 0));
  values.push(String(ps.perkiraanSewaRumah?.surplus || 0));
  values.push(String(ps.perkiraanSewaRumah?.imputasiNilaiProduksi || 0));
  values.push(String(ps.hasilPertanian?.nilaiProduksi || 0));
  values.push(String(ps.hasilPertanian?.biayaProduksi || 0));
  values.push(String(ps.hasilPertanian?.surplus || 0));
  values.push(String(ps.hasilPertanian?.imputasiNilaiProduksi || 0));
  
  // Pendapatan Kepemilikan
  const pk = data.pendapatanKepemilikan || {};
  for (const key of ['sewaLahan', 'bagi_hasil', 'deviden', 'bunga']) {
    values.push(String(pk[key]?.diterima || 0));
    values.push(String(pk[key]?.dibayar || 0));
  }
  
  // Transfer Berjalan
  const tb = data.transferBerjalan || {};
  for (const key of ['pemerintah', 'pemerintahUangPensiun', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri']) {
    const item = tb[key] || {};
    values.push(String(item.diterimaUang || 0));
    values.push(String(item.diterimaBarang || 0));
    values.push(String(item.dibayarUang || 0));
    values.push(String(item.dibayarBarang || 0));
    values.push(String(item.imputasiTransferDiterimaUang || 0));
    values.push(String(item.imputasiTransferDiterimaBarang || 0));
  }
  
  // Transfer Modal
  const tm = data.transferModal || {};
  for (const entity of ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri']) {
    const entityData = tm[entity] || {};
    for (const direction of ['diterima', 'dibayar']) {
      const dirData = entityData[direction] || {};
      for (const asset of ['bangunanTinggal', 'bangunanBukan', 'alatProduksi', 'tanamanHewan', 'kendaraan', 'lahan']) {
        values.push(String(dirData[asset] || 0));
      }
    }
  }
  
  // Aset Perubahan
  const ap = data.asetPerubahan || {};
  // Aset Tetap Usaha
  for (const asset of ['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan', 'lainnya']) {
    const item = ap.asetTetapUsaha?.[asset] || {};
    values.push(String(item.pembelian || 0));
    values.push(String(item.pemberian || 0));
    values.push(String(item.pembuatanSendiri || 0));
    values.push(String(item.penjualan || 0));
    values.push(String(item.pemberianKepada || 0));
    values.push(String(item.netto || 0));
    values.push(String(item.imputasiPenamabahanPemberian || 0));
    values.push(String(item.imputasiPenguranganPemberianKepada || 0));
  }
  
  // Other assets
  for (const asset of ['bangunanTinggal', 'biayaPemindahan', 'lahanBarang']) {
    const item = ap[asset] || {};
    values.push(String(item.pembelian || 0));
    values.push(String(item.pemberian || 0));
    values.push(String(item.pembuatanSendiri || 0));
    values.push(String(item.penjualan || 0));
    values.push(String(item.pemberianKepada || 0));
    values.push(String(item.netto || 0));
    values.push(String(item.imputasiPenamabahanPemberian || 0));
    values.push(String(item.imputasiPenguranganPemberianKepada || 0));
  }
  
  // Transaksi Keuangan
  const tk = data.transaksiKeuangan || {};
  values.push(String(tk.pengambilanUangTunai || 0));
  values.push(String(tk.meminjamUang || 0));
  values.push(String(tk.menerimaPembayaranKredit || 0));
  values.push(String(tk.kreditBarang || 0));
  values.push(String(tk.lainnyaPenerimaan || 0));
  values.push(String(tk.menyimpanUangTunai || 0));
  values.push(String(tk.membayarHutang || 0));
  values.push(String(tk.memberikanKreditBarang || 0));
  values.push(String(tk.membayarKreditBarang || 0));
  values.push(String(tk.lainnyaPengeluaran || 0));
  values.push(String(tk.imputasiPenerimaanPengambilanUangTunai || 0));
  values.push(String(tk.imputasiPenerimaanMeminjamUang || 0));
  values.push(String(tk.imputasiPenerimaanKreditBarang || 0));
  values.push(String(tk.imputasiPenerimaanLainnya || 0));
  values.push(String(tk.imputasiPengeluaranMenyimpanUangTunai || 0));
  values.push(String(tk.imputasiPengeluaranLainnya || 0));
  
  return values;
}

async function findExistingRow(accessToken: string, spreadsheetId: string, username: string, namaKepala: string): Promise<number | null> {
  // Get columns B and G (username and namaKepalaRumahTangga)
  const range = encodeURIComponent('RAW!B:G');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  console.log('Searching for existing row...');
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!response.ok) {
    console.log('Failed to fetch existing data');
    return null;
  }
  
  const data = await response.json();
  const rows = data.values || [];
  
  // Find row where column B (username) and column G (namaKepalaRumahTangga) match
  // Column B is index 0, Column G is index 5 in our subset
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowUsername = row[0] || ''; // Column B (username)
    const rowNamaKepala = row[5] || ''; // Column G (namaKepalaRumahTangga)
    
    if (rowUsername === username && rowNamaKepala === namaKepala) {
      console.log(`Found existing row at index ${i + 1} for user ${username} and household ${namaKepala}`);
      return i + 1; // 1-indexed row number
    }
  }
  
  console.log('No existing row found');
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData, username } = await req.json();
    
    if (!surveyData) {
      throw new Error('Survey data is required');
    }

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const rawSpreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

    if (!serviceAccountJson || !rawSpreadsheetId) {
      throw new Error('Google credentials or spreadsheet ID not configured');
    }

    const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(serviceAccount);
    
    console.log('Preparing data for sheets...');
    const rowValues = flattenSurveyData(surveyData, username || '');
    
    console.log(`Prepared ${rowValues.length} values`);
    
    const namaKepala = surveyData.namaKepalaRumahTangga || '';
    const loggedUsername = username || '';
    
    // Check if row already exists for this user + household
    const existingRowIndex = await findExistingRow(accessToken, spreadsheetId, loggedUsername, namaKepala);
    
    let result;
    
    if (existingRowIndex !== null) {
      // Update existing row
      console.log(`Updating existing row ${existingRowIndex}...`);
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/RAW!A${existingRowIndex}?valueInputOption=RAW`;
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Sheets API update error:', errorText);
        throw new Error(`Failed to update data in sheet: ${errorText}`);
      }

      result = await updateResponse.json();
      console.log('Data updated successfully:', result);
    } else {
      // Append new row
      console.log('Appending new row...');
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
        console.error('Sheets API append error:', errorText);
        throw new Error(`Failed to append data to sheet: ${errorText}`);
      }

      result = await appendResponse.json();
      console.log('Data appended successfully:', result);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingRowIndex ? 'Data berhasil diperbarui di Google Sheets' : 'Data berhasil disimpan ke Google Sheets',
        updated: existingRowIndex !== null
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
