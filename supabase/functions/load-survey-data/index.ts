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

// Food categories with keys - MUST MATCH save-to-sheets exactly
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

// Non-food detail categories - MUST MATCH save-to-sheets exactly
const NON_FOOD_DETAIL_CATEGORIES: Record<string, { title: string; monthlyItems: string[]; yearlyItems: string[] }> = {
  A: {
    title: "PERUMAHAN DAN FASILITAS RUMAH TANGGA",
    monthlyItems: ["Rumah milik sendiri", "Bebas Sewa", "Sewa/Kontrak", "Dinas atau lainnya", "Listrik", "Air (PAM/pikulan/beli)", "Generator (BBM, Minyak Tanah)", "Bensin (pertalite, pertamax, shell, total, dsb.) Kendaraan Bermotor", "Solar Kendaraan Bermotor", "Minyak tanah", "L P G (gas tabung)", "Gas kota", "Arang/batu bara/briket", "Biogas", "Kayu bakar dan bahan bakar lainnya", "Rekening telepon rumah", "Pulsa HP", "Biaya internet, warnet"],
    yearlyItems: ["Pemeliharaan rumah dan perbaikan ringan (cat kayu, kapur, cat tembok, genteng, kaca jendela, engsel, dsb.)", "Minyak pelumas (Generator)", "Pemeliharaan dan perbaikan generator", "Minyak pelumas (kendaraan bermotor)", "Perbaikan dan pemeliharaan kendaraan bermotor", "Pengeluaran kebutuhan lainnya untuk rumah (cairan pembersih lantai, pewangi ruangan, bola lampu, keran, shower, sekring listrik, obat nyamuk, korek api, batu baterai, aki, dsb.)", "Benda pos (wesel, materai, perangko, dsb.)", "Lainnya (nomor perdana, kirim paket, dsb.)"]
  },
  B: {
    title: "ANEKA BARANG DAN JASA",
    monthlyItems: ["Sabun mandi, pasta gigi, sikat gigi, dan sampo", "Perawatan kulit, muka, kuku, rambut (ongkos pangkas rambut, kriting, rebounding, cream bath, lulur/spa, dsb.)", "Sabun cuci (batangan, bubuk, krim, dan cair)", "Bahan pemeliharaan pakaian (pelembut dan pengharum, pemutih, pelicin, dsb.)", "Surat kabar, majalah, buku-buku, dan alat-alat tulis (di luar keperluan sekolah dan kursus) termasuk sewa majalah/bacaan", "Barang lainnya (tisue, pampers, kantong plastik, tali/tambang plastik, tusuk gigi, cotton bud, kapur barus, tusuk sate, masker sekali pakai, dsb.)", "Gaji/upah pembantu rumah tangga, satpam, tukang kebun, dan sopir"],
    yearlyItems: ["Barang kecantikan (minyak wangi, minyak rambut, deodoran, bedak, kawat gigi, lensa kontak, gunting kuku, rambut palsu/wig, lipstik, sisir, dsb.), dan pembalut wanita", "Rumah sakit pemerintah", "Rumah sakit swasta", "Puskesmas/pustu/polindes/posyandu", "Praktik dokter/poliklinik", "Praktik petugas kesehatan (bidan/perawat/mantri kesehatan)", "Praktik pengobatan tradisional", "Dukun penolong persalinan", "Obat yang dibeli dengan resep dari tenaga kesehatan (dokter, bidan, perawat)", "Obat modern yang dibeli tanpa resep dari tenaga kesehatan", "Obat tradisional/jamu untuk pengobatan", "Periksa kehamilan", "Imunisasi", "Tes kesehatan/deteksi dini/Medical Check Up", "Keluarga Berencana", "Biaya pemeliharaan kesehatan lainnya (urut, fitness, bekam, detox, yoga, futsal, senam kebugaran, vitamin, jamu untuk menjaga kesehatan, handsanitizer, dsb.)", "Sumbangan pembangunan sekolah (uang pangkal)", "Uang sekolah (SPP/UKT) dan iuran komite sekolah/POMG", "Iuran sekolah lainnya (keterampilan, les, tes, dsb.)", "Buku pelajaran, foto copy bahan pelajaran", "Alat-alat tulis (pulpen, pensil, penghapus, penggaris, kalkulator, jangka, dsb.)", "Uang kursus/bimbingan belajar di luar sekolah", "Transportasi darat (biaya naik becak, ojek, taksi, mikrolet, minibus, bus, kereta api, sewa mobil, dsb.)", "Transportasi udara/pesawat (tiket, airport tax, dsb.)", "Transportasi laut/kapal feri, kapal laut", "Lainnya (uang parkir, karcis tol, dsb.)", "Hotel/motel/penginapan", "Hiburan (menonton di bioskop, menonton sandiwara/pertunjukkan, menonton pertandingan olah raga, dekoder, langganan TV kabel, dan rekreasi lain (tidak termasuk transpor dan pembelian barang untuk rekreasi))", "Jasa lembaga keuangan (jasa ATM, jasa kartu kredit, biaya transfer, dsb.)", "Jasa lainnya (pembuatan KTP, SIM, akta kelahiran, fotokopi, foto, jasa penitipan bayi, dsb.)"]
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

// Parse expense cell format: ItemName_Value_Category_Detail; ItemName_Value_Category_Detail | ItemName_Value_Category_Detail
function parseExpenseCell(cellValue: string): { entries: Array<{ nilai: number; kategori: string; jenisDetail: string }> } {
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
}

// Parse Page 5 data from cells
function parsePage5Data(cells: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Cell 0: Pendapatan Upah
  const upahCell = cells[0] || '';
  if (upahCell && upahCell !== '0') {
    const upahEntries = upahCell.split(' | ').filter(Boolean);
    result.pendapatanUpah = upahEntries.map(entry => {
      const match = entry.match(/^\d+\.\s*(.+?)_(.+?)_(.+?)_UpahUang:(\d+)_UpahBarang:(\d+)_Lembur:(\d+)_ImputasiUpahGajiBarang:(\d+)/);
      if (match) {
        return {
          uraianPekerjaan: match[1] || '',
          kategoriLU: match[2] || '',
          jenisPekerjaan: match[3] || '',
          upahUang: parseInt(match[4]) || 0,
          upahBarang: parseInt(match[5]) || 0,
          lembur: parseInt(match[6]) || 0,
          imputasiUpahGajiBarang: parseInt(match[7]) || 0
        };
      }
      return null;
    }).filter(Boolean);
  } else {
    result.pendapatanUpah = [];
  }
  
  // Cell 1: Pendapatan Usaha
  const usahaCell = cells[1] || '';
  if (usahaCell && usahaCell !== '0') {
    const usahaEntries = usahaCell.split(' | ').filter(Boolean);
    result.pendapatanUsaha = usahaEntries.map(entry => {
      const match = entry.match(/^\d+\.\s*(.+?)_(.+?)_(.+?)_NilaiProduksi:(\d+)_BiayaProduksi:(\d+)_Surplus:(-?\d+)_ImputasiNilaiProduksi:(\d+)/);
      if (match) {
        return {
          uraianKegiatan: match[1] || '',
          kategoriLU: match[2] || '',
          jenisPekerjaan: match[3] || '',
          nilaiProduksi: parseInt(match[4]) || 0,
          biayaProduksi: parseInt(match[5]) || 0,
          surplus: parseInt(match[6]) || 0,
          imputasiNilaiProduksi: parseInt(match[7]) || 0
        };
      }
      return null;
    }).filter(Boolean);
  } else {
    result.pendapatanUsaha = [];
  }
  
  // Cell 2: Produksi Sendiri
  const produksiCell = cells[2] || '';
  result.produksiSendiri = {
    perkiraanSewaRumah: { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0, imputasiNilaiProduksi: 0 },
    hasilPertanian: { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0, imputasiNilaiProduksi: 0 }
  };
  if (produksiCell && produksiCell !== '0') {
    const sewaMatch = produksiCell.match(/PerkiraanSewaRumah_NilaiProduksi:(\d+)_BiayaProduksi:(\d+)_Surplus:(-?\d+)_ImputasiNilaiProduksi:(\d+)/);
    if (sewaMatch) {
      result.produksiSendiri.perkiraanSewaRumah = {
        nilaiProduksi: parseInt(sewaMatch[1]) || 0,
        biayaProduksi: parseInt(sewaMatch[2]) || 0,
        surplus: parseInt(sewaMatch[3]) || 0,
        imputasiNilaiProduksi: parseInt(sewaMatch[4]) || 0
      };
    }
    const hasilMatch = produksiCell.match(/HasilPertanian_NilaiProduksi:(\d+)_BiayaProduksi:(\d+)_Surplus:(-?\d+)_ImputasiNilaiProduksi:(\d+)/);
    if (hasilMatch) {
      result.produksiSendiri.hasilPertanian = {
        nilaiProduksi: parseInt(hasilMatch[1]) || 0,
        biayaProduksi: parseInt(hasilMatch[2]) || 0,
        surplus: parseInt(hasilMatch[3]) || 0,
        imputasiNilaiProduksi: parseInt(hasilMatch[4]) || 0
      };
    }
  }
  
  // Cell 3: Pendapatan Kepemilikan
  const kepemilikanCell = cells[3] || '';
  result.pendapatanKepemilikan = {
    sewaLahan: { diterima: 0, dibayar: 0 },
    bagi_hasil: { diterima: 0, dibayar: 0 },
    deviden: { diterima: 0, dibayar: 0 },
    bunga: { diterima: 0, dibayar: 0 }
  };
  if (kepemilikanCell && kepemilikanCell !== '0') {
    const items = kepemilikanCell.split(' | ');
    for (const item of items) {
      const match = item.match(/(\w+)_Diterima:(\d+)_Dibayar:(\d+)/);
      if (match && result.pendapatanKepemilikan[match[1]]) {
        result.pendapatanKepemilikan[match[1]] = {
          diterima: parseInt(match[2]) || 0,
          dibayar: parseInt(match[3]) || 0
        };
      }
    }
  }
  
  // Cell 4: Transfer Berjalan
  const transferBerjalanCell = cells[4] || '';
  result.transferBerjalan = {
    pemerintah: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0, imputasiTransferDiterimaBarang: 0 },
    pemerintahUangPensiun: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0 },
    pemerintahBantuan: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0, imputasiTransferDiterimaBarang: 0 },
    badanUsaha: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
    rumahTanggaLain: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
    lembagaNirlaba: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
    luarNegeri: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 }
  };
  if (transferBerjalanCell && transferBerjalanCell !== '0') {
    const items = transferBerjalanCell.split(' | ');
    for (const item of items) {
      const match = item.match(/(\w+)_DiterimaUang:(\d+)_DiterimaBarang:(\d+)_DibayarUang:(\d+)_DibayarBarang:(\d+)_ImputasiDiterimaUang:(\d+)_ImputasiDiterimaBarang:(\d+)/);
      if (match && result.transferBerjalan[match[1]]) {
        result.transferBerjalan[match[1]] = {
          diterimaUang: parseInt(match[2]) || 0,
          diterimaBarang: parseInt(match[3]) || 0,
          dibayarUang: parseInt(match[4]) || 0,
          dibayarBarang: parseInt(match[5]) || 0,
          imputasiTransferDiterimaUang: parseInt(match[6]) || 0,
          imputasiTransferDiterimaBarang: parseInt(match[7]) || 0
        };
      }
    }
  }
  
  // Cell 5: Transfer Modal
  const transferModalCell = cells[5] || '';
  const defaultAsetValue = { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 };
  result.transferModal = {
    pemerintah: { diterima: { ...defaultAsetValue }, dibayar: { ...defaultAsetValue } },
    badanUsaha: { diterima: { ...defaultAsetValue }, dibayar: { ...defaultAsetValue } },
    rumahTangga: { diterima: { ...defaultAsetValue }, dibayar: { ...defaultAsetValue } },
    lembagaNirlaba: { diterima: { ...defaultAsetValue }, dibayar: { ...defaultAsetValue } },
    luarNegeri: { diterima: { ...defaultAsetValue }, dibayar: { ...defaultAsetValue } }
  };
  
  // Cell 6: Perubahan Aset
  const asetCell = cells[6] || '';
  const defaultAsetPerubahan = { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 };
  result.asetPerubahan = {
    asetTetapUsaha: {
      bangunanBukan: { ...defaultAsetPerubahan },
      kendaraan: { ...defaultAsetPerubahan },
      mesinPeralatan: { ...defaultAsetPerubahan },
      tanamanHewan: { ...defaultAsetPerubahan },
      lainnya: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0 }
    },
    bangunanTinggal: { ...defaultAsetPerubahan },
    biayaPemindahan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0 },
    lahanBarang: { ...defaultAsetPerubahan }
  };
  
  return result;
}

