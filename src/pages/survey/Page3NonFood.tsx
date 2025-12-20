import { SurveyData, NonFoodExpense } from "@/types/survey";
import { NON_FOOD_DETAIL_CATEGORIES } from "@/data/nonFoodDetailCategories";
import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage3Entries } from "@/utils/validationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, BarChart3, SkipForward, Calendar, Clock } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState<string>("1");
  const incompleteEntries = validatePage3Entries(data);

  // Pindahkan getCurrentExpense ke sini sebelum useMemo
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

  // Hitung progress per kategori
  const categoryProgress = useMemo(() => {
    const progress: Record<string, {
      completed: number;
      total: number;
      percentage: number;
    }> = {};
    Object.entries(NON_FOOD_DETAIL_CATEGORIES).forEach(([categoryKey, category]) => {
      let completed = 0;
      let total = category.monthlyItems.length + category.yearlyItems.length;

      // Check monthly items
      category.monthlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, true, item);
        if (expense && (expense.pembelian > 0 || expense.produksiSendiri > 0)) {
          completed++;
        }
      });

      // Check yearly items
      category.yearlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, false, item);
        if (expense && (expense.pembelian > 0 || expense.produksiSendiri > 0)) {
          completed++;
        }
      });
      progress[categoryKey] = {
        completed,
        total,
        percentage: total > 0 ? Math.round(completed / total * 100) : 0
      };
    });
    return progress;
  }, [data, getCurrentExpense]); // Tambahkan getCurrentExpense ke dependency array

  // Hitung total keseluruhan
  const overallTotal = useMemo(() => {
    let monthlyTotal = 0;
    let yearlyTotal = 0;
    Object.keys(NON_FOOD_DETAIL_CATEGORIES).forEach(categoryKey => {
      const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];

      // Monthly items
      category.monthlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, true, item);
        if (expense) {
          monthlyTotal += expense.pembelian || 0;
          monthlyTotal += expense.produksiSendiri || 0;
        }
      });

      // Yearly items
      category.yearlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, false, item);
        if (expense) {
          yearlyTotal += expense.pembelian || 0;
          yearlyTotal += expense.produksiSendiri || 0;
        }
      });
    });
    return {
      monthlyTotal,
      yearlyTotal
    };
  }, [data, getCurrentExpense]); // Tambahkan getCurrentExpense ke dependency array

  const updateCategoryExpense = (categoryKey: string, isMonthly: boolean, itemKey: string, expense: any) => {
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
  const skipCategory = (categoryKey: string) => {
    const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];
    const updates: any = {};

    // Reset monthly items
    if (category.monthlyItems.length > 0) {
      const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any> || {};
      const newMonthlyData = {
        ...monthlyData
      };
      category.monthlyItems.forEach(item => {
        newMonthlyData[item] = {
          pembelian: 0,
          produksiSendiri: 0
        };
      });
      updates[`komoditi${categoryKey}Sebulan`] = newMonthlyData;
    }

    // Reset yearly items
    if (category.yearlyItems.length > 0) {
      const newYearlyData = {
        ...data.komoditiSetahun
      };
      category.yearlyItems.forEach(item => {
        newYearlyData[`${categoryKey}_yearly_${item}`] = {
          pembelian: 0,
          produksiSendiri: 0
        };
      });
      updates.komoditiSetahun = newYearlyData;
    }
    updateWithImputasi(updates);
  };
  const resetCategory = (categoryKey: string) => {
    skipCategory(categoryKey); // Same functionality for now
  };
  const getCategoryTotal = (categoryKey: string) => {
    const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    // Calculate monthly total
    category.monthlyItems.forEach(item => {
      const expense = getCurrentExpense(categoryKey, true, item);
      if (expense) {
        monthlyTotal += (expense.pembelian || 0) + (expense.produksiSendiri || 0);
      }
    });

    // Calculate yearly total  
    category.yearlyItems.forEach(item => {
      const expense = getCurrentExpense(categoryKey, false, item);
      if (expense) {
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
  const getCompletionStatus = (percentage: number) => {
    if (percentage === 100) return "complete";
    if (percentage >= 50) return "partial";
    return "empty";
  };
  const navigateToNextTab = () => {
    const categoryKeys = Object.keys(NON_FOOD_DETAIL_CATEGORIES);
    const currentIndex = categoryKeys.indexOf(activeTab);
    if (currentIndex < categoryKeys.length - 1) {
      setActiveTab(categoryKeys[currentIndex + 1]);
    }
  };
  const navigateToPrevTab = () => {
    const categoryKeys = Object.keys(NON_FOOD_DETAIL_CATEGORIES);
    const currentIndex = categoryKeys.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(categoryKeys[currentIndex - 1]);
    }
  };
  const getCompletionColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };
  return <div className="max-w-none w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            HALAMAN 3 - KONSUMSI DAN PENGELUARAN BARANG BUKAN MAKANAN
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk barang bukan makanan (sebulan dan setahun terakhir)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateToPrevTab}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToNextTab}>
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Total Keseluruhan</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Calendar className="h-4 w-4" />
                Sebulan: <strong>Rp {formatNumber(overallTotal.monthlyTotal)}</strong>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Clock className="h-4 w-4" />
                Setahun: <strong>Rp {formatNumber(overallTotal.yearlyTotal)}</strong>
              </div>
              <div className="text-lg font-bold text-purple-900">
                Grand Total: Rp {formatNumber(overallTotal.monthlyTotal + overallTotal.yearlyTotal)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview - Compact */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(categoryProgress).map(([categoryKey, progress]) => (
          <Button 
            key={categoryKey} 
            variant={activeTab === categoryKey ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab(categoryKey)} 
            className={`text-xs px-3 py-1 h-8 ${activeTab !== categoryKey && (progress.percentage === 100 ? "border-green-400 text-green-700 bg-green-50" : progress.percentage >= 50 ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "border-gray-300")}`}
          >
            {progress.percentage === 100 ? <CheckCircle2 className="h-3 w-3 mr-1" /> : progress.percentage > 0 ? <AlertCircle className="h-3 w-3 mr-1" /> : null}
            Kategori {categoryKey}
          </Button>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-6 h-auto">
          {Object.entries(NON_FOOD_DETAIL_CATEGORIES).map(([categoryKey, category]) => {
          const progress = categoryProgress[categoryKey];
          const status = getCompletionStatus(progress.percentage);
          return <TabsTrigger key={categoryKey} value={categoryKey} className="relative py-2 text-xs">
                {categoryKey}
                <Badge variant={status === "complete" ? "default" : "secondary"} className={`ml-1 h-3 w-3 p-0 text-[8px] ${status === "complete" ? "bg-green-500" : status === "partial" ? "bg-yellow-500" : "bg-gray-300"}`}>
                  {progress.completed}
                </Badge>
              </TabsTrigger>;
        })}
        </TabsList>

        {Object.entries(NON_FOOD_DETAIL_CATEGORIES).map(([categoryKey, category]) => {
        const totals = getCategoryTotal(categoryKey);
        const progress = categoryProgress[categoryKey];
        return <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-red-600">
                          {categoryKey}. {category.title}
                        </CardTitle>
                        
                      </div>
                      
                      {/* Category Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Sebulan
                          </div>
                          <div className="font-semibold text-sm">Rp {formatNumber(totals.monthlyTotal)}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Setahun
                          </div>
                          <div className="font-semibold text-sm text-primary">
                            Rp {formatNumber(totals.yearlyTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => skipCategory(categoryKey)} className="flex items-center gap-1" disabled={progress.percentage === 100}>
                        <SkipForward className="h-4 w-4" />
                        Lewati
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => resetCategory(categoryKey)} className="flex items-center gap-1">
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-6">
                    {/* Sebulan Terakhir */}
                    {category.monthlyItems.length > 0 && <div>
                        <h4 className="mb-3 text-violet-700 font-bold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Sebulan Terakhir
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {category.monthlyItems.map(item => <EnhancedExpenseInput key={item} label={item} value={getCurrentExpense(categoryKey, true, item)} onChange={expense => updateCategoryExpense(categoryKey, true, item, expense)} useNewCategories={true} itemKey={item} incompleteEntries={incompleteEntries} />)}
                        </div>
                      </div>}

                    {/* Setahun Terakhir */}
                    {category.yearlyItems.length > 0 && <div>
                        <h4 className="mb-3 text-violet-700 font-bold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Setahun Terakhir
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {category.yearlyItems.map(item => <EnhancedExpenseInput key={item} label={item} value={getCurrentExpense(categoryKey, false, item)} onChange={expense => updateCategoryExpense(categoryKey, false, item, expense)} useNewCategories={true} itemKey={`${categoryKey}_yearly_${item}`} incompleteEntries={incompleteEntries} />)}
                        </div>
                      </div>}
                  </div>
                </CardContent>
              </Card>
              
              {/* Navigation Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                <Button variant="outline" onClick={navigateToPrevTab} disabled={activeTab === Object.keys(NON_FOOD_DETAIL_CATEGORIES)[0]} className="w-full sm:w-auto">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kategori Sebelumnya
                </Button>
                
                <div className="text-sm text-muted-foreground text-center">
                  <div>Kategori {activeTab} • {progress.completed} dari {progress.total} item terisi</div>
                  <div className="text-xs">
                    Total: Rp {formatNumber(totals.monthlyTotal + totals.yearlyTotal)}
                  </div>
                </div>
                
                <Button variant="outline" onClick={navigateToNextTab} disabled={activeTab === Object.keys(NON_FOOD_DETAIL_CATEGORIES)[Object.keys(NON_FOOD_DETAIL_CATEGORIES).length - 1]} className="w-full sm:w-auto">
                  Kategori Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>;
      })}
      </Tabs>
    </div>;
};