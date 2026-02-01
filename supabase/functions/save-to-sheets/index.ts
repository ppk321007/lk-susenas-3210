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

// Food categories with keys
const FOOD_CATEGORIES: Record<string, { title: string; items: string[] }> = {
  A: {
    title: "PADI-PADIAN",
    items: ["Beras (beras lokal, medium, premium, impor)", "Beras Ketan", "Jagung basah dengan kulit", "Jagung pipilan/beras jagung/jagung titi", "Tepung terigu", "Padi-padian Lainnya"]
  },
  B: {
    title: "UMBI-UMBIAN",
    items: ["Ketela pohon/singkong", "Ketela rambat/ubi Jalar", "Sagu (bukan dari ketela pohon)", "Talas/keladi", "Kentang", "Gaplek", "Umbi-umbi Lainnya"]
  },
  C: {
    title: "IKAN/UDANG/CUMI/KERANG",
    items: ["Ekor kuning", "Tongkol", "Tuna", "cakalang,dencis", "Tenggiri", "Selar", "Kembung, lema/tatare,banyar/banyara", "Teri basah", "Bandeng", "Gabus", "Mujair", "Mas", "Nila", "Lele", "Kakap", "Baronang", "Patin", "Bawal", "Gurame", "Ikan layang", "Ikan baung", "Ikan belanak", "Ikan wader/seluang", "Belut", "Ikan segar/ basah lainnya…", "Olahan ikan segar (siomay ikan, otak-otak ikan, dll.)", "Udang, lobster", "Cumi-cumi,sotong,gurita", "Ketam,kepiting,rajungan", "Kerang,siput,bekicot,remis", "Udang dan hewan air segar lainnya", "Kembung Diawetkan/Peda", "Tenggiri Diawetkan", "Tongkol/Tuna/Cakalang, dencis, ikan kayu diawetkan", "Teri diawetkan", "Selar diawetkan", "Sepat diawetkan", "Bandeng diawetkan", "Gabus diawetkan", "Ikan dalam kaleng (sardencis,tuna dll)", "Ikan diawetkan lainnya", "Udang diawetkan (ebi, rebon)", "Cumi-cumi,sotong,gurita diawetkan", "Udang dan Hewan Air Lainnya yang diawetkan"]
  },
  D: {
    title: "DAGING",
    items: ["Daging sapi", "Daging kerbau", "Daging Kambing,domba,biri-biri", "Daging Babi", "Daging ayam ras", "Daging ayam kampung", "Daging Segar Lainnya", "Daging sapi diawetkan/olahan daging sapi (sosis sapi, abon sapi, bakso sapi,dll)", "Daging ayam diawetkan/olahan daging sapi (sosis ayam, abon ayam, bakso ayam,dll)", "Daging lainnya diawetkan", "Tetelan, sandung lamur", "Lainnya (hati, jeroan, iga, kaki, buntut, kepala, dsb)"]
  },
  E: {
    title: "TELUR DAN SUSU",
    items: ["Telur ayam ras", "Telur ayam kampung", "Telur itik/itik manila", "Telur lainnya (telur puyuh, telur asin, telur penyu, telur angsa dsb)", "Susu cair pabrik", "Susu kental manis", "Susu bubuk", "Susu bubuk bayi", "Susu murni", "Hasil lain dari susu (keju, yoghurt,dsb)"]
  },
  F: {
    title: "SAYUR-SAYURAN",
    items: ["Bayam", "Kangkung", "Kol/Kubis", "Sawi Putih (petsai)", "Sawi hijau", "Buncis", "Kacang Panjang", "Tomat sayur,tomat ceri", "Wortel", "Mentimun", "Daun ketela pohon/daun singkong", "Terong", "Tauge", "Labu,labu siam,labu parang", "Bahan sayur sop/capcay /kimlo (paket)", "Bahan sayur asem/lodeh (paket)", "Nangka muda", "pepaya muda", "Jengkol", "Bawang merah", "Bawang putih", "Bawang Bombay", "Cabe Merah", "Cabe hijau", "Cabe rawit", "Daun pepaya", "Daun kelor", "Daun katuk", "Daun bawang", "Duan pakis", "Daun kemanggi", "Oyang/Gambas", "Rebung", "Jamur (jamur tiram, enoki, dll)", "Sayur-sayuran Lainnya"]
  },
  G: {
    title: "KACANG-KACANGAN",
    items: ["Kacang tanah tanpa kulit", "Kacang kedelai", "Kacang lainnya", "Tahu", "Tempe", "Oncom", "Hasil lain dari kacang-kacangan"]
  },
  H: {
    title: "BUAH-BUAHAN",
    items: ["Jeruk, jeruk bali", "Mangga", "Apel", "Rambutan", "Duku, langsat", "Durian", "Salak", "Pisang ambon", "Pisang lainnya", "Pepaya", "Semangka", "Tomat buah", "Alpukat", "Jambu Biji", "Nanas", "Nangka muda", "Pir", "Anggur", "Buah Naga", "Jambu Air", "Melon", "Manggis", "Kelengkeng", "Buah-buahan lainnya"]
  },
  I: {
    title: "MINYAK DAN KELAPA",
    items: ["Minyak Kelapa", "Minyak goreng (kelapa sawit, bunga matahari)", "Kelapa (tidak termasuk santan instan)", "Minyak dan kelapa lainnya"]
  },
  J: {
    title: "BAHAN MINUMAN",
    items: ["Gula pasir", "Gula merah, gula air (pohon aren, kelapa, lontar)", "Teh bubuk", "Teh celup (sachet)", "Kopi (bubuk, biji)", "Kopi instant (sachet)", "Bahan Minuman Lainnya"]
  },
  K: {
    title: "BUMBU-BUMBUAN",
    items: ["Garam", "Kemiri", "Ketumbar/jinten", "Merica/lada", "Jahe", "Kunyit", "Asam", "Terasi/petis", "Kecap", "Penyedap masakan/vetsin", "Sambal jadi", "Saus tomat", "Bumbu masak jadi/kemasan, bumbu racik", "Bumbu Lainnya (kencur, pala, kapulaga, dsb.)"]
  },
  L: {
    title: "BAHAN MAKANAN LAINNYA",
    items: ["Mie instan", "Kerupuk", "Bubur bayi kemasan", "Lainnya"]
  },
  M: {
    title: "MAKANAN DAN MINUMAN JADI",
    items: []
  },
  N: {
    title: "ROKOK DAN TEMBAKAU",
    items: []
  }
};

