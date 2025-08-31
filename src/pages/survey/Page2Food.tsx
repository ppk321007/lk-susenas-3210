import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { MakananMinumanJadiInput } from "@/components/MakananMinumanJadiInput";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { SurveyData, FoodExpense } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage2Entries } from "@/utils/validationUtils";
interface Page2FoodProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page2Food = ({
  data,
  updateData
}: Page2FoodProps) => {
  const {
    updateWithImputasi
  } = useSurveyImputasi(data, updateData);
  
  // Get incomplete entries for validation
  const incompleteEntries = validatePage2Entries(data);
  const updateFoodExpense = (itemKey: string, expense: FoodExpense) => {
    updateWithImputasi({
      makananMinuman: {
        ...data.makananMinuman,
        [itemKey]: expense
      }
    });
  };
  const getCategoryTotal = (categoryKey: string) => {
    const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
    let totalPembelian = 0;
    let totalProduksiSendiri = 0;
    category.items.forEach(item => {
      const key = `${categoryKey}_${item}`;
      const expense = data.makananMinuman[key];
      if (expense) {
        totalPembelian += expense.pembelian || 0;
        totalProduksiSendiri += expense.produksiSendiri || 0;
      }
    });
    return {
      totalPembelian,
      totalProduksiSendiri
    };
  };
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };
  return <div className="max-w-none w-full space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        IV.I KONSUMSI DAN PENGELUARAN BAHAN MAKANAN, BAHAN MINUMAN, DAN ROKOK SEMINGGU TERAKHIR
      </h2>
      
      <div className="grid gap-4">
        {Object.entries(FOOD_CATEGORIES).map(([categoryKey, category]) => {
        const totals = getCategoryTotal(categoryKey);
        return <Card key={categoryKey} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <CardTitle className="text-lg flex-shrink-0 text-red-600">
                    {categoryKey}. {category.title}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-4">
                    <div className="text-center lg:text-right">
                      Pembelian: <span className="font-medium">Rp {formatNumber(totals.totalPembelian)}</span>
                    </div>
                    <div className="text-center lg:text-right">
                      Produksi: <span className="font-medium">Rp {formatNumber(totals.totalProduksiSendiri)}</span>
                    </div>
                    <div className="text-center lg:text-right font-semibold text-primary">
                      Total: Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.items.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {category.items.map(item => {
                const itemKey = `${categoryKey}_${item}`;
                const currentExpense = data.makananMinuman[itemKey] || {
                  pembelian: 0,
                  produksiSendiri: 0
                };
                return <EnhancedExpenseInput 
                  key={itemKey} 
                  label={item} 
                  value={currentExpense} 
                  onChange={expense => updateFoodExpense(itemKey, expense)}
                  itemKey={itemKey}
                  incompleteEntries={incompleteEntries}
                />;
              })}
                  </div> : <MakananMinumanJadiInput data={data} updateData={updateData} categoryKey={categoryKey} categoryTitle={category.title} />}
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};