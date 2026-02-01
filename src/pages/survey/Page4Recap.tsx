import { SurveyData } from "@/types/survey";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { NON_FOOD_CATEGORIES } from "@/data/nonFoodCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { 
  getNormalizedExpenseTotals, 
  getFoodCategoryTotals,
  getNonFoodMonthlyTotal,
  getNonFoodYearlyTotal
} from "@/utils/expenseNormalizer";

interface Page3RecapProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page4Recap = ({
  data,
  updateData
}: Page3RecapProps) => {
  const { recalculateImputasi } = useSurveyImputasi(data, updateData);
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Table 1: Individual member food and tobacco expenses
  // Use normalizer to handle both entries array and direct pembelian/produksiSendiri fields
  const getMemberExpenses = () => {
    return data.namaAnggotaRumahTangga.map((nama, index) => {
      const makananKey = `M_${index}`;
      const rokokKey = `N_${index}`;
      const makananExpense = data.makananMinuman[makananKey];
      const rokokExpense = data.makananMinuman[rokokKey];
      
      const makananNormalized = getNormalizedExpenseTotals(makananExpense);
      const rokokNormalized = getNormalizedExpenseTotals(rokokExpense);
      
      return {
        nama,
        makananPembelian: makananNormalized.pembelian,
        makananProduksi: makananNormalized.produksiSendiri,
        rokokPembelian: rokokNormalized.pembelian,
        rokokProduksi: rokokNormalized.produksiSendiri
      };
    });
  };

  // Table 2: Weekly food expenses summary - use normalizer for correct totals
  const getCategoryTotals = () => {
    const categories = ["Padi-Padian", "Umbi-umbian", "Ikan/Udang/cumi/kerang", "Daging", "Telur dan Susu", "Sayur-sayuran", "Kacang-kacangan", "Buah-buahan", "Minyak dan kelapa", "Bahan Minuman", "Bumbu-bumbuan", "Bahan Makanan Lainnya", "Makanan dan Minuman Jadi", "Rokok dan Tembakau"];
    
    return categories.map((categoryName, index) => {
      const categoryKey = String.fromCharCode(65 + index); // A, B, C, etc.
      const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
      
      const { totalPembelian, totalProduksiSendiri } = getFoodCategoryTotals(
        categoryKey,
        data.makananMinuman,
        category?.items || [],
        data.namaAnggotaRumahTangga
      );
      
      return {
        jenis: categoryName,
        pembelian: totalPembelian,
        produksi: totalProduksiSendiri,
        total: totalPembelian + totalProduksiSendiri
      };
    });
  };
  const memberExpenses = getMemberExpenses();
  const categoryTotals = getCategoryTotals();
  const subtotal = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
  const rataRataSebulan = subtotal * 30 / 7; // Convert weekly to monthly

  return <div className="max-w-none w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          HALAMAN 4 - REKAPITULASI PENGELUARAN
        </h2>
        <Button
          onClick={recalculateImputasi}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      {/* Table 1: Individual Member Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK IV.3.1 REKAPITULASI PENGELUARAN MAKANAN DAN MINUMAN JADI SERTA ROKOK SELURUH ANGGOTA RUMAH TANGGA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">No</th>
            <th className="border border-gray-300 p-2">Nama ART</th>
                  <th className="border border-gray-300 p-2 text-center" colSpan={2}>
                    Makanan dan Minuman Jadi
                  </th>
                  <th className="border border-gray-300 p-2 text-center" colSpan={2}>
                    Rokok dan Tembakau
                  </th>
                </tr>
                <tr className="bg-muted/50">
                  <th className="border border-gray-300 p-1"></th>
                  <th className="border border-gray-300 p-1"></th>
                  <th className="border border-gray-300 p-1 text-xs">Berasal dari Pembelian</th>
                  <th className="border border-gray-300 p-1 text-xs">Berasal dari Produksi Sendiri</th>
                  <th className="border border-gray-300 p-1 text-xs">Berasal dari Pembelian</th>
                  <th className="border border-gray-300 p-1 text-xs">Berasal dari Produksi Sendiri</th>
                </tr>
              </thead>
              <tbody>
                {memberExpenses.map((member, index) => <tr key={index}>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2">{member.nama}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(member.makananPembelian)}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(member.makananProduksi)}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(member.rokokPembelian)}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(member.rokokProduksi)}</td>
                  </tr>)}
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.makananPembelian, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.makananProduksi, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.rokokPembelian, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(memberExpenses.reduce((sum, member) => sum + member.rokokProduksi, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2: Weekly Food Expenses Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK IV.3.2 REKAPITULASI PENGELUARAN MAKANAN DAN MINUMAN JADI SERTA ROKOK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">No</th>
            <th className="border border-gray-300 p-2">Jenis Pengeluaran</th>
                  <th className="border border-gray-300 p-2">Pembelian Seminggu Terakhir</th>
                  <th className="border border-gray-300 p-2">Produksi Sendiri, Pemberian, dsb Seminggu Terakhir</th>
                  <th className="border border-gray-300 p-2">Total Seminggu Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {categoryTotals.map((category, index) => <tr key={index}>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2">{category.jenis}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(category.pembelian)}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(category.produksi)}</td>
                    <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(category.total)}</td>
                  </tr>)}
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>SUBJUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(categoryTotals.reduce((sum, cat) => sum + cat.pembelian, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(categoryTotals.reduce((sum, cat) => sum + cat.produksi, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(subtotal)}</td>
                </tr>
                <tr className="bg-primary/10 font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                    RATA-RATA PENGELUARAN MAKANAN SEBULAN
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Math.round(categoryTotals.reduce((sum, cat) => sum + cat.pembelian, 0) * 30 / 7))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Math.round(categoryTotals.reduce((sum, cat) => sum + cat.produksi, 0) * 30 / 7))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(Math.round(rataRataSebulan))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 3: Non-Food Expenses with real data connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK IV.3.3 REKAPITULASI PENGELUARAN BARANG BUKAN MAKANAN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">No</th>
            <th className="border border-gray-300 p-2">Jenis Pengeluaran</th>
                  <th className="border border-gray-300 p-2">Sebulan Terakhir</th>
                  <th className="border border-gray-300 p-2">Setahun Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(NON_FOOD_CATEGORIES).map(([categoryKey, category], index) => {
                // Calculate monthly total using normalizer for correct entries handling
                const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
                const monthlyTotal = getNonFoodMonthlyTotal(monthlyData);

                // Calculate yearly total using normalizer
                const yearlyTotal = getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
                
                return <tr key={categoryKey}>
                      <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-2">{category.title}</td>
                      <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(monthlyTotal)}</td>
                      <td className="border border-gray-300 p-2 text-right">Rp {formatNumber(yearlyTotal)}</td>
                    </tr>;
              })}
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>SUBJUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Object.keys(NON_FOOD_CATEGORIES).reduce((total, categoryKey) => {
                    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
                    return total + getNonFoodMonthlyTotal(monthlyData);
                  }, 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Object.keys(NON_FOOD_CATEGORIES).reduce((total, categoryKey) => {
                    return total + getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
                  }, 0))}
                  </td>
                </tr>
                <tr className="bg-primary/10 font-semibold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                    RATA-RATA PENGELUARAN BUKAN MAKANAN SEBULAN
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Math.round(Object.keys(NON_FOOD_CATEGORIES).reduce((totalMonthly, categoryKey) => {
                    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
                    return totalMonthly + getNonFoodMonthlyTotal(monthlyData);
                  }, 0) + Object.keys(NON_FOOD_CATEGORIES).reduce((totalYearly, categoryKey) => {
                    return totalYearly + getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
                  }, 0) / 12))}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
                <tr className="bg-secondary/20 font-semibold text-primary">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                    RATA-RATA PENGELUARAN RUMAH TANGGA SEBULAN
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(Math.round(rataRataSebulan + Object.keys(NON_FOOD_CATEGORIES).reduce((totalMonthly, categoryKey) => {
                    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
                    return totalMonthly + getNonFoodMonthlyTotal(monthlyData);
                  }, 0) + Object.keys(NON_FOOD_CATEGORIES).reduce((totalYearly, categoryKey) => {
                    return totalYearly + getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
                  }, 0) / 12))}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
};