// Non-food detail categories
const NON_FOOD_DETAIL_CATEGORIES: Record<string, { title: string; monthlyItems: string[]; yearlyItems: string[] }> = {
  A: {
    title: "PERUMAHAN DAN FASILITAS RUMAH TANGGA",
    monthlyItems: ["Rumah milik sendiri", "Bebas Sewa", "Sewa/Kontrak", "Dinas atau lainnya", "Listrik", "Air (PAM/pikulan/beli)", "Generator (BBM, Minyak Tanah)", "Bensin (pertalite, pertamax, shell, total, dsb.) Kendaraan Bermotor", "Solar Kendaraan Bermotor", "Minyak tanah", "L P G (gas tabung)", "Gas kota", "Arang/batu bara/briket", "Biogas", "Kayu bakar dan bahan bakar lainnya", "Rekening telepon rumah", "Pulsa HP", "Biaya internet, warnet"],
    yearlyItems: ["Pemeliharaan rumah dan perbaikan ringan (cat kayu, kapur, cat tembok, genteng, kaca jendela, engsel, dsb.)", "Minyak pelumas (Generator)", "Pemeliharaan dan perbaikan generator", "Minyak pelumas (kendaraan bermotor)", "Perbaikan dan pemeliharaan kendaraan bermotor", "Pengeluaran kebutuhan lainnya untuk rumah (cairan pembersih lantai, pewangi ruangan, bola lampu, keran, shower, sekring listrik, obat nyamuk, korek api, batu baterai, aki, dsb.)", "Benda pos (wesel, materai, perangko, dsb.)", "Lainnya (nomor perdana, kirim paket, dsb.)"]
  },
  B: {
    title: "ANEKA BARANG DAN JASA",
    monthlyItems: ["Sabun mandi, pasta gigi, sikat gigi, dan sampo", "Perawatan kulit, muka, kuku, rambut (ongkos pangkas rambut, kriting, rebounding, cream bath, lulur/spa, dsb.)", "Sabun cuci (batangan, bubuk, krim, dan cair)", "Bahan pemeliharaan pakaian (pelembut dan pengharum, pemutih, pelicin, dsb.)", "Surat kabar, majalah, buku-buku, dan alat-alat tulis (di luar keperluan sekolah dan kursus) termasuk sewa majalah/bacaan", "Barang lainnya (tisue, pampers, kantong plastik, tali/tambang plastik, tusuk gigi, cotton bud, kapur barus, tusuk sate, masker sekali pakai, dsb.)", "Gaji/upah pembantu rumah tangga, satpam, tukang kebun, dan sopir"],
    yearlyItems: ["Barang kecantikan (minyak wangi, minyak rambut, deodoran, bedak, kawat gigi, lensa kontak, gunting kuku, rambut palsu/wig, lipstik, sisir, dsb.), dan pembalut wanita", "Rumah sakit pemerintah", "Rumah sakit swasta", "Puskesmas/pustu/polindes/posyandu", "Praktik dokter/poliklinik", "Praktik petugas kesehatan (bidan/perawat/mantri kesehatan)", "Praktik pengobatan tradisional", "Dukun penolong persalinan", "Obat yang dibeli dengan resep dari tenaga kesehatan (dokter, bidan, perawat)", "Obat modern yang dibeli tanpa resep dari tenaga kesehatan", "Obat tradisional/jamu untuk pengobatan", "Biaya pembelian kacamata, kaki/tangan palsu (protese) dan kursi roda", "Periksa kehamilan", "Imunisasi", "Tes kesehatan/deteksi dini/Medical Check Up", "Keluarga Berencana", "Biaya pemeliharaan kesehatan lainnya (urut, fitness, bekam, detox, yoga, futsal, senam kebugaran, vitamin, jamu untuk menjaga kesehatan, handsanitizer, dsb.)", "Sumbangan pembangunan sekolah (uang pangkal)", "Uang sekolah (SPP/UKT) dan iuran komite sekolah/POMG", "Iuran sekolah lainnya (keterampilan, les, tes, dsb.)", "Buku pelajaran, foto copy bahan pelajaran", "Alat-alat tulis (pulpen, pensil, penghapus, penggaris, kalkulator, jangka, dsb.)", "Uang kursus/bimbingan belajar di luar sekolah", "Transportasi darat (biaya naik becak, ojek, taksi, mikrolet, minibus, bus, kereta api, sewa mobil, dsb.)", "Transportasi udara/pesawat (tiket, airport tax, dsb.)", "Transportasi laut/kapal feri, kapal laut", "Lainnya (uang parkir, karcis tol, dsb.)", "Hotel/motel/penginapan", "Hiburan (menonton di bioskop, menonton sandiwara/pertunjukkan, menonton pertandingan olah raga, dekoder, langganan TV kabel, dan rekreasi lain (tidak termasuk transpor dan pembelian barang untuk rekreasi))", "Jasa lembaga keuangan (jasa ATM, jasa kartu kredit, biaya transfer, dsb.)", "Jasa lainnya (pembuatan KTP, SIM, akta kelahiran, fotokopi, foto, jasa penitipan bayi, dsb.)"]
  },
  C: {
    title: "PAKAIAN, ALAS KAKI, DAN TUTUP KEPALA",
    monthlyItems: [],
    yearlyItems: ["Pakaian jadi untuk laki-laki dewasa (jas, seragam, kemeja, jaket, sarung, celana, kaus oblong, pakaian dalam, dsb.)", "Pakaian jadi untuk perempuan dewasa (seragam, gaun, kain panjang, blus, blazer/jas wanita, daster, baju hangat, rok, sarung, selendang, angkin, pakaian dalam, dsb.)", "Pakaian jadi untuk anak-anak (seragam, baju, celana, kaus, pakaian dalam, popok bayi, dsb.)", "Bahan pakaian untuk laki-laki, perempuan, dan anak anak (wool, poliester, katun, sutra, dsb.)", "Upah menjahit, memperbaiki pakaian, benang jahit, dan barang lain untuk keperluan menjahit", "Alas kaki (sepatu, sandal, kaus kaki, dsb.)", "Tutup kepala untuk laki-laki, perempuan, dan anak-anak (topi, kopiah, kerudung, dsb.)", "Lainnya (handuk, ikat pinggang, semir sepatu, dasi, binatu/ laundry, gantungan pakaian/hanger, mukena, jas hujan, masker kain, dsb.)"]
  },
  D: {
    title: "BARANG TAHAN LAMA",
    monthlyItems: [],
    yearlyItems: ["Meubelair (meja, kursi, tempat tidur, lemari pakaian, lemari pajang, rak pajang, kaca/cermin, rak sepatu, dsb.)", "Peralatan rumah tangga (mesin jahit, lemari es, kipas angin, mesin cuci, AC, dsb.)", "Perlengkapan perabot rumah tangga (kasur, bantal, taplak, seprai, sarung bantal, selimut, gorden, sajadah, karpet, permadani, tikar, dsb.)", "Perkakas rumah tangga (setrika, sapu, gunting, pisau, golok, cangkul, gergaji, vacum cleaner, gantungan baju, jemuran, alat solder, dsb.)", "Alat-alat dapur/makan (rak piring, kompor, periuk, panci, ember, pisau dapur, penggorengan, sendok, termos, piring, gelas, mixer, rice cooker, blender, microwave, oven, dan pecah belah lainnya yang terbuat dari gelas/keramik/melamin/plastik, dsb.)", "Barang-barang pajangan/hiasan (hiasan dinding, aquarium, barang hiasan terbuat dari keramik, porselen, onyx, marmer, kayu, dsb.)", "Perbaikan perabot, perlengkapan, dan perkakas rumah tangga", "Pembelian HP/smartphone dan aksesorinya, termasuk perbaikannya", "Pembelian kamera, kacamata, video camera, alat-alat optik lainnya, termasuk perbaikannya", "Pembelian arloji, jam, payung, tas, koper, termasuk perbaikannya", "Perhiasan mahal terbuat dari logam dan batu mulia (emas, berlian, mutiara, dsb.), termasuk perbaikannya", "Pembelian mainan anak (sepeda roda tiga), perhiasan murah, dan imitasi, termasuk perbaikannya", "Pembelian televisi, radio, video, DVD, kaset, radio kaset, gitar, piano/organ, komputer, laptop, tablet, termasuk perbaikannya", "Pembelian alat dan perlengkapan olahraga (catur, raket, bola, net, bet, stik, baju renang, baju senam, sepatu bola/roda, kacamata renang), termasuk perbaikannya", "Pembelian kendaraan untuk transportasi (mobil, sepeda motor, sepeda, perahu motor, dsb.)", "Binatang dan tanaman peliharaan, termasuk biaya pemeliharaannya (makanan, kandang, kesehatan, pupuk, dll.)", "Barang tahan lama lainnya (instalasi listrik/telepon/leding, ayunan, kereta bayi, dsb.), termasuk perbaikannya"]
  },
  E: {
    title: "PAJAK, PUNGUTAN, DAN ASURANSI",
    monthlyItems: [],
    yearlyItems: ["Pajak bumi dan bangunan (PBB)", "Pajak kendaraan bermotor (STNK) dan tak bermotor", "Pungutan/retribusi (iuran RT/RW, sampah, keamanan, kuburan, dsb.)", "Asuransi kesehatan", "Asuransi jiwa lainnya dan asuransi kerugian (asuransi kematian, kecelakaan, mobil, rumah, dsb.)", "Lainnya (tilang, PPh, dsb.)"]
  },
  F: {
    title: "KEPERLUAN PESTA DAN UPACARA/KENDURI",
    monthlyItems: [],
    yearlyItems: ["Perkawinan (sewa alat seperti peralatan pengantin, kursi, tenda, piring, jasa seperti ongkos perias pengantin, penghulu, jasa penyelenggaraan, serta sewa gedung, dsb.)", "Khitanan dan ulang tahun (ongkos bengkong, biaya dokter/mantri/dukun sunat, pembungkus makanan, pita/kertas penghias ruangan/balon, sewa kursi, sewa gedung, sewa hiburan)", "Perayaan hari raya agama (sewa kursi, sewa tenda, dsb.)", "Biaya Penyelenggaraan Ibadah Haji (BPIH), umrah, perjalanan rohani", "Upacara agama atau adat lainnya (memanggil Ustaz, Pendeta, sesajen, dsb.)", "Biaya pemakaman (ongkos memandikan jenazah, kain kafan, jasa penggali kubur, peti mati, biaya krematorium, biaya ngaben, dsb.)"]
  }
};

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