// Parse Page 6 data from cells
function parsePage6Data(cells: string[]): Record<string, any> {
  const result: Record<string, any> = { transaksiKeuangan: {} };
  
  // Cell 0: Penerimaan
  const penerimaanCell = cells[0] || '';
  if (penerimaanCell && penerimaanCell !== '0') {
    const items = penerimaanCell.split(' | ');
    const keyMap: Record<string, string> = {
      'Pengambilan Uang Tunai': 'pengambilanUangTunai',
      'Meminjam Uang': 'meminjamUang',
      'Menerima Pembayaran Kredit': 'menerimaPembayaranKredit',
      'Kredit Barang': 'kreditBarang',
      'Lainnya Penerimaan': 'lainnyaPenerimaan'
    };
    for (const item of items) {
      const match = item.match(/(.+?)_Nilai:(\d+)_Imputasi:(\d+)/);
      if (match) {
        const key = keyMap[match[1]];
        if (key) {
          result.transaksiKeuangan[key] = parseInt(match[2]) || 0;
          result.transaksiKeuangan[`imputasiPenerimaan${key.charAt(0).toUpperCase() + key.slice(1)}`] = parseInt(match[3]) || 0;
        }
      }
    }
  }
  
  // Cell 1: Pengeluaran
  const pengeluaranCell = cells[1] || '';
  if (pengeluaranCell && pengeluaranCell !== '0') {
    const items = pengeluaranCell.split(' | ');
    const keyMap: Record<string, string> = {
      'Menyimpan Uang Tunai': 'menyimpanUangTunai',
      'Membayar Hutang': 'membayarHutang',
      'Memberikan Kredit Barang': 'memberikanKreditBarang',
      'Membayar Kredit Barang': 'membayarKreditBarang',
      'Lainnya Pengeluaran': 'lainnyaPengeluaran'
    };
    for (const item of items) {
      const match = item.match(/(.+?)_Nilai:(\d+)_Imputasi:(\d+)/);
      if (match) {
        const key = keyMap[match[1]];
        if (key) {
          result.transaksiKeuangan[key] = parseInt(match[2]) || 0;
          result.transaksiKeuangan[`imputasiPengeluaran${key.charAt(0).toUpperCase() + key.slice(1)}`] = parseInt(match[3]) || 0;
        }
      }
    }
  }
  
  return result;
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
    
    // Fetch all data from the sheet (wider range to get all columns)
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
    
    console.log(`Found ${rows.length} rows in spreadsheet, ${rows[0]?.length || 0} columns`);
    
    const normalize = (v: unknown) => (v ?? "").toString().trim().toLowerCase();
    
    // Find matching row by username, NKS, and noSampel
    // Column layout: B=username (1), F=nks (5), J=noSampel (9)
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
    // Columns 0-13: Identity data
    const surveyData: Record<string, any> = {
      // Column 2-13: Identity
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
    
    // Column 14 onwards: Food items (PAGE 2)
    let colIndex = 14;
    surveyData.makananMinuman = {};
    
    for (const [categoryKey, category] of Object.entries(FOOD_CATEGORIES)) {
      if (categoryKey === 'M') {
        // Makanan Minuman Jadi
        const cellValue = matchingRow[colIndex] || '0';
        surveyData.makananMinuman['Makanan_Minuman_Jadi'] = parseExpenseCell(cellValue);
        colIndex++;
        continue;
      }
      
      if (categoryKey === 'N') {
        // Rokok Tembakau
        const cellValue = matchingRow[colIndex] || '0';
        surveyData.makananMinuman['Rokok_Tembakau'] = parseExpenseCell(cellValue);
        colIndex++;
        continue;
      }
      
      for (const item of (category as any).items) {
        const itemKey = `${categoryKey}_${item}`;
        const cellValue = matchingRow[colIndex] || '0';
        surveyData.makananMinuman[itemKey] = parseExpenseCell(cellValue);
        colIndex++;
      }
    }
    
    // Non-food items (PAGE 3)
    surveyData.komoditiASebulan = {};
    surveyData.komoditiBSebulan = {};
    surveyData.komoditiCSebulan = {};
    surveyData.komoditiDSebulan = {};
    surveyData.komoditiESebulan = {};
    surveyData.komoditiFSebulan = {};
    surveyData.komoditiSetahun = {};
    
    for (const [categoryKey, category] of Object.entries(NON_FOOD_DETAIL_CATEGORIES)) {
      // Monthly items
      for (const item of (category as any).monthlyItems) {
        const cellValue = matchingRow[colIndex] || '0';
        const monthlyDataKey = `komoditi${categoryKey}Sebulan`;
        surveyData[monthlyDataKey][item] = parseExpenseCell(cellValue);
        colIndex++;
      }
      
      // Yearly items
      for (const item of (category as any).yearlyItems) {
        const yearlyKey = `${categoryKey}_yearly_${item}`;
        const cellValue = matchingRow[colIndex] || '0';
        surveyData.komoditiSetahun[yearlyKey] = parseExpenseCell(cellValue);
        colIndex++;
      }
    }
    
    // PAGE 5 data (7 cells)
    const page5Cells = matchingRow.slice(colIndex, colIndex + 7);
    const page5Data = parsePage5Data(page5Cells);
    Object.assign(surveyData, page5Data);
    colIndex += 7;
    
    // PAGE 6 data (2 cells)
    const page6Cells = matchingRow.slice(colIndex, colIndex + 2);
    const page6Data = parsePage6Data(page6Cells);
    Object.assign(surveyData, page6Data);
    
    console.log(`Parsed up to column ${colIndex + 2}`);
    console.log('Successfully parsed COMPLETE survey data for all pages');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: surveyData
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
