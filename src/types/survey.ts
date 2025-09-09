export interface SurveyData {
  // Halaman 1 - Identitas
  namaPendata: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  namaKepalaRumahTangga: string;
  jumlahAnggotaRumahTangga: number;
  namaAnggotaRumahTangga: string[];
  
  // Halaman 2 - Konsumsi dan Pengeluaran Bahan Makanan (A-F)
  makananMinuman: Record<string, FoodExpense>;
  
  // Halaman 3 - Data non-food commodities A-F
  komoditiASebulan: Record<string, NonFoodExpense>;
  komoditiBSebulan: Record<string, NonFoodExpense>;
  komoditiCSebulan: Record<string, NonFoodExpense>;
  komoditiDSebulan: Record<string, NonFoodExpense>;
  komoditiESebulan: Record<string, NonFoodExpense>;
  komoditiFSebulan: Record<string, NonFoodExpense>;
  komoditiSetahun: Record<string, NonFoodExpense>;
  
  // Halaman 4 - Income data
  pendapatanUpah: UpahGajiEntry[];
  pendapatanUsaha: UsahaEntry[];
  produksiSendiri: ProduksiSendiriEntry;
  pendapatanKepemilikan: KepemilikanEntry;
  transferBerjalan: TransferBerjalanEntry;
  transferModal: TransferModalEntry;
  asetPerubahan: AsetPerubahanEntry;
  transaksiKeuangan?: TransaksiKeuanganEntry;
}

export interface ExpenseEntry {
  nilai: number;
  kategori: 'Pembelian' | 'Produksi Sendiri/Pemberian' | 'Pemberian';
  jenisDetail: string;
}

export interface FoodExpense {
  pembelian: number;
  produksiSendiri: number;
  jenisPembelian?: string;
  jenisProduksiSendiri?: string;
  entries?: ExpenseEntry[];
}

export interface NonFoodExpense {
  pembelian: number;
  produksiSendiri: number;
  jenisPembelian?: string;
  jenisProduksiSendiri?: string;
}

export const JENIS_PEMBELIAN = [
  "Pembelian Tunai",
  "Subsidi harga dari Pemerintah (Pembelian barang di bawah harga pasar)",
  "Pengambilan dari Warung Sendiri",
  "Konsumsi Bantuan Pangan BPNT",
  "Konsumsi Beras/palawija hasil panenan sendiri",
  "Konsumsi beras/palawija hasil upah buruh derep/ panen",
  "Pemberian dari Pemerintah Pemberi Kerja sebagai PNS/ TNI/ Polri/ Karyawan/ Buruh",
  "Pembelian Bon/Hutang",
  "Uang berasal dari rumah tangga lain"
];

export const JENIS_PEMBERIAN = [
  "Pemberian dari Pemerintah secara Gratis",
  "Pemberian dari Rumah Tangga Lain",
  "Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)",
  "Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)",
  "Berasal dari Produksi Sendiri"
];

// Keep the old constants for food pages
export const JENIS_PRODUKSI_SENDIRI = [
  "Pemberian dari Pemerintah secara Gratis",
  "Pemberian dari Rumah Tangga Lain",
  "Pemberian dari Lembaga Nirlaba (Sumbangan dari Masjid, Gereja, Panti, dll)",
  "Pemberian dari Luar Negeri (Sumbangan dari LSM Luar Negeri)",
  "Berasal dari Produksi Sendiri"
];

// New interfaces for income data
export interface UpahGajiEntry {
  id: string;
  uraianPekerjaan: string;
  kategoriLU: string;
  jenisPekerjaan: string;
  upahUang: number;
  upahBarang: number;
  lembur: number;
  imputasiUpahGajiBarang: number;
}

export interface UsahaEntry {
  id: string;
  uraianKegiatan: string;
  kategoriLU: string;
  jenisPekerjaan: string;
  nilaiProduksi: number;
  biayaProduksi: number;
  surplus: number;
  imputasiNilaiProduksi?: number;
}

export interface ProduksiSendiriEntry {
  perkiraanSewaRumah: { nilaiProduksi: number; biayaProduksi: number; surplus: number; imputasiNilaiProduksi?: number };
  hasilPertanian: { nilaiProduksi: number; biayaProduksi: number; surplus: number; imputasiNilaiProduksi?: number };
}

export interface KepemilikanEntry {
  sewaLahan: { diterima: number; dibayar: number };
  bagi_hasil: { diterima: number; dibayar: number };
  deviden: { diterima: number; dibayar: number };
  bunga: { diterima: number; dibayar: number };
}

export interface TransferBerjalanEntry {
  pemerintah: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaUang: number; imputasiTransferDiterimaBarang: number };
  pemerintahUangPensiun: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaUang: number };
  pemerintahBantuan: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaUang: number; imputasiTransferDiterimaBarang: number };
  badanUsaha: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaBarang: number };
  rumahTanggaLain: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaBarang: number };
  lembagaNirlaba: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaBarang: number };
  luarNegeri: { diterimaUang: number; diterimaBarang: number; dibayarUang: number; dibayarBarang: number; imputasiTransferDiterimaBarang: number };
}

export interface TransferModalEntry {
  pemerintah: { 
    diterima: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
    dibayar: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
  };
  badanUsaha: { 
    diterima: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
    dibayar: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
  };
  rumahTangga: { 
    diterima: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
    dibayar: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
  };
  lembagaNirlaba: { 
    diterima: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
    dibayar: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
  };
  luarNegeri: { 
    diterima: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
    dibayar: { bangunanTinggal: number; bangunanBukan: number; alatProduksi: number; tanamanHewan: number; kendaraan: number; lahan: number };
  };
}

export interface AsetPerubahanEntry {
  asetTetapUsaha: {
    bangunanBukan: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
    kendaraan: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
    mesinPeralatan: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
    tanamanHewan: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
    lainnya: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number };
  };
  bangunanTinggal: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
  biayaPemindahan: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number };
  lahanBarang: { pembelian: number; pemberian: number; pembuatanSendiri: number; penjualan: number; pemberianKepada: number; netto: number; imputasiPenamabahanPemberian: number; imputasiPenguranganPemberianKepada: number };
}

export interface TransaksiKeuanganEntry {
  pengambilanUangTunai: number;
  meminjamUang: number;
  menerimaPembayaranKredit: number;
  kreditBarang: number;
  lainnyaPenerimaan: number;
  menyimpanUangTunai: number;
  membayarHutang: number;
  memberikanKreditBarang: number;
  membayarKreditBarang: number;
  lainnyaPengeluaran: number;
  imputasiPenerimaanPengambilanUangTunai: number;
  imputasiPenerimaanMeminjamUang: number;
  imputasiPenerimaanKreditBarang: number;
  imputasiPenerimaanLainnya: number;
  imputasiPengeluaranMenyimpanUangTunai: number;
  imputasiPengeluaranLainnya: number;
}