// Format expense entry with entries array support
// Format: ItemName_Value_Category_Detail; ItemName_Value_Category_Detail | ItemName_Value_Category_Detail
// "|" separates different categories (Pembelian vs Pemberian)
// ";" separates different entries within the same category
function formatExpenseEntry(itemName: string, expense: any, categoryKey: string): string {
  // Check if expense has entries array (EnhancedExpenseInput format)
  if (expense.entries && Array.isArray(expense.entries) && expense.entries.length > 0) {
    const pembelianEntries: string[] = [];
    const pemberianEntries: string[] = [];
    
    for (const entry of expense.entries) {
      if (entry.nilai > 0) {
        const detail = entry.jenisDetail || entry.kategori;
        const formatted = `${itemName}_${entry.nilai}_${entry.kategori}_${detail}`;
        
        if (entry.kategori === 'Pembelian') {
          pembelianEntries.push(formatted);
        } else {
          pemberianEntries.push(formatted);
        }
      }
    }
    
    const parts: string[] = [];
    if (pembelianEntries.length > 0) {
      parts.push(pembelianEntries.join('; '));
    }
    if (pemberianEntries.length > 0) {
      parts.push(pemberianEntries.join('; '));
    }
    
    return parts.length > 0 ? parts.join(' | ') : '0';
  }
  
  // Fallback to old format (ExpenseInput format with pembelian/produksiSendiri)
  const pembelianEntries: string[] = [];
  const pemberianEntries: string[] = [];
  
  if (expense.pembelian && expense.pembelian > 0) {
    const detail = expense.jenisPembelian || 'pembelian tunai';
    pembelianEntries.push(`${itemName}_${expense.pembelian}_pembelian_${detail}`);
  }
  
  if (expense.produksiSendiri && expense.produksiSendiri > 0) {
    const detail = expense.jenisProduksiSendiri || 'produksi sendiri';
    pemberianEntries.push(`${itemName}_${expense.produksiSendiri}_produksi sendiri_${detail}`);
  }
  
  const parts: string[] = [];
  if (pembelianEntries.length > 0) {
    parts.push(pembelianEntries.join('; '));
  }
  if (pemberianEntries.length > 0) {
    parts.push(pemberianEntries.join('; '));
  }
  
  return parts.length > 0 ? parts.join(' | ') : '0';
}

