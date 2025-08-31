export const NON_FOOD_CATEGORIES = {
  A: {
    title: "Perumahan dan Fasilitas Rumah Tangga",
    items: [
      "Kontrak rumah/kontrakan",
      "Sewa rumah", 
      "Biaya listrik",
      "Pembelian listrik (PLN Prabayar)/Token listrik",
      "Biaya telepon rumah",
      "Biaya air minum PAM/PDAM",
      "Biaya gas/elpiji untuk keperluan memasak",
      "Sabun mandi",
      "Sabun cuci (deterjen)",
      "Sabun cuci piring",
      "Pasta gigi",
      "Sampo",
      "Kosmetik",
      "Bahan bakar untuk kompor/penerangan minyak tanah/gas/kayu bakar/briket batubara"
    ]
  },
  B: {
    title: "Aneka Barang dan Jasa", 
    items: [
      "Biaya transportasi",
      "Biaya komunikasi dan internet (pulsa HP, paket internet, wifi, dll)",
      "Biaya hotel dan penginapan",
      "Biaya rekreasi",
      "Biaya pendidikan",
      "Biaya kesehatan",
      "Perawatan dan potong rambut"
    ]
  },
  C: {
    title: "Pakaian, Alas Kaki, dan Tutup Kepala",
    items: [
      "Pakaian jadi untuk pria",
      "Pakaian jadi untuk wanita",
      "Pakaian jadi untuk anak-anak",
      "Bahan pakaian",
      "Alas kaki",
      "Tutup kepala (topi, songkok, jilbab, dll)"
    ]
  },
  D: {
    title: "Barang Tahan Lama",
    items: [
      "Furnitur/perabot rumah tangga", 
      "Perhiasan",
      "Kendaraan",
      "Alat rumah tangga",
      "Alat/mesin pertanian"
    ]
  },
  E: {
    title: "Pajak, Pungutan, dan Asuransi",
    items: [
      "Pajak bumi dan bangunan (PBB)",
      "Pajak kendaraan bermotor",
      "Iuran asuransi kesehatan",
      "Iuran asuransi lainnya"
    ]
  },
  F: {
    title: "Keperluan Pesta dan Upacara/Kenduri",
    items: [
      "Keperluan pesta/upacara (pernikahan, khitanan, syukuran, dll)",
      "Keperluan upacara adat",
      "Keperluan upacara keagamaan"
    ]
  }
};

// Additional questions for monthly period (sebulan terakhir)
export const ADDITIONAL_MONTHLY_A = [
  "Produksi Sendiri (termasuk Kayu Bakar Sendiri)",
  "Menempati Rumah Milik Sendiri", 
  "Menempati Rumah Bebas Sewa"
];

export const ADDITIONAL_MONTHLY_B = [
  "Produksi Sendiri (termasuk Kayu Bakar Sendiri)"
];

// Additional questions for yearly period (setahun terakhir)
export const ADDITIONAL_YEARLY_BC = [
  "Biaya Sekolah/Pajak Motor/PBB/iuran BPJS yang seharusnya dibayar tapi belum dibayar saat pencacahan"
];

export const ADDITIONAL_YEARLY_B_TO_F = [
  "Produksi Sendiri (Usaha/Bukan Usaha Ruta)"
];