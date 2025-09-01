import { SurveyData, NonFoodExpense } from "@/types/survey";
import { NON_FOOD_DETAIL_CATEGORIES } from "@/data/nonFoodDetailCategories";
import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage3Entries } from "@/utils/validationUtils";
import React from "react";
interface Page3NonFoodProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page3NonFood = ({
  data,
  updateData
}: Page3NonFoodProps) => {
  const {
    updateWithImputasi
  } = useSurveyImputasi(data, updateData);

  // Get incomplete entries for validation
  const incompleteEntries = validatePage3Entries(data);
  const updateCategoryExpense = (categoryKey: string, isMonthly: boolean, itemKey: string, expense: any) => {
    console.log(`🔄 Page3NonFood updating: ${categoryKey} ${isMonthly ? 'monthly' : 'yearly'} ${itemKey}`, expense);
    if (isMonthly) {
      const currentData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any> || {};
      updateWithImputasi({
        [`komoditi${categoryKey}Sebulan`]: {
          ...currentData,
          [itemKey]: expense
        }
      } as any);
    } else {
      updateWithImputasi({
        komoditiSetahun: {
          ...data.komoditiSetahun,
          [`${categoryKey}_yearly_${itemKey}`]: expense
        }
      });
    }
  };
  const getCurrentExpense = (categoryKey: string, isMonthly: boolean, itemKey: string) => {
    if (isMonthly) {
      const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
      return monthlyData?.[itemKey] || {
        pembelian: 0,
        produksiSendiri: 0
      };
    } else {
      return data.komoditiSetahun[`${categoryKey}_yearly_${itemKey}`] || {
        pembelian: 0,
        produksiSendiri: 0
      };
    }
  };
  const getCategoryTotal = (categoryKey: string) => {
    const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    // Calculate monthly total
    category.monthlyItems.forEach(item => {
      const expense = getCurrentExpense(categoryKey, true, item);
      if (expense && (expense.pembelian || expense.produksiSendiri)) {
        monthlyTotal += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
      }
    });

    // Calculate yearly total  
    category.yearlyItems.forEach(item => {
      const expense = getCurrentExpense(categoryKey, false, item);
      if (expense && (expense.pembelian || expense.produksiSendiri)) {
        yearlyTotal += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
      }
    });
    return {
      monthlyTotal,
      yearlyTotal
    };
  };
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };
  return <div className="max-w-none w-full space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        HALAMAN 3 - KONSUMSI DAN PENGELUARAN BARANG BUKAN MAKANAN
      </h2>
      
      <div className="grid gap-4">
        {Object.entries(NON_FOOD_DETAIL_CATEGORIES).map(([categoryKey, category]) => {
        const totals = getCategoryTotal(categoryKey);
        return <Card key={categoryKey} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <CardTitle className="text-lg flex-shrink-0 text-red-600">
                    {categoryKey}. {category.title}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4">
                    <div className="text-center lg:text-right">
                      Sebulan: <span className="font-medium">Rp {formatNumber(totals.monthlyTotal)}</span>
                    </div>
                    <div className="text-center lg:text-right font-semibold text-primary">
                      Setahun: <span className="font-medium">Rp {formatNumber(totals.yearlyTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Sebulan Terakhir */}
                  {category.monthlyItems.length > 0 && <div>
                      <h4 className="mb-3 text-violet-700 font-bold">Sebulan Terakhir</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {category.monthlyItems.map(item => <EnhancedExpenseInput key={item} label={item} value={getCurrentExpense(categoryKey, true, item)} onChange={expense => updateCategoryExpense(categoryKey, true, item, expense)} useNewCategories={true} itemKey={item} incompleteEntries={incompleteEntries} />)}
                      </div>
                    </div>}

                  {/* Setahun Terakhir */}
                  {category.yearlyItems.length > 0 && <div>
                      <h4 className="mb-3 text-violet-700 font-bold">Setahun Terakhir</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {category.yearlyItems.map(item => <EnhancedExpenseInput key={item} label={item} value={getCurrentExpense(categoryKey, false, item)} onChange={expense => updateCategoryExpense(categoryKey, false, item, expense)} useNewCategories={true} itemKey={`${categoryKey}_yearly_${item}`} incompleteEntries={incompleteEntries} />)}
                      </div>
                    </div>}
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};