// Format Page 5 data
function formatPage5Data(data: any): string[] {
  const values: string[] = [];
  
  // BLOK VA - Pendapatan Upah/Gaji (multiple rows in 1 cell, separated by |)
  const upahEntries = data.pendapatanUpah || [];
  const upahFormatted = upahEntries.map((entry: any, idx: number) => {
    return `${idx + 1}. ${entry.uraianPekerjaan || ''}_${entry.kategoriLU || ''}_${entry.jenisPekerjaan || ''}_UpahUang:${entry.upahUang || 0}_UpahBarang:${entry.upahBarang || 0}_Lembur:${entry.lembur || 0}_ImputasiUpahGajiBarang:${entry.imputasiUpahGajiBarang || 0}`;
  }).join(' | ');
  values.push(upahFormatted || '0');
  
  // BLOK VB - Pendapatan Usaha (multiple rows in 1 cell, separated by |)
  const usahaEntries = data.pendapatanUsaha || [];
  const usahaFormatted = usahaEntries.map((entry: any, idx: number) => {
    return `${idx + 1}. ${entry.uraianKegiatan || ''}_${entry.kategoriLU || ''}_${entry.jenisPekerjaan || ''}_NilaiProduksi:${entry.nilaiProduksi || 0}_BiayaProduksi:${entry.biayaProduksi || 0}_Surplus:${entry.surplus || 0}_ImputasiNilaiProduksi:${entry.imputasiNilaiProduksi || 0}`;
  }).join(' | ');
  values.push(usahaFormatted || '0');
  
  // BLOK VC - Produksi Sendiri (2 fixed rows, separated by |)
  const produksiSendiri = data.produksiSendiri || {};
  const perkiraanSewa = produksiSendiri.perkiraanSewaRumah || { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0, imputasiNilaiProduksi: 0 };
  const hasilPertanian = produksiSendiri.hasilPertanian || { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0, imputasiNilaiProduksi: 0 };
  const produksiFormatted = `PerkiraanSewaRumah_NilaiProduksi:${perkiraanSewa.nilaiProduksi || 0}_BiayaProduksi:${perkiraanSewa.biayaProduksi || 0}_Surplus:${perkiraanSewa.surplus || 0}_ImputasiNilaiProduksi:${perkiraanSewa.imputasiNilaiProduksi || 0} | HasilPertanian_NilaiProduksi:${hasilPertanian.nilaiProduksi || 0}_BiayaProduksi:${hasilPertanian.biayaProduksi || 0}_Surplus:${hasilPertanian.surplus || 0}_ImputasiNilaiProduksi:${hasilPertanian.imputasiNilaiProduksi || 0}`;
  values.push(produksiFormatted);
  
  // BLOK VD - Pendapatan Kepemilikan
  const kepemilikan = data.pendapatanKepemilikan || {};
  const kepemilikanItems = ['sewaLahan', 'bagi_hasil', 'deviden', 'bunga'];
  const kepemilikanFormatted = kepemilikanItems.map(item => {
    const itemData = kepemilikan[item] || { diterima: 0, dibayar: 0 };
    return `${item}_Diterima:${itemData.diterima || 0}_Dibayar:${itemData.dibayar || 0}`;
  }).join(' | ');
  values.push(kepemilikanFormatted);
  
  // BLOK VE - Transfer Berjalan
  const transferBerjalan = data.transferBerjalan || {};
  const transferBerjalanItems = ['pemerintahUangPensiun', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'];
  const transferBerjalanFormatted = transferBerjalanItems.map(item => {
    const itemData = transferBerjalan[item] || { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0, imputasiTransferDiterimaBarang: 0 };
    return `${item}_DiterimaUang:${itemData.diterimaUang || 0}_DiterimaBarang:${itemData.diterimaBarang || 0}_DibayarUang:${itemData.dibayarUang || 0}_DibayarBarang:${itemData.dibayarBarang || 0}_ImputasiDiterimaUang:${itemData.imputasiTransferDiterimaUang || 0}_ImputasiDiterimaBarang:${itemData.imputasiTransferDiterimaBarang || 0}`;
  }).join(' | ');
  values.push(transferBerjalanFormatted);
  
  // BLOK VF - Transfer Modal
  const transferModal = data.transferModal || {};
  const transferModalSources = ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri'];
  const assetTypes = ['bangunanTinggal', 'bangunanBukan', 'alatProduksi', 'tanamanHewan', 'kendaraan', 'lahan'];
  const transferModalFormatted = transferModalSources.map(source => {
    const sourceData = transferModal[source] || { diterima: {}, dibayar: {} };
    const diterima = sourceData.diterima || {};
    const dibayar = sourceData.dibayar || {};
    const assetValues = assetTypes.map(asset => `${asset}_D:${diterima[asset] || 0}_B:${dibayar[asset] || 0}`).join(';');
    return `${source}_(${assetValues})`;
  }).join(' | ');
  values.push(transferModalFormatted);
  
  // BLOK VG - Perubahan Aset
  const asetPerubahan = data.asetPerubahan || {};
  const asetTetapUsaha = asetPerubahan.asetTetapUsaha || {};
  const asetTetapItems = ['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan', 'lainnya'];
  const asetTetapFormatted = asetTetapItems.map(item => {
    const itemData = asetTetapUsaha[item] || { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 };
    return `AsetTetapUsaha_${item}_Pembelian:${itemData.pembelian || 0}_Pemberian:${itemData.pemberian || 0}_PembuatanSendiri:${itemData.pembuatanSendiri || 0}_Penjualan:${itemData.penjualan || 0}_PemberianKepada:${itemData.pemberianKepada || 0}_Netto:${itemData.netto || 0}_ImputasiPemberian:${itemData.imputasiPenamabahanPemberian || 0}_ImputasiPemberianKepada:${itemData.imputasiPenguranganPemberianKepada || 0}`;
  }).join(' | ');
  
  const otherAsetItems = ['bangunanTinggal', 'biayaPemindahan', 'lahanBarang'];
  const otherAsetFormatted = otherAsetItems.map(item => {
    const itemData = asetPerubahan[item] || { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 };
    return `${item}_Pembelian:${itemData.pembelian || 0}_Pemberian:${itemData.pemberian || 0}_PembuatanSendiri:${itemData.pembuatanSendiri || 0}_Penjualan:${itemData.penjualan || 0}_PemberianKepada:${itemData.pemberianKepada || 0}_Netto:${itemData.netto || 0}_ImputasiPemberian:${itemData.imputasiPenamabahanPemberian || 0}_ImputasiPemberianKepada:${itemData.imputasiPenguranganPemberianKepada || 0}`;
  }).join(' | ');
  
  values.push(asetTetapFormatted + ' | ' + otherAsetFormatted);
  
  return values;
}

// Format Page 6 BLOK VII data
function formatPage6Data(data: any): string[] {
  const values: string[] = [];
  const transaksiKeuangan = data.transaksiKeuangan || {};
  
  // Rincian Penerimaan (1 cell, rows separated by |)
  const penerimaanItems = [
    { key: 'pengambilanUangTunai', label: 'Pengambilan Uang Tunai' },
    { key: 'meminjamUang', label: 'Meminjam Uang' },
    { key: 'menerimaPembayaranKredit', label: 'Menerima Pembayaran Kredit' },
    { key: 'kreditBarang', label: 'Kredit Barang' },
    { key: 'lainnyaPenerimaan', label: 'Lainnya Penerimaan' }
  ];
  const penerimaanFormatted = penerimaanItems.map(item => {
    const nilai = transaksiKeuangan[item.key] || 0;
    const imputasiKey = `imputasiPenerimaan${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`;
    const imputasi = transaksiKeuangan[imputasiKey] || 0;
    return `${item.label}_Nilai:${nilai}_Imputasi:${imputasi}`;
  }).join(' | ');
  values.push(penerimaanFormatted);
  
  // Rincian Pengeluaran (1 cell, rows separated by |)
  const pengeluaranItems = [
    { key: 'menyimpanUangTunai', label: 'Menyimpan Uang Tunai' },
    { key: 'membayarHutang', label: 'Membayar Hutang' },
    { key: 'memberikanKreditBarang', label: 'Memberikan Kredit Barang' },
    { key: 'membayarKreditBarang', label: 'Membayar Kredit Barang' },
    { key: 'lainnyaPengeluaran', label: 'Lainnya Pengeluaran' }
  ];
  const pengeluaranFormatted = pengeluaranItems.map(item => {
    const nilai = transaksiKeuangan[item.key] || 0;
    const imputasiKey = `imputasiPengeluaran${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`;
    const imputasi = transaksiKeuangan[imputasiKey] || 0;
    return `${item.label}_Nilai:${nilai}_Imputasi:${imputasi}`;
  }).join(' | ');
  values.push(pengeluaranFormatted);
  
  return values;
}

function flattenSurveyData(data: any, username: string): string[] {
  const values: string[] = [];
  const timestamp = new Date().toISOString();
  
  // Column 1: Timestamp
  values.push(timestamp);
  
  // Column 2: Username (logged in user)
  values.push(username || '');
  
  // Identity data
  values.push(data.namaPendata || '');
  values.push(data.pencacah || '');
  values.push(data.pemeriksa || '');
  values.push(data.nks || '');
  values.push(data.kecamatan || '');
  values.push(data.desa || '');
  values.push(data.sls || '');
  values.push(data.noSampel || '');
  values.push(data.alamat || '');
  values.push(data.namaKepalaRumahTangga || '');
  values.push(String(data.jumlahAnggotaRumahTangga || 0));
  values.push((data.namaAnggotaRumahTangga || []).join(', '));
  
  // PAGE 2: Food items - each commodity in ONE cell
  for (const [categoryKey, category] of Object.entries(FOOD_CATEGORIES)) {
    // For category M and N (per-member, combined into 1 cell)
    if (categoryKey === 'M') {
      // Makanan Minuman Jadi - per-member entries combined with member name
      const memberNames = data.namaAnggotaRumahTangga || [];
      const memberEntries: string[] = [];
      
      for (let i = 0; i < memberNames.length; i++) {
        const memberKey = `M_${i}`;
        const expense = data.makananMinuman?.[memberKey];
        if (expense && (expense.entries?.length > 0 || expense.pembelian > 0 || expense.produksiSendiri > 0)) {
          const memberName = memberNames[i] || `Anggota${i+1}`;
          const formatted = formatExpenseEntry(`ART${i}_${memberName}`, expense, categoryKey);
          if (formatted !== '0') {
            memberEntries.push(formatted);
          }
        }
      }
      values.push(memberEntries.length > 0 ? memberEntries.join(' || ') : '0');
      continue;
    }
    
    if (categoryKey === 'N') {
      // Rokok Tembakau - per-member entries combined with member name
      const memberNames = data.namaAnggotaRumahTangga || [];
      const memberEntries: string[] = [];
      
      for (let i = 0; i < memberNames.length; i++) {
        const memberKey = `N_${i}`;
        const expense = data.makananMinuman?.[memberKey];
        if (expense && (expense.entries?.length > 0 || expense.pembelian > 0 || expense.produksiSendiri > 0)) {
          const memberName = memberNames[i] || `Anggota${i+1}`;
          const formatted = formatExpenseEntry(`ART${i}_${memberName}`, expense, categoryKey);
          if (formatted !== '0') {
            memberEntries.push(formatted);
          }
        }
      }
      values.push(memberEntries.length > 0 ? memberEntries.join(' || ') : '0');
      continue;
    }
    
    // Regular food items
    for (const item of (category as any).items) {
      const itemKey = `${categoryKey}_${item}`;
      const expense = data.makananMinuman?.[itemKey] || { pembelian: 0, produksiSendiri: 0 };
      values.push(formatExpenseEntry(item, expense, categoryKey));
    }
  }
  
  // PAGE 3: Non-food items - each commodity in ONE cell
  for (const [categoryKey, category] of Object.entries(NON_FOOD_DETAIL_CATEGORIES)) {
    // Monthly items
    for (const item of (category as any).monthlyItems) {
      const monthlyData = data[`komoditi${categoryKey}Sebulan`] as Record<string, any> || {};
      const expense = monthlyData[item] || { pembelian: 0, produksiSendiri: 0 };
      values.push(formatExpenseEntry(`${item} (Sebulan)`, expense, `${categoryKey}_Sebulan`));
    }
    
    // Yearly items
    for (const item of (category as any).yearlyItems) {
      const yearlyKey = `${categoryKey}_yearly_${item}`;
      const expense = data.komoditiSetahun?.[yearlyKey] || { pembelian: 0, produksiSendiri: 0 };
      values.push(formatExpenseEntry(`${item} (Setahun)`, expense, `${categoryKey}_Setahun`));
    }
  }
  
  // PAGE 5: Income data
  const page5Values = formatPage5Data(data);
  values.push(...page5Values);
  
  // PAGE 6: BLOK VII Financial transactions
  const page6Values = formatPage6Data(data);
  values.push(...page6Values);
  
  return values;
}

async function findExistingRow(accessToken: string, spreadsheetId: string, sheetName: string, username: string, nks: string, noSampel: string): Promise<number | null> {
  // Get all data from column B (username) to column J (noSampel)
  // Column layout: B=username, C=namaPendata, D=pencacah, E=pemeriksa, F=nks, G=kecamatan, H=desa, I=sls, J=noSampel
  // USE username + nks + noSampel as unique key (NOT namaKepalaRumahTangga)
  const range = `${sheetName}!B:J`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error('Failed to fetch existing data:', await response.text());
    return null;
  }
  
  const result = await response.json();
  const rows = result.values || [];
  
  // Search for matching row (username in col B=index 0, nks in col F=index 4, noSampel in col J=index 8)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowUsername = row[0] || '';
    const rowNks = row[4] || '';
    const rowNoSampel = row[8] || '';
    
    if (rowUsername === username && rowNks === nks && rowNoSampel === noSampel) {
      console.log(`Found existing row at index ${i + 1} for username=${username}, nks=${nks}, noSampel=${noSampel}`);
      return i + 1; // Sheets uses 1-based indexing
    }
  }
  
  console.log(`No existing row found for username=${username}, nks=${nks}, noSampel=${noSampel}`);
  return null;
}

