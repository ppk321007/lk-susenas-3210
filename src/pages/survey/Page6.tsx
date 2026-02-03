import { SurveyData, TransaksiKeuanganEntry } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { NON_FOOD_CATEGORIES } from "@/data/nonFoodCategories";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { calculateImputasiFromFood } from "@/utils/imputasiCalculations";
import { 
  getFoodCategoryTotals, 
  getNonFoodMonthlyTotal, 
  getNonFoodYearlyTotal,
  getNonFoodMonthlyAverage,
  getNormalizedExpenseTotals
} from "@/utils/expenseNormalizer";

interface Page6Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page6 = ({
  data,
  updateData
}: Page6Props) => {
  const {
    recalculateImputasi
  } = useSurveyImputasi(data, updateData);
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };
  const parseNumber = (str: string) => {
    return parseInt(str.replace(/\D/g, '')) || 0;
  };

  // Calculate comprehensive imputasi values from food consumption data
  const imputasiCalculations = calculateImputasiFromFood(data);
  
  // Initialize financial transactions with calculated imputasi values
  // Ensure all transaction fields have default 0 to prevent losing data on reload
  // Build transaksiKeuangan by merging user data with calculated imputasi
  const userTransaksi = data.transaksiKeuangan || {} as Partial<TransaksiKeuanganEntry>;
  const calculatedTransaksi = (imputasiCalculations as any).transaksiKeuangan || {};
  
  const transaksiKeuangan: TransaksiKeuanganEntry = {
    // User-editable transaction fields (preserve user values)
    pengambilanUangTunai: userTransaksi.pengambilanUangTunai || 0,
    meminjamUang: userTransaksi.meminjamUang || 0,
    menerimaPembayaranKredit: userTransaksi.menerimaPembayaranKredit || 0,
    kreditBarang: userTransaksi.kreditBarang || 0,
    lainnyaPenerimaan: userTransaksi.lainnyaPenerimaan || 0,
    menyimpanUangTunai: userTransaksi.menyimpanUangTunai || 0,
    membayarHutang: userTransaksi.membayarHutang || 0,
    memberikanKreditBarang: userTransaksi.memberikanKreditBarang || 0,
    membayarKreditBarang: userTransaksi.membayarKreditBarang || 0,
    lainnyaPengeluaran: userTransaksi.lainnyaPengeluaran || 0,
    // Calculated imputasi fields (from calculations)
    imputasiPenerimaanPengambilanUangTunai: calculatedTransaksi.imputasiPenerimaanPengambilanUangTunai || 0,
    imputasiPenerimaanMeminjamUang: calculatedTransaksi.imputasiPenerimaanMeminjamUang || 0,
    imputasiPenerimaanKreditBarang: calculatedTransaksi.imputasiPenerimaanKreditBarang || 0,
    imputasiPenerimaanLainnya: calculatedTransaksi.imputasiPenerimaanLainnya || 0,
    imputasiPengeluaranMenyimpanUangTunai: calculatedTransaksi.imputasiPengeluaranMenyimpanUangTunai || 0,
    imputasiPengeluaranLainnya: calculatedTransaksi.imputasiPengeluaranLainnya || 0
  };

  // Store kontrol data separately for display (not in TransaksiKeuanganEntry type)
  const kontrolData = {
    kontrolMengambil: calculatedTransaksi.kontrolMengambil || {},
    kontrolMenyimpan: calculatedTransaksi.kontrolMenyimpan || {}
  };
  
  const updateTransaksiKeuangan = (field: keyof TransaksiKeuanganEntry, value: number) => {
    updateData({
      transaksiKeuangan: {
        ...transaksiKeuangan,
        [field]: value
      }
    });
  };

  // Get kontrol data for display
  const kontrolMengambil = kontrolData.kontrolMengambil || {};
  const kontrolMenyimpan = kontrolData.kontrolMenyimpan || {};

  // Calculate income values
  const calculateUpahGaji = () => {
    return data.pendapatanUpah?.reduce((sum, entry) => sum + (entry.upahUang || 0) + (entry.upahBarang || 0) + (entry.lembur || 0), 0) || 0;
  };
  const calculateUsahaSurplus = () => {
    return data.pendapatanUsaha?.reduce((sum, entry) => sum + (entry.surplus || 0), 0) || 0;
  };
  const calculateProduksiSendiri = () => {
    const perkiraanSewa = data.produksiSendiri?.perkiraanSewaRumah?.surplus || 0;
    const hasilPertanian = data.produksiSendiri?.hasilPertanian?.surplus || 0;
    return perkiraanSewa + hasilPertanian;
  };
  const calculateKepemilikanDiterima = () => {
    if (!data.pendapatanKepemilikan) return 0;
    return (data.pendapatanKepemilikan.sewaLahan?.diterima || 0) + (data.pendapatanKepemilikan.bagi_hasil?.diterima || 0) + (data.pendapatanKepemilikan.deviden?.diterima || 0) + (data.pendapatanKepemilikan.bunga?.diterima || 0);
  };
  const calculateKepemilikanDibayar = () => {
    if (!data.pendapatanKepemilikan) return 0;
    return (data.pendapatanKepemilikan.sewaLahan?.dibayar || 0) + (data.pendapatanKepemilikan.bagi_hasil?.dibayar || 0) + (data.pendapatanKepemilikan.deviden?.dibayar || 0) + (data.pendapatanKepemilikan.bunga?.dibayar || 0);
  };
  const calculateTransferBerjalanDiterima = () => {
    if (!data.transferBerjalan) return 0;
    // Use child entries for pemerintah (pemerintahUangPensiun + pemerintahBantuan) + other entities
    return (data.transferBerjalan.pemerintahUangPensiun?.diterimaUang || 0) + (data.transferBerjalan.pemerintahUangPensiun?.diterimaBarang || 0) + (data.transferBerjalan.pemerintahBantuan?.diterimaUang || 0) + (data.transferBerjalan.pemerintahBantuan?.diterimaBarang || 0) + (data.transferBerjalan.badanUsaha?.diterimaUang || 0) + (data.transferBerjalan.badanUsaha?.diterimaBarang || 0) + (data.transferBerjalan.rumahTanggaLain?.diterimaUang || 0) + (data.transferBerjalan.rumahTanggaLain?.diterimaBarang || 0) + (data.transferBerjalan.lembagaNirlaba?.diterimaUang || 0) + (data.transferBerjalan.lembagaNirlaba?.diterimaBarang || 0) + (data.transferBerjalan.luarNegeri?.diterimaUang || 0) + (data.transferBerjalan.luarNegeri?.diterimaBarang || 0);
  };
  const calculateTransferBerjalanDibayar = () => {
    if (!data.transferBerjalan) return 0;
    // Use child entries for pemerintah (pemerintahUangPensiun + pemerintahBantuan) + other entities
    return (data.transferBerjalan.pemerintahUangPensiun?.dibayarUang || 0) + (data.transferBerjalan.pemerintahUangPensiun?.dibayarBarang || 0) + (data.transferBerjalan.pemerintahBantuan?.dibayarUang || 0) + (data.transferBerjalan.pemerintahBantuan?.dibayarBarang || 0) + (data.transferBerjalan.badanUsaha?.dibayarUang || 0) + (data.transferBerjalan.badanUsaha?.dibayarBarang || 0) + (data.transferBerjalan.rumahTanggaLain?.dibayarUang || 0) + (data.transferBerjalan.rumahTanggaLain?.dibayarBarang || 0) + (data.transferBerjalan.lembagaNirlaba?.dibayarUang || 0) + (data.transferBerjalan.lembagaNirlaba?.dibayarBarang || 0) + (data.transferBerjalan.luarNegeri?.dibayarUang || 0) + (data.transferBerjalan.luarNegeri?.dibayarBarang || 0);
  };
  const calculateTransferModalDiterima = () => {
    if (!data.transferModal) return 0;
    let total = 0;
    ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri'].forEach(source => {
      const sourceData = (data.transferModal as any)[source]?.diterima;
      if (sourceData) {
        total += (sourceData.bangunanTinggal || 0) + (sourceData.bangunanBukan || 0) + (sourceData.alatProduksi || 0) + (sourceData.tanamanHewan || 0) + (sourceData.kendaraan || 0) + (sourceData.lahan || 0);
      }
    });
    return total;
  };
  const calculateTransferModalDibayar = () => {
    if (!data.transferModal) return 0;
    let total = 0;
    ['pemerintah', 'badanUsaha', 'rumahTangga', 'lembagaNirlaba', 'luarNegeri'].forEach(source => {
      const sourceData = (data.transferModal as any)[source]?.dibayar;
      if (sourceData) {
        total += (sourceData.bangunanTinggal || 0) + (sourceData.bangunanBukan || 0) + (sourceData.alatProduksi || 0) + (sourceData.tanamanHewan || 0) + (sourceData.kendaraan || 0) + (sourceData.lahan || 0);
      }
    });
    return total;
  };
  const calculateAsetNeto = () => {
    if (!data.asetPerubahan) return 0;
    let total = 0;

    // Aset tetap usaha
    if (data.asetPerubahan.asetTetapUsaha) {
      ['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan', 'lainnya'].forEach(asset => {
        const assetData = (data.asetPerubahan.asetTetapUsaha as any)[asset];
        if (assetData) {
          total += assetData.netto || 0;
        }
      });
    }

    // Other assets
    total += data.asetPerubahan.bangunanTinggal?.netto || 0;
    total += data.asetPerubahan.biayaPemindahan?.netto || 0;
    total += data.asetPerubahan.lahanBarang?.netto || 0;
    return total;
  };

  // Calculate consumption expenses from BLOK IV.3.3 - use exact same calculation as Page4Recap
  const calculateKonsumsiRT = () => {
    // Get food category totals (A-N, including M and N)
    const foodSubtotal = Object.keys(FOOD_CATEGORIES).reduce((total, categoryKey) => {
      const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
      
      if (categoryKey === 'M' || categoryKey === 'N') {
        // For M and N, get per-member totals
        let mNTotal = 0;
        data.namaAnggotaRumahTangga.forEach((_, index) => {
          const expense = data.makananMinuman?.[`${categoryKey}_${index}`];
          const normalized = getNormalizedExpenseTotals(expense);
          mNTotal += normalized.total;
        });
        return total + mNTotal;
      } else {
        // For A-L, use getFoodCategoryTotals
        const { totalPembelian, totalProduksiSendiri } = getFoodCategoryTotals(
          categoryKey,
          data.makananMinuman,
          category?.items || [],
          data.namaAnggotaRumahTangga
        );
        return total + totalPembelian + totalProduksiSendiri;
      }
    }, 0);

    // Food monthly average (from weekly data)
    const foodMonthlyAverage = foodSubtotal * 30 / 7;

    // Get non-food monthly average (combines monthly entries and yearly entries divided by 12)
    const nonFoodMonthlyAverage = getNonFoodMonthlyAverage(data, NON_FOOD_CATEGORIES);

    // RATA-RATA PENGELUARAN RUMAH TANGGA SEBULAN (from BLOK IV.3.3 - food A-N + non-food monthly average)
    const monthlyAverage = Math.round(foodMonthlyAverage + nonFoodMonthlyAverage);

    // Convert to yearly (multiply by 12) for BLOK VI
    const yearlyConsumption = monthlyAverage * 12;

    return yearlyConsumption;
  };

  // Calculate totals
  const upahGaji = calculateUpahGaji();
  const usahaSurplus = calculateUsahaSurplus();
  const produksiSendiri = calculateProduksiSendiri();
  const kepemilikanDiterima = calculateKepemilikanDiterima();
  const kepemilikanDibayar = calculateKepemilikanDibayar();
  const transferBerjalanDiterima = calculateTransferBerjalanDiterima();
  const transferBerjalanDibayar = calculateTransferBerjalanDibayar();
  const transferModalDiterima = calculateTransferModalDiterima();
  const transferModalDibayar = calculateTransferModalDibayar();
  const asetNeto = calculateAsetNeto();
  const konsumsiRT = calculateKonsumsiRT();
  const totalPenerimaan = upahGaji + usahaSurplus + produksiSendiri + kepemilikanDiterima + transferBerjalanDiterima + transferModalDiterima;
  const totalPengeluaran = konsumsiRT + kepemilikanDibayar + transferBerjalanDibayar + transferModalDibayar + asetNeto;
  const selisihPenerimaanPengeluaran = totalPenerimaan - totalPengeluaran;

  // Financial transaction calculations
  const totalPenerimaanKeuangan = transaksiKeuangan.pengambilanUangTunai + transaksiKeuangan.meminjamUang + transaksiKeuangan.menerimaPembayaranKredit + transaksiKeuangan.kreditBarang + transaksiKeuangan.lainnyaPenerimaan;
  const totalPengeluaranKeuangan = transaksiKeuangan.menyimpanUangTunai + transaksiKeuangan.membayarHutang + transaksiKeuangan.memberikanKreditBarang + transaksiKeuangan.membayarKreditBarang + transaksiKeuangan.lainnyaPengeluaran;
  const selisihTransaksiKeuangan = totalPengeluaranKeuangan - totalPenerimaanKeuangan;

  // Calculate final imputasi for Pengambilan Uang (add konsumsi to base imputasi)
  const imputasiPengambilanUangFinal = konsumsiRT + (kontrolMengambil.total1 || 0) - (kontrolMengambil.total2 || 0);

  // Calculate discrepancy
  const diskrepansi = selisihPenerimaanPengeluaran - selisihTransaksiKeuangan;
  return <div className="max-w-none w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-professional-navy">
          HALAMAN 6 - REKAPITULASI PENERIMAAN DAN PENGELUARAN
        </h2>
        <Button onClick={recalculateImputasi} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      {/* Table 1: Income and Expenditure Recap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VI. REKAPITULASI PENGELUARAN RUMAH TANGGA SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-professional-table-header text-professional-table-header-foreground">
                  <th className="border border-gray-300 p-2">Rincian Penerimaan</th>
                  <th className="border border-gray-300 p-2">Nilai</th>
                  <th className="border border-gray-300 p-2">Rincian Pengeluaran</th>
                  <th className="border border-gray-300 p-2">Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">1. Upah dan Gaji</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(upahGaji)}</td>
                  <td className="border border-gray-300 p-2">1. Pengeluaran Konsumsi Rumah Tangga</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(konsumsiRT)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">2. Pendapatan/Surplus dari Usaha Rumah Tangga</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(usahaSurplus)}</td>
                  <td className="border border-gray-300 p-2">2. Pendapatan Kepemilikan yang Dibayar</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(kepemilikanDibayar)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">3. Pendapatan/Surplus dari Produksi Rumah Tangga yang Dikonsumsi/Digunakan Sendiri</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(produksiSendiri)}</td>
                  <td className="border border-gray-300 p-2">3. Transfer Berjalan (selain Aset) Dibayar</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(transferBerjalanDibayar)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">4. Pendapatan Kepemilikan yang Diterima</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(kepemilikanDiterima)}</td>
                  <td className="border border-gray-300 p-2">4. Transfer Modal/Aset Dibayar</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(transferModalDibayar)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">5. Transfer Berjalan (selain aset) Diterima</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(transferBerjalanDiterima)}</td>
                  <td className="border border-gray-300 p-2">5. Total Aset Neto</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(asetNeto)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">6. Transfer Modal/Aset Diterima</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(transferModalDiterima)}</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(totalPenerimaan)}</td>
                  <td className="border border-gray-300 p-2">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(totalPengeluaran)}</td>
                </tr>
                <tr className="bg-primary/10 font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={3}>
                    Selisih Penerimaan dan Pengeluaran [Jumlah Kolom (2) – Jumlah Kolom (4)]
                  </td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(selisihPenerimaanPengeluaran)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2: Financial Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VII. REKAPITULASI PENGELUARAN RUMAH TANGGA SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                 <tr className="bg-professional-table-header text-professional-table-header-foreground">
                   <th className="border border-gray-300 p-2">Rincian Penerimaan</th>
                   <th className="border border-gray-300 p-2">Nilai</th>
                   <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Rincian Penerimaan</th>
                   <th className="border border-gray-300 p-2">Rincian Pengeluaran</th>
                   <th className="border border-gray-300 p-2">Nilai</th>
                   <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Rincian Pengeluaran</th>
                 </tr>
               </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">1. Pengambilan Uang Tunai dan Tabungan</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.pengambilanUangTunai ? formatNumber(transaksiKeuangan.pengambilanUangTunai) : ''} onChange={e => updateTransaksiKeuangan('pengambilanUangTunai', parseNumber(e.target.value))} className="w-full text-right" style={{
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none'
                  }} />
                  </td>
                  <td className="border border-gray-300 p-2">
                     <Input type="text" value={formatNumber(imputasiPengambilanUangFinal)} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                   </td>
                  <td className="border border-gray-300 p-2">1. Menyimpan Uang Tunai dan Menabung</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.menyimpanUangTunai ? formatNumber(transaksiKeuangan.menyimpanUangTunai) : ''} onChange={e => updateTransaksiKeuangan('menyimpanUangTunai', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.imputasiPengeluaranMenyimpanUangTunai ? formatNumber(transaksiKeuangan.imputasiPengeluaranMenyimpanUangTunai) : '0'} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">2. Meminjam Uang</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.meminjamUang ? formatNumber(transaksiKeuangan.meminjamUang) : ''} onChange={e => updateTransaksiKeuangan('meminjamUang', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.imputasiPenerimaanMeminjamUang ? formatNumber(transaksiKeuangan.imputasiPenerimaanMeminjamUang) : '0'} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                  <td className="border border-gray-300 p-2">2. Membayar Hutang</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.membayarHutang ? formatNumber(transaksiKeuangan.membayarHutang) : ''} onChange={e => updateTransaksiKeuangan('membayarHutang', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value="0" readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">3. Menerima Pembayaran Kredit Barang (Usaha Rumah Tangga)</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.menerimaPembayaranKredit ? formatNumber(transaksiKeuangan.menerimaPembayaranKredit) : ''} onChange={e => updateTransaksiKeuangan('menerimaPembayaranKredit', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value="0" readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                  <td className="border border-gray-300 p-2">3. Memberikan Kredit Barang (Usaha Rumah Tangga)</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.memberikanKreditBarang ? formatNumber(transaksiKeuangan.memberikanKreditBarang) : ''} onChange={e => updateTransaksiKeuangan('memberikanKreditBarang', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value="0" readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">4. Kredit Barang</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.kreditBarang ? formatNumber(transaksiKeuangan.kreditBarang) : ''} onChange={e => updateTransaksiKeuangan('kreditBarang', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.imputasiPenerimaanKreditBarang ? formatNumber(transaksiKeuangan.imputasiPenerimaanKreditBarang) : '0'} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                  <td className="border border-gray-300 p-2">4. Membayar Kredit Barang</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.membayarKreditBarang ? formatNumber(transaksiKeuangan.membayarKreditBarang) : ''} onChange={e => updateTransaksiKeuangan('membayarKreditBarang', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value="0" readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">5. Lainnya (Pengembalian Piutang, Menggadaikan Barang, Mendapat Arisan, Klaim Asuransi Jiwa/Pendidikan, dll.)</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.lainnyaPenerimaan ? formatNumber(transaksiKeuangan.lainnyaPenerimaan) : ''} onChange={e => updateTransaksiKeuangan('lainnyaPenerimaan', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.imputasiPenerimaanLainnya ? formatNumber(transaksiKeuangan.imputasiPenerimaanLainnya) : '0'} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                  <td className="border border-gray-300 p-2">5. Lainnya (Meminjamkan Uang, Menebus Barang, Gadaian, Membayar Arisan, Premi Asuransi Jiwa/Pendidikan, dll.)</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.lainnyaPengeluaran ? formatNumber(transaksiKeuangan.lainnyaPengeluaran) : ''} onChange={e => updateTransaksiKeuangan('lainnyaPengeluaran', parseNumber(e.target.value))} className="w-full text-right" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={transaksiKeuangan.imputasiPengeluaranLainnya ? formatNumber(transaksiKeuangan.imputasiPengeluaranLainnya) : '0'} readOnly disabled placeholder="0" className="w-full text-right bg-gray-100 text-foreground" />
                  </td>
                </tr>
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(totalPenerimaanKeuangan)}</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(imputasiPengambilanUangFinal + (transaksiKeuangan.imputasiPenerimaanMeminjamUang || 0) + (transaksiKeuangan.imputasiPenerimaanKreditBarang || 0) + (transaksiKeuangan.imputasiPenerimaanLainnya || 0))}</td>
                  <td className="border border-gray-300 p-2">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(totalPengeluaranKeuangan)}</td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber((transaksiKeuangan.imputasiPengeluaranMenyimpanUangTunai || 0) + (transaksiKeuangan.imputasiPengeluaranLainnya || 0))}</td>
                </tr>
                <tr className="bg-primary/10 font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={5}>
                    Selisih Transaksi Keuangan Rincian Pengeluaran dan Penerimaan [Jumlah Kolom (5) – Jumlah Kolom (2)]
                  </td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(selisihTransaksiKeuangan)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Kontrol Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-green-700">
            KONTROL TRANSAKSI KEUANGAN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kontrol Mengambil Uang dan Tabungan */}
            <div>
              <h4 className="font-semibold mb-3 text-center bg-muted p-2 rounded">Kontrol Mengambil Uang dan Tabungan</h4>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Konsumsi</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(konsumsiRT)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Biaya Produksi</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.biayaProduksi || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Transfer Keluar</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.transferKeluar || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Pendapatan Kepemilikan yang Dibayar (Blok D)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.pendapatanKepemilikanDibayar || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Penambahan Aset (Blok G)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.penambahanAset || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Transaksi Keuangan Keluar (Blok VII keluar)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.transaksiKeuanganKeluar || 0)}</td>
                  </tr>
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2">Total 1</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(konsumsiRT + (kontrolMengambil.total1 || 0))}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Upah Gaji dalam Bentuk Barang</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.upahGajiBarang || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Nilai Produksi digunakan Sendiri (Blok C kol 2)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.nilaiProduksiSendiri || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Transfer Masuk Barang/Jasa (Blok VE kol 3)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.transferMasukBarang || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Transfer Masuk Modal (Blok F)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.transferMasukModal || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Membeli Barang Kredit</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.membeliBarangKredit || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Non Transaksi (listrik nyantol, pajak gak bayar, dll)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.nonTransaksi || 0)}</td>
                  </tr>
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2">Total 2</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMengambil.total2 || 0)}</td>
                  </tr>
                  <tr className="bg-primary/20 font-bold">
                    <td className="border border-gray-300 p-2">Mengambil Uang dan Tabungan (Total1-Total2)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(imputasiPengambilanUangFinal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Kontrol Menyimpan Uang dan Menabung */}
            <div>
              <h4 className="font-semibold mb-3 text-center bg-muted p-2 rounded">Kontrol Menyimpan Uang dan Menabung</h4>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Upah/Gaji Dalam Bentuk Uang (kol 8+9)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.upahGajiUang || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Nilai Produksi Usaha</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.nilaiProduksiUsaha || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Transfer Masuk Uang (VE kol 2)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.transferMasukUang || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Pendapatan Kepemilikan yang Diterima (Blok D kol 2)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.pendapatanKepemilikanDiterima || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Pengurangan Aset</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.penguranganAset || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Transaksi Keuangan Diterima (VII Masuk)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.transaksiKeuanganDiterima || 0)}</td>
                  </tr>
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2">Total 1</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.total1 || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Transfer Modal Keluar (Blok F)</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.transferModalKeluar || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Hasil Produksi Belum Terjual</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.hasilProduksiBelumTerjual || 0)}</td>
                  </tr>
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2">Total 2</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(kontrolMenyimpan.total2 || 0)}</td>
                  </tr>
                  <tr className="bg-primary/20 font-bold">
                    <td className="border border-gray-300 p-2">Menyimpan Uang dan Menabung</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(transaksiKeuangan.imputasiPengeluaranMenyimpanUangTunai || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
            <AlertTriangle className="h-5 w-5 text-warning" />
            DISKREPANSI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-indigo-200">
                <h4 className="font-medium mb-2">Selisih Penerimaan dan Pengeluaran</h4>
                <p className="text-lg font-semibold">Rp {formatNumber(selisihPenerimaanPengeluaran)}</p>
              </div>
              <div className="p-4 rounded-lg bg-sky-200">
                <h4 className="font-medium mb-2">Selisih Transaksi Keuangan</h4>
                <p className="text-lg font-semibold">Rp {formatNumber(selisihTransaksiKeuangan)}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-l-4 border-primary bg-lime-100">
              <h4 className="font-medium mb-2">Nilai Diskrepansi:</h4>
              <p className="text-xl font-bold text-primary">Rp {formatNumber(diskrepansi)}</p>
            </div>

            {diskrepansi !== 0 && <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Peringatan:</strong> Nilai diskrepansi idealnya = 0. 
                  Silakan periksa kembali data penerimaan, pengeluaran, dan transaksi keuangan yang telah diinput.
                </AlertDescription>
              </Alert>}

            {diskrepansi === 0 && <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ <strong>Seimbang:</strong> Nilai diskrepansi = 0. Data sudah balance dan konsisten.
                </AlertDescription>
              </Alert>}
          </div>
        </CardContent>
      </Card>
    </div>;
};