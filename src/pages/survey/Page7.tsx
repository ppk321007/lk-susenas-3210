import { SurveyData } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw } from "lucide-react";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
interface Page7Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page7 = ({
  data,
  updateData
}: Page7Props) => {
  const {
    recalculateImputasi
  } = useSurveyImputasi(data, updateData);
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSaveData = () => {
    try {
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        surveyData: data
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.namaKepalaRumahTangga || 'Tidak Diketahui'} - ${data.kecamatan || 'Tidak Diketahui'} - ${data.desa || 'Tidak Diketahui'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Data Berhasil Disimpan",
        description: "File data survei telah didownload ke komputer Anda."
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Data",
        description: "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive"
      });
    }
  };
  const handleLoadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonString = e.target?.result as string;
        const importData = JSON.parse(jsonString);
        if (importData.surveyData) {
          updateData(importData.surveyData);
          toast({
            title: "Data Berhasil Dimuat",
            description: "Data survei telah berhasil dimuat dari file."
          });
        } else {
          throw new Error("Format file tidak valid");
        }
      } catch (error) {
        toast({
          title: "Gagal Memuat Data",
          description: "File yang dipilih tidak valid atau rusak.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const getTotalFoodExpenses = () => {
    // Data makanan/minuman diisi untuk 1 minggu terakhir -> konversi ke setahun
    let weeklyTotal = 0;
    Object.values(data.makananMinuman).forEach(expense => {
      weeklyTotal += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
    });
    const annual = weeklyTotal * (30 / 7) * 12; // Mingguan x 30/7 x 12
    return Math.round(annual);
  };
  const getTotalNonFoodExpenses = () => {
    // Non-makanan: Sebulan -> x12, Setahun -> apa adanya
    let monthlySum = 0;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(categoryKey => {
      const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
      if (monthlyData) {
        Object.values(monthlyData).forEach((expense: any) => {
          if (expense) {
            monthlySum += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
          }
        });
      }
    });
    let yearlySum = 0;
    Object.values(data.komoditiSetahun).forEach((expense: any) => {
      if (expense) {
        yearlySum += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
      }
    });
    const annual = monthlySum * 12 + yearlySum;
    return Math.round(annual);
  };
  const getTotalIncome = () => {
    let total = 0;

    // Upah dan gaji
    data.pendapatanUpah.forEach(upah => {
      total += upah.upahUang + upah.upahBarang + upah.lembur;
    });

    // Pendapatan usaha
    data.pendapatanUsaha.forEach(usaha => {
      total += usaha.surplus;
    });

    // Produksi sendiri
    total += data.produksiSendiri.perkiraanSewaRumah.surplus;
    total += data.produksiSendiri.hasilPertanian.surplus;

    // Pendapatan kepemilikan
    Object.values(data.pendapatanKepemilikan).forEach(item => {
      total += item.diterima;
    });

    // Transfer berjalan diterima
    Object.values(data.transferBerjalan).forEach(item => {
      total += item.diterimaUang + item.diterimaBarang;
    });
    return Math.round(total);
  };
  const getExpenseStructure = () => {
    const totalFood = getTotalFoodExpenses();
    const totalNonFood = getTotalNonFoodExpenses();
    const total = totalFood + totalNonFood;
    return {
      totalFood,
      totalNonFood,
      total,
      foodPercentage: total > 0 ? totalFood / total * 100 : 0,
      nonFoodPercentage: total > 0 ? totalNonFood / total * 100 : 0
    };
  };
  const getIncomeBreakdown = () => {
    const upahGaji = data.pendapatanUpah.reduce((sum, upah) => sum + upah.upahUang + upah.upahBarang + upah.lembur, 0);
    const pendapatanUsaha = data.pendapatanUsaha.reduce((sum, usaha) => sum + usaha.surplus, 0);
    const produksiSendiri = data.produksiSendiri.perkiraanSewaRumah.surplus + data.produksiSendiri.hasilPertanian.surplus;
    const pendapatanKepemilikan = Object.values(data.pendapatanKepemilikan).reduce((sum, item) => sum + item.diterima, 0);
    const transferBerjalan = Object.values(data.transferBerjalan).reduce((sum, item) => sum + item.diterimaUang + item.diterimaBarang, 0);
    return {
      upahGaji: Math.round(upahGaji),
      pendapatanUsaha: Math.round(pendapatanUsaha),
      produksiSendiri: Math.round(produksiSendiri),
      pendapatanKepemilikan: Math.round(pendapatanKepemilikan),
      transferBerjalan: Math.round(transferBerjalan)
    };
  };
  const getAssetSummary = () => {
    let totalAssetUsaha = 0;
    Object.values(data.asetPerubahan.asetTetapUsaha).forEach(asset => {
      totalAssetUsaha += asset.netto;
    });
    return {
      asetTetapUsaha: Math.round(totalAssetUsaha),
      bangunanTinggal: Math.round(data.asetPerubahan.bangunanTinggal.netto),
      lahanBarang: Math.round(data.asetPerubahan.lahanBarang.netto),
      biayaPemindahan: Math.round(data.asetPerubahan.biayaPemindahan.netto)
    };
  };
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };
  const formatPercentage = (num: number) => {
    return num.toFixed(1);
  };
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const totalIncome = getTotalIncome();
  const expenseStructure = getExpenseStructure();
  const incomeBreakdown = getIncomeBreakdown();
  const assetSummary = getAssetSummary();
  return <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 border-b pb-6">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-professional-navy">
              RESUME HASIL PENDATAAN
            </h1>
            <h2 className="text-lg text-teal-600 font-bold">
              LK VSEN.KP-3210
            </h2>
            <p className="text-sm text-muted-foreground">
              Sosial-3210 | Tanggal: {currentDate}
            </p>
          </div>
          <Button onClick={recalculateImputasi} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* I. IDENTITAS RUMAH TANGGA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">I. IDENTITAS RUMAH TANGGA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div><span className="font-medium">Nama Pendata:</span> {data.namaPendata}</div>
              <div><span className="font-medium">Kecamatan:</span> {data.kecamatan}</div>
              <div><span className="font-medium">Desa/Kelurahan:</span> {data.desa}</div>
              <div><span className="font-medium">Alamat:</span> {data.alamat}</div>
            </div>
            <div className="space-y-2">
              <div><span className="font-medium">Nama Kepala Rumah Tangga:</span> {data.namaKepalaRumahTangga}</div>
              <div><span className="font-medium">Jumlah Anggota Rumah Tangga:</span> {data.jumlahAnggotaRumahTangga} orang</div>
            </div>
            <div className="col-span-full">
              <div className="font-medium mb-2">Daftar Anggota Rumah Tangga:</div>
              <div className="text-xs bg-muted p-3 rounded">
                {data.namaAnggotaRumahTangga.filter(nama => nama.trim()).map((nama, index) => `${index + 1}. ${nama}`).join(", ")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* II. REKAPITULASI PENDAPATAN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">II. REKAPITULASI PENDAPATAN RUMAH TANGGA (SETAHUN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">A. Upah dan Gaji</span>
              <span>Rp {formatNumber(incomeBreakdown.upahGaji)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">B. Pendapatan dari Usaha</span>
              <span>Rp {formatNumber(incomeBreakdown.pendapatanUsaha)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">C. Produksi Sendiri</span>
              <span>Rp {formatNumber(incomeBreakdown.produksiSendiri)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">D. Pendapatan dari Kepemilikan</span>
              <span>Rp {formatNumber(incomeBreakdown.pendapatanKepemilikan)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">E. Transfer Berjalan</span>
              <span>Rp {formatNumber(incomeBreakdown.transferBerjalan)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL PENDAPATAN</span>
              <span>Rp {formatNumber(totalIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* III. REKAPITULASI PENGELUARAN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">III. REKAPITULASI PENGELUARAN RUMAH TANGGA (SETAHUN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">A. Makanan dan Minuman</span>
              <span>Rp {formatNumber(expenseStructure.totalFood)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">B. Barang Bukan Makanan</span>
              <span>Rp {formatNumber(expenseStructure.totalNonFood)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL PENGELUARAN</span>
              <span>Rp {formatNumber(expenseStructure.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IV. STRUKTUR PENGELUARAN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">IV. STRUKTUR PENGELUARAN RUMAH TANGGA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-teal-200">
                <div className="text-xl font-bold text-primary">{formatPercentage(expenseStructure.foodPercentage)}%</div>
                <div className="text-sm">Makanan & Minuman</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-sky-300">
                <div className="text-xl font-bold text-secondary">{formatPercentage(expenseStructure.nonFoodPercentage)}%</div>
                <div className="text-sm">Barang Bukan Makanan</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* V. RINGKASAN ASET */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">V. RINGKASAN PERUBAHAN ASET</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Aset Tetap Usaha</span>
              <span>Rp {formatNumber(assetSummary.asetTetapUsaha)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Bangunan Tempat Tinggal</span>
              <span>Rp {formatNumber(assetSummary.bangunanTinggal)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Lahan dan Barang Berharga</span>
              <span>Rp {formatNumber(assetSummary.lahanBarang)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Biaya Pemindahan</span>
              <span>Rp {formatNumber(assetSummary.biayaPemindahan)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VI. INDIKATOR EKONOMI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">VI. INDIKATOR EKONOMI RUMAH TANGGA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Pendapatan per Kapita/Tahun:</span>
                <span className="font-semibold">Rp {formatNumber(Math.round(totalIncome / data.jumlahAnggotaRumahTangga))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pengeluaran per Kapita/Tahun:</span>
                <span className="font-semibold">Rp {formatNumber(Math.round(expenseStructure.total / data.jumlahAnggotaRumahTangga))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Surplus/Defisit Tahunan:</span>
                <span className={`font-semibold ${totalIncome - expenseStructure.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {formatNumber(totalIncome - expenseStructure.total)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Pendapatan per Kapita/Bulan:</span>
                <span className="font-semibold">Rp {formatNumber(Math.round(totalIncome / data.jumlahAnggotaRumahTangga / 12))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pengeluaran per Kapita/Bulan:</span>
                <span className="font-semibold">Rp {formatNumber(Math.round(expenseStructure.total / data.jumlahAnggotaRumahTangga / 12))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tingkat Tabungan:</span>
                <span className="font-semibold">
                  {formatPercentage(totalIncome > 0 ? (totalIncome - expenseStructure.total) / totalIncome * 100 : 0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-600">MANAJEMEN DATA SURVEI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleSaveData} className="flex items-center gap-2" variant="default">
              <Download className="h-4 w-4" />
              Simpan Data Survei
            </Button>
            
            <div className="relative">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadData} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" variant="outline">
                <Upload className="h-4 w-4" />
                Unggah Data Survei
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Simpan dat survei untuk backup, atau unggah file dari backup sebelumnya.</p>
            <p className="text-xs">Format file: JSON</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-2 border-t pt-6">
        <p className="text-sm font-medium">Survei Sosial Ekonomi Nasional</p>
        <p className="text-xs text-muted-foreground">
          Formulir LK VSEN.KP-3210 | Sosial-3210
        </p>
        <p className="text-xs text-muted-foreground">
          "Data akurat adalah hasil dari kerja dengan integritas tinggi."
        </p>
      </div>
    </div>;
};