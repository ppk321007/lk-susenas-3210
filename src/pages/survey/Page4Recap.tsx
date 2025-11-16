import { SurveyData } from "@/types/survey";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { NON_FOOD_CATEGORIES } from "@/data/nonFoodCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Utensils, ShoppingCart, TrendingUp, Download } from "lucide-react";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { useState, useMemo } from "react";

interface Page4RecapProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}

interface MemberExpense {
  nama: string;
  makananPembelian: number;
  makananProduksi: number;
  rokokPembelian: number;
  rokokProduksi: number;
}

interface CategoryTotal {
  jenis: string;
  pembelian: number;
  produksi: number;
  total: number;
}

export const Page4Recap = ({
  data,
  updateData
}: Page4RecapProps) => {
  const { recalculateImputasi } = useSurveyImputasi(data, updateData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await recalculateImputasi();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Table 1: Individual member food and tobacco expenses
  const getMemberExpenses = (): MemberExpense[] => {
    return data.namaAnggotaRumahTangga.map((nama, index) => {
      const makananKey = `M_${index}`;
      const rokokKey = `N_${index}`;
      const makananExpense = data.makananMinuman[makananKey] || {
        pembelian: 0,
        produksiSendiri: 0
      };
      const rokokExpense = data.makananMinuman[rokokKey] || {
        pembelian: 0,
        produksiSendiri: 0
      };
      return {
        nama,
        makananPembelian: makananExpense.pembelian,
        makananProduksi: makananExpense.produksiSendiri,
        rokokPembelian: rokokExpense.pembelian,
        rokokProduksi: rokokExpense.produksiSendiri
      };
    });
  };

  // Table 2: Weekly food expenses summary
  const getCategoryTotals = (): CategoryTotal[] => {
    const categories = ["Padi-Padian", "Umbi-umbian", "Ikan/Udang/cumi/kerang", "Daging", "Telur dan Susu", "Sayur-sayuran", "Kacang-kacangan", "Buah-buahan", "Minyak dan kelapa", "Bahan Minuman", "Bumbu-bumbuan", "Bahan Makanan Lainnya", "Makanan dan Minuman Jadi", "Rokok dan Tembakau"];
    
    return categories.map((categoryName, index) => {
      const categoryKey = String.fromCharCode(65 + index);
      const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
      let totalPembelian = 0;
      let totalProduksi = 0;

      if (category && category.items.length > 0) {
        category.items.forEach(item => {
          const key = `${categoryKey}_${item}`;
          const expense = data.makananMinuman[key];
          if (expense) {
            totalPembelian += expense.pembelian || 0;
            totalProduksi += expense.produksiSendiri || 0;
          }
        });
      } else {
        data.namaAnggotaRumahTangga.forEach((_, memberIndex) => {
          const key = `${categoryKey}_${memberIndex}`;
          const expense = data.makananMinuman[key];
          if (expense) {
            totalPembelian += expense.pembelian || 0;
            totalProduksi += expense.produksiSendiri || 0;
          }
        });
      }

      return {
        jenis: categoryName,
        pembelian: totalPembelian,
        produksi: totalProduksi,
        total: totalPembelian + totalProduksi
      };
    });
  };

  const memberExpenses = useMemo(() => getMemberExpenses(), [data]);
  const categoryTotals = useMemo(() => getCategoryTotals(), [data]);
  
  const subtotal = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
  const rataRataSebulan = subtotal * 30 / 7;

  // Calculate non-food totals
  const getNonFoodTotals = () => {
    let totalMonthly = 0;
    let totalYearly = 0;

    Object.keys(NON_FOOD_CATEGORIES).forEach((categoryKey) => {
      const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
      if (monthlyData && typeof monthlyData === 'object') {
        totalMonthly += Object.values(monthlyData).reduce((sum, val) => {
          if (val && typeof val === 'object' && 'pembelian' in val && 'produksiSendiri' in val) {
            return sum + (val.pembelian || 0) + (val.produksiSendiri || 0);
          }
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
      }

      if (data.komoditiSetahun && typeof data.komoditiSetahun === 'object') {
        totalYearly += Object.entries(data.komoditiSetahun)
          .filter(([key]) => key.startsWith(`${categoryKey}_yearly_`))
          .reduce((sum, [, value]) => {
            if (value && typeof value === 'object') {
              const objValue = value as any;
              if ('pembelian' in objValue && 'produksiSendiri' in objValue) {
                return sum + (objValue.pembelian || 0) + (objValue.produksiSendiri || 0);
              }
            }
            return sum + (typeof value === 'number' ? value : 0);
          }, 0);
      }
    });

    return { totalMonthly, totalYearly };
  };

  const nonFoodTotals = getNonFoodTotals();
  const totalMonthlyExpense = rataRataSebulan + nonFoodTotals.totalMonthly + (nonFoodTotals.totalYearly / 12);

  // Summary statistics
  const summaryStats = [
    {
      title: "Total Anggota",
      value: memberExpenses.length,
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-700"
    },
    {
      title: "Pengeluaran Makanan/Bulan",
      value: `Rp ${formatNumber(Math.round(rataRataSebulan))}`,
      icon: Utensils,
      color: "bg-green-500",
      textColor: "text-green-700"
    },
    {
      title: "Pengeluaran Non-Makanan/Bulan",
      value: `Rp ${formatNumber(Math.round(nonFoodTotals.totalMonthly + (nonFoodTotals.totalYearly / 12)))}`,
      icon: ShoppingCart,
      color: "bg-orange-500",
      textColor: "text-orange-700"
    },
    {
      title: "Total Pengeluaran/Bulan",
      value: `Rp ${formatNumber(Math.round(totalMonthlyExpense))}`,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">HALAMAN 4 - REKAPITULASI PENGELUARAN</h1>
                  <p className="text-lg text-blue-600 font-semibold">Ringkasan Lengkap Pengeluaran Rumah Tangga</p>
                </div>
              </div>
              <p className="text-slate-600">Analisis detail pengeluaran makanan dan barang bukan makanan</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Memproses...' : 'Refresh Data'}
              </Button>
              <Button className="flex items-center gap-2" size="sm">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryStats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table 1: Individual Member Expenses */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
            <CardTitle className="text-lg text-white flex items-center gap-3">
              <Users className="h-5 w-5" />
              BLOK IV.3.1 - PENGELUARAN MAKANAN & ROKOK PER ANGGOTA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-700">No</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Nama ART</th>
                    <th className="text-center p-4 font-semibold text-slate-700" colSpan={2}>
                      Makanan & Minuman Jadi
                    </th>
                    <th className="text-center p-4 font-semibold text-slate-700" colSpan={2}>
                      Rokok & Tembakau
                    </th>
                  </tr>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-3"></th>
                    <th className="p-3"></th>
                    <th className="p-3 text-xs font-medium text-slate-600 text-center">Pembelian</th>
                    <th className="p-3 text-xs font-medium text-slate-600 text-center">Produksi Sendiri</th>
                    <th className="p-3 text-xs font-medium text-slate-600 text-center">Pembelian</th>
                    <th className="p-3 text-xs font-medium text-slate-600 text-center">Produksi Sendiri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {memberExpenses.map((member, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center text-slate-600 font-medium">{index + 1}</td>
                      <td className="p-4 font-medium text-slate-800">{member.nama}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(member.makananPembelian)}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(member.makananProduksi)}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(member.rokokPembelian)}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(member.rokokProduksi)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                    <td className="p-4 text-center text-blue-800" colSpan={2}>JUMLAH</td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.makananPembelian, 0))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.makananProduksi, 0))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.rokokPembelian, 0))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.rokokProduksi, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Table 2: Weekly Food Expenses Summary */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700">
            <CardTitle className="text-lg text-white flex items-center gap-3">
              <Utensils className="h-5 w-5" />
              BLOK IV.3.2 - REKAP PENGELUARAN MAKANAN & MINUMAN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-700">No</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Jenis Pengeluaran</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Pembelian (Minggu)</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Produksi Sendiri (Minggu)</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Total (Minggu)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categoryTotals.map((category, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors even:bg-slate-50">
                      <td className="p-4 text-center text-slate-600 font-medium">{index + 1}</td>
                      <td className="p-4 font-medium text-slate-800">{category.jenis}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(category.pembelian)}</td>
                      <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(category.produksi)}</td>
                      <td className="p-4 text-right font-mono text-slate-700 font-semibold">Rp {formatNumber(category.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-semibold border-t-2 border-green-200">
                    <td className="p-4 text-center text-green-800" colSpan={2}>SUBJUMLAH</td>
                    <td className="p-4 text-right font-mono text-green-800">
                      Rp {formatNumber(categoryTotals.reduce((sum, cat) => sum + cat.pembelian, 0))}
                    </td>
                    <td className="p-4 text-right font-mono text-green-800">
                      Rp {formatNumber(categoryTotals.reduce((sum, cat) => sum + cat.produksi, 0))}
                    </td>
                    <td className="p-4 text-right font-mono text-green-800">Rp {formatNumber(subtotal)}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold border-t border-blue-200">
                    <td className="p-4 text-center text-blue-800" colSpan={2}>
                      RATA-RATA PENGELUARAN MAKANAN SEBULAN
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(Math.round(categoryTotals.reduce((sum, cat) => sum + cat.pembelian, 0) * 30 / 7))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(Math.round(categoryTotals.reduce((sum, cat) => sum + cat.produksi, 0) * 30 / 7))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">Rp {formatNumber(Math.round(rataRataSebulan))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Table 3: Non-Food Expenses */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700">
            <CardTitle className="text-lg text-white flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              BLOK IV.3.3 - PENGELUARAN BARANG BUKAN MAKANAN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-700">No</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Jenis Pengeluaran</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Sebulan Terakhir</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Setahun Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(NON_FOOD_CATEGORIES).map(([categoryKey, category], index) => {
                    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
                    let monthlyTotal = 0;
                    if (monthlyData && typeof monthlyData === 'object') {
                      monthlyTotal = Object.values(monthlyData).reduce((sum, val) => {
                        if (val && typeof val === 'object' && 'pembelian' in val && 'produksiSendiri' in val) {
                          return sum + (val.pembelian || 0) + (val.produksiSendiri || 0);
                        }
                        return sum + (typeof val === 'number' ? val : 0);
                      }, 0);
                    }

                    let yearlyTotal = 0;
                    if (data.komoditiSetahun && typeof data.komoditiSetahun === 'object') {
                      yearlyTotal = Object.entries(data.komoditiSetahun)
                        .filter(([key]) => key.startsWith(`${categoryKey}_yearly_`))
                        .reduce((sum, [, value]) => {
                          if (value && typeof value === 'object') {
                            const objValue = value as any;
                            if ('pembelian' in objValue && 'produksiSendiri' in objValue) {
                              return sum + (objValue.pembelian || 0) + (objValue.produksiSendiri || 0);
                            }
                          }
                          return sum + (typeof value === 'number' ? value : 0);
                        }, 0);
                    }

                    return (
                      <tr key={categoryKey} className="hover:bg-slate-50 transition-colors even:bg-slate-50">
                        <td className="p-4 text-center text-slate-600 font-medium">{index + 1}</td>
                        <td className="p-4 font-medium text-slate-800">{category.title}</td>
                        <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(monthlyTotal)}</td>
                        <td className="p-4 text-right font-mono text-slate-700">Rp {formatNumber(yearlyTotal)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-orange-50 font-semibold border-t-2 border-orange-200">
                    <td className="p-4 text-center text-orange-800" colSpan={2}>SUBJUMLAH</td>
                    <td className="p-4 text-right font-mono text-orange-800">Rp {formatNumber(nonFoodTotals.totalMonthly)}</td>
                    <td className="p-4 text-right font-mono text-orange-800">Rp {formatNumber(nonFoodTotals.totalYearly)}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold border-t border-blue-200">
                    <td className="p-4 text-center text-blue-800" colSpan={2}>
                      RATA-RATA PENGELUARAN BUKAN MAKANAN SEBULAN
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800">
                      Rp {formatNumber(Math.round(nonFoodTotals.totalMonthly + (nonFoodTotals.totalYearly / 12)))}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800"></td>
                  </tr>
                  <tr className="bg-purple-50 font-semibold border-t-2 border-purple-200">
                    <td className="p-4 text-center text-purple-800" colSpan={2}>
                      TOTAL PENGELUARAN RUMAH TANGGA SEBULAN
                    </td>
                    <td className="p-4 text-right font-mono text-purple-800 text-lg">
                      Rp {formatNumber(Math.round(totalMonthlyExpense))}
                    </td>
                    <td className="p-4 text-right font-mono text-purple-800"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};