async function updateRow(accessToken: string, spreadsheetId: string, sheetName: string, rowIndex: number, values: string[]): Promise<any> {
  const range = `${sheetName}!A${rowIndex}`;
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update row: ${errorText}`);
  }
  
  return response.json();
}

async function appendRow(accessToken: string, spreadsheetId: string, sheetName: string, values: string[]): Promise<any> {
  const range = `${sheetName}!A1`;
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to append row: ${errorText}`);
  }
  
  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData, username } = await req.json();
    
    console.log('Getting access token...');
    
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const spreadsheetIdRaw = Deno.env.get('GOOGLE_SPREADSHEET_ID');
    
    if (!serviceAccountJson || !spreadsheetIdRaw) {
      throw new Error('Missing required environment variables');
    }
    
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdRaw);
    const sheetName = 'RAW';
    
    const accessToken = await getAccessToken(serviceAccount);
    
    console.log('Preparing data for sheets...');
    const values = flattenSurveyData(surveyData, username);
    console.log(`Prepared ${values.length} values`);
    
    // Check for existing row with same username + nks + noSampel (unique key)
    console.log(`Searching for existing row with username=${username}, nks=${surveyData.nks}, noSampel=${surveyData.noSampel}...`);
    const existingRowIndex = await findExistingRow(
      accessToken, 
      spreadsheetId, 
      sheetName, 
      username, 
      surveyData.nks,
      surveyData.noSampel
    );
    
    let result;
    if (existingRowIndex !== null) {
      console.log(`Found existing row at index ${existingRowIndex}, updating...`);
      result = await updateRow(accessToken, spreadsheetId, sheetName, existingRowIndex, values);
      console.log('Row updated successfully:', result);
    } else {
      console.log('No existing row found');
      console.log('Appending new row...');
      result = await appendRow(accessToken, spreadsheetId, sheetName, values);
      console.log('Data appended successfully:', result);
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error saving to sheets:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Terjadi kesalahan pada server', error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
