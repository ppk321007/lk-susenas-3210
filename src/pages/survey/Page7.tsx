import { SurveyData } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw, User, Home, TrendingUp, PieChart, BarChart3, Wallet, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { ValidationWarning } from "@/components/ValidationWarning";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FOOD_CATEGORIES } from "@/data/foodCategories";

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTotalFoodExpenses = () => {
    let weeklyTotal = 0;
    Object.values(data.makananMinuman).forEach(expense => {
      weeklyTotal += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
    });
    const annual = weeklyTotal * (30 / 7) * 12;
    return Math.round(annual);
  };

  const getTotalNonFoodExpenses = () => {
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
    data.pendapatanUpah.forEach(upah => {
      total += upah.upahUang + upah.upahBarang + upah.lembur;
    });
    data.pendapatanUsaha.forEach(usaha => {
      total += usaha.surplus;
    });
    total += data.produksiSendiri.perkiraanSewaRumah.surplus;
    total += data.produksiSendiri.hasilPertanian.surplus;
    Object.values(data.pendapatanKepemilikan).forEach(item => {
      total += item.diterima;
    });
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

  const getFoodItemCount = () => {
    let count = 0;
    Object.values(data.makananMinuman).forEach(expense => {
      const total = (expense.pembelian || 0) + (expense.produksiSendiri || 0);
      if (total > 0) count++;
    });
    return count;
  };

  const getNonFoodItemCount = () => {
    let count = 0;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(categoryKey => {
      const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
      if (monthlyData) {
        Object.values(monthlyData).forEach((expense: any) => {
          if (expense) {
            const total = (expense.pembelian || 0) + (expense.produksiSendiri || 0);
            if (total > 0) count++;
          }
        });
      }
    });
    Object.values(data.komoditiSetahun).forEach((expense: any) => {
      if (expense) {
        const total = (expense.pembelian || 0) + (expense.produksiSendiri || 0);
        if (total > 0) count++;
      }
    });
    return count;
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
  const foodItemCount = getFoodItemCount();
  const nonFoodItemCount = getNonFoodItemCount();
  const totalExpenses = expenseStructure.total;
  const surplusDeficit = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (surplusDeficit / totalIncome) * 100 : 0;

  const warnings: string[] = [];
  if (foodItemCount < 13) {
    warnings.push(`Kategori Makanan dan Minuman hanya terisi ${foodItemCount} item (kondisi ideal 13 item)`);
  }
  if (nonFoodItemCount < 19) {
    warnings.push(`Kategori Barang Bukan Makanan hanya terisi ${nonFoodItemCount} item (kondisi ideal 19 item)`);
  }

  const getFinancialHealth = () => {
    if (savingsRate >= 20) return { status: "Excellent", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (savingsRate >= 10) return { status: "Good", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    if (savingsRate >= 0) return { status: "Fair", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    return { status: "At Risk", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  };

  const financialHealth = getFinancialHealth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header dengan Dashboard Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">RESUME HASIL PENDATAAN</h1>
                  <p className="text-lg text-blue-600 font-semibold">LK VSEN.KP-3210 • Sosial-3210</p>
                </div>
              </div>
              <p className="text-slate-600">Tanggal: {currentDate}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={recalculateImputasi} variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleSaveData} className="flex items-center gap-2" size="sm">
                  <Download className="h-4 w-4" />
                  Simpan
                </Button>
                <div className="relative">
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadData} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" variant="outline" size="sm">
                    <Upload className="h-4 w-4" />
                    Unggah
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">TOTAL PENDAPATAN</span>
              </div>
              <div className="text-2xl font-bold text-green-900">Rp {formatNumber(totalIncome)}</div>
              <div className="text-xs text-green-700 mt-1">Per Tahun</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <PieChart className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">TOTAL PENGELUARAN</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">Rp {formatNumber(totalExpenses)}</div>
              <div className="text-xs text-orange-700 mt-1">Per Tahun</div>
            </div>

            <div className={`bg-gradient-to-br ${surplusDeficit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-red-50 to-red-100 border-red-200'} rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className={`h-5 w-5 ${surplusDeficit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                <span className={`text-sm font-semibold ${surplusDeficit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {surplusDeficit >= 0 ? 'SURPLUS' : 'DEFISIT'}
                </span>
              </div>
              <div className={`text-2xl font-bold ${surplusDeficit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                Rp {formatNumber(Math.abs(surplusDeficit))}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {savingsRate >= 0 ? `Tabungan: ${formatPercentage(savingsRate)}%` : 'Pengeluaran melebihi pendapatan'}
              </div>
            </div>

            <div className={`${financialHealth.bg} border ${financialHealth.border} rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`h-5 w-5 ${financialHealth.color}`} />
                <span className={`text-sm font-semibold ${financialHealth.color}`}>KESEHATAN KEUANGAN</span>
              </div>
              <div className={`text-xl font-bold ${financialHealth.color}`}>{financialHealth.status}</div>
              <div className="text-xs text-slate-600 mt-1">
                Tingkat tabungan {formatPercentage(Math.abs(savingsRate))}%
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Kelengkapan Data Makanan</span>
                <Badge variant={foodItemCount >= 13 ? "default" : "secondary"}>
                  {foodItemCount}/13 item
                </Badge>
              </div>
              <Progress value={(foodItemCount / 13) * 100} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Kelengkapan Data Non-Makanan</span>
                <Badge variant={nonFoodItemCount >= 19 ? "default" : "secondary"}>
                  {nonFoodItemCount}/19 item
                </Badge>
              </div>
              <Progress value={(nonFoodItemCount / 19) * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-8">
            {/* Identitas Rumah Tangga */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <User className="h-5 w-5" />
                  IDENTITAS RUMAH TANGGA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Nama Pendata</label>
                      <p className="font-semibold text-slate-800">{data.namaPendata}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Kecamatan</label>
                      <p className="font-semibold text-slate-800">{data.kecamatan}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Alamat SLS</label>
                      <p className="font-semibold text-slate-800">{data.alamat}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Nama Kepala Rumah Tangga</label>
                      <p className="font-semibold text-slate-800">{data.namaKepalaRumahTangga}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Desa/Kelurahan</label>
                      <p className="font-semibold text-slate-800">{data.desa}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Jumlah Anggota</label>
                      <p className="font-semibold text-slate-800">{data.jumlahAnggotaRumahTangga} orang</p>
                    </div>
                  </div>
                </div>
                
                {data.namaAnggotaRumahTangga.filter(nama => nama.trim()).length > 0 && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-slate-500 mb-3 block">Daftar Anggota Rumah Tangga</label>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {data.namaAnggotaRumahTangga.filter(nama => nama.trim()).map((nama, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <span className="text-slate-700">{nama}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rekapitulasi Pendapatan & Pengeluaran */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pendapatan */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <TrendingUp className="h-5 w-5" />
                    REKAP PENDAPATAN
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { label: "Upah dan Gaji", value: incomeBreakdown.upahGaji, color: "text-green-600" },
                      { label: "Pendapatan Usaha", value: incomeBreakdown.pendapatanUsaha, color: "text-blue-600" },
                      { label: "Produksi Sendiri", value: incomeBreakdown.produksiSendiri, color: "text-purple-600" },
                      { label: "Pendapatan Kepemilikan", value: incomeBreakdown.pendapatanKepemilikan, color: "text-orange-600" },
                      { label: "Transfer Berjalan", value: incomeBreakdown.transferBerjalan, color: "text-pink-600" },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>Rp {formatNumber(item.value)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-slate-800">TOTAL PENDAPATAN</span>
                      <span className="text-xl font-bold text-green-700">Rp {formatNumber(totalIncome)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pengeluaran */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-orange-800">
                    <PieChart className="h-5 w-5" />
                    REKAP PENGELUARAN
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ValidationWarning warnings={warnings} />
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <span className="text-sm text-slate-600">Makanan & Minuman</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={foodItemCount >= 13 ? "default" : "secondary"} className="text-xs">
                              {foodItemCount} item
                            </Badge>
                            {foodItemCount >= 13 ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-orange-600">Rp {formatNumber(expenseStructure.totalFood)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <span className="text-sm text-slate-600">Barang Bukan Makanan</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={nonFoodItemCount >= 19 ? "default" : "secondary"} className="text-xs">
                              {nonFoodItemCount} item
                            </Badge>
                            {nonFoodItemCount >= 19 ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-red-600">Rp {formatNumber(expenseStructure.totalNonFood)}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-slate-800">TOTAL PENGELUARAN</span>
                      <span className="text-xl font-bold text-red-700">Rp {formatNumber(totalExpenses)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Struktur Pengeluaran */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                <CardTitle className="flex items-center gap-3 text-purple-800">
                  <PieChart className="h-5 w-5" />
                  STRUKTUR PENGELUARAN
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200 to-red-200"></div>
                      <div 
                        className="absolute inset-2 rounded-full bg-gradient-to-br from-green-200 to-emerald-200"
                        style={{ 
                          clipPath: `conic-gradient(from 0deg, #10b981 0% ${expenseStructure.foodPercentage}%, transparent ${expenseStructure.foodPercentage}% 100%)` 
                        }}
                      ></div>
                      <div className="absolute inset-4 rounded-full bg-white"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-800">
                          {formatPercentage(expenseStructure.foodPercentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="w-4 h-4 bg-green-400 rounded mx-auto mb-1"></div>
                        <div className="text-xs text-slate-600">Makanan</div>
                        <div className="text-sm font-semibold">{formatPercentage(expenseStructure.foodPercentage)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="w-4 h-4 bg-orange-400 rounded mx-auto mb-1"></div>
                        <div className="text-xs text-slate-600">Non-Makanan</div>
                        <div className="text-sm font-semibold">{formatPercentage(expenseStructure.nonFoodPercentage)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indikator Ekonomi */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <BarChart3 className="h-5 w-5" />
                  INDIKATOR EKONOMI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { label: "Pendapatan per Kapita/Tahun", value: Math.round(totalIncome / data.jumlahAnggotaRumahTangga) },
                    { label: "Pengeluaran per Kapita/Tahun", value: Math.round(totalExpenses / data.jumlahAnggotaRumahTangga) },
                    { label: "Pendapatan per Kapita/Bulan", value: Math.round(totalIncome / data.jumlahAnggotaRumahTangga / 12) },
                    { label: "Pengeluaran per Kapita/Bulan", value: Math.round(totalExpenses / data.jumlahAnggotaRumahTangga / 12) },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-800">Rp {formatNumber(item.value)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium text-slate-700">Tingkat Tabungan</span>
                    <span className={`text-sm font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(Math.abs(savingsRate))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ringkasan Aset */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                <CardTitle className="flex items-center gap-3 text-amber-800">
                  <Home className="h-5 w-5" />
                  RINGKASAN ASET
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[
                    { label: "Aset Tetap Usaha", value: assetSummary.asetTetapUsaha },
                    { label: "Bangunan Tempat Tinggal", value: assetSummary.bangunanTinggal },
                    { label: "Lahan dan Barang Berharga", value: assetSummary.lahanBarang },
                    { label: "Biaya Pemindahan", value: assetSummary.biayaPemindahan },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold text-amber-700">Rp {formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 border-t border-slate-200 pt-8">
          <p className="text-sm font-medium text-slate-700">Survei Sosial Ekonomi Nasional</p>
          <p className="text-xs text-slate-500">
            Formulir LK VSEN.KP-3210 | Sosial-3210
          </p>
          <p className="text-xs text-slate-400">
            "Data yang akurat membangun kebijakan yang tepat"
          </p>
        </div>
      </div>
    </div>
  );
};