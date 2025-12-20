import { SurveyData, NonFoodExpense } from "@/types/survey";
import { NON_FOOD_DETAIL_CATEGORIES } from "@/data/nonFoodDetailCategories";
import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage3Entries } from "@/utils/validationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, SkipForward, Calendar, Clock } from "lucide-react";
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

  // Fungsi helper untuk mengecek apakah item incomplete
  const isItemIncomplete = (itemKey: string) => {
    return incompleteEntries.some(entry => entry.itemKey === itemKey);
  };

  // Fungsi helper untuk mendapatkan expense
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
  }, [data]);

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
  }, [data]);

  // Hitung jumlah kategori yang terisi (minimal 1 item terisi)
  const completedCategories = useMemo(() => {
    return Object.values(categoryProgress).filter(p => p.completed > 0).length;
  }, [categoryProgress]);

  // Progress untuk progress bar (x/19, maksimal 100%)
  const progressBarValue = useMemo(() => {
    const completed = Math.min(completedCategories, 19);
    return Math.round((completed / 19) * 100);
  }, [completedCategories]);

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

  // Helper untuk mendapatkan warna background berdasarkan index
  const getBackgroundColorClass = (index: number) => {
    return index % 2 === 0 ? 'bg-blue-50/50' : 'bg-orange-50/50';
  };

  // Get all category keys
  const categoryKeys = Object.keys(NON_FOOD_DETAIL_CATEGORIES);

  return (
    <div className="max-w-none w-full space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            HALAMAN 3 - KONSUMSI DAN PENGELUARAN BARANG BUKAN MAKANAN
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk barang bukan makanan (sebulan dan setahun terakhir)
          </p>
        </div>
      </div>

      {/* Progress Bar dengan x/19 */}
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">
            Progress: {Math.min(completedCategories, 19)}/19 kategori
          </div>
          <div className="text-sm font-medium text-purple-600">
            {progressBarValue}%
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${progressBarValue}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Kategori A sampai F yang telah terisi
        </div>
      </div>

      {/* Progress Header - Desktop Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm">
              <div className="font-medium">Halaman 3 - Barang Bukan Makanan</div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={navigateToPrevTab}
                disabled={activeTab === categoryKeys[0]}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              
              <div className="text-sm px-2 py-1 bg-white rounded border">
                Kategori {activeTab}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={navigateToNextTab}
                disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
                className="flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium">
            Total: Rp {formatNumber(overallTotal.monthlyTotal + overallTotal.yearlyTotal)}
          </div>
          <div className="text-xs text-gray-500">Sebulan & Setahun</div>
        </div>
      </div>

      {/* Category Navigation Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categoryKeys.map(key => {
          const progress = categoryProgress[key];
          const isActive = activeTab === key;
          const isComplete = progress.percentage === 100;
          const hasData = progress.percentage > 0;
          
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1 h-8 ${
                !isActive && isComplete 
                  ? "border-green-400 text-green-700 bg-green-50 hover:bg-green-100" 
                  : !isActive && hasData
                  ? "border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                  : ""
              }`}
            >
              {isComplete && <CheckCircle2 className="h-3 w-3 mr-1" />}
              Kategori {key}
            </Button>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          {categoryKeys.map(key => (
            <TabsTrigger key={key} value={key} />
          ))}
        </TabsList>

        {categoryKeys.map(categoryKey => {
          const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];
          const totals = getCategoryTotal(categoryKey);
          const progress = categoryProgress[categoryKey];
          
          return (
            <TabsContent 
              key={categoryKey} 
              value={categoryKey} 
              className="space-y-4"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base">
                          <span className="text-red-600">Kategori {categoryKey}:</span> {category.title}
                        </CardTitle>
                        
                        {progress.percentage < 100 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => skipCategory(categoryKey)}
                          >
                            <SkipForward className="h-3 w-3 mr-1" />
                            Lewati Kategori
                          </Badge>
                        )}
                      </div>
                      
                      {/* Category Summary */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Sebulan
                          </div>
                          <div className="text-sm font-semibold">Rp {formatNumber(totals.monthlyTotal)}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Setahun
                          </div>
                          <div className="text-sm font-semibold">Rp {formatNumber(totals.yearlyTotal)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reset Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => resetCategory(categoryKey)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Kategori
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Sebulan Terakhir */}
                    {category.monthlyItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-4 w-1 bg-blue-500 rounded"></div>
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sebulan Terakhir
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {category.monthlyItems.map((item, index) => {
                            const currentExpense = getCurrentExpense(categoryKey, true, item);
                            const itemKey = `${categoryKey}_monthly_${item}`;
                            const isIncomplete = isItemIncomplete(itemKey);
                            
                            return (
                              <div 
                                key={item}
                                className={`p-3 border rounded-lg ${getBackgroundColorClass(index)} ${
                                  isIncomplete
                                    ? 'border-red-300 border-2' 
                                    : 'border-gray-200'
                                }`}
                              >
                                <EnhancedExpenseInput
                                  label={item}
                                  value={currentExpense}
                                  onChange={expense => updateCategoryExpense(categoryKey, true, item, expense)}
                                  useNewCategories={true}
                                  itemKey={item}
                                  incompleteEntries={incompleteEntries}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Setahun Terakhir */}
                    {category.yearlyItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-4 w-1 bg-green-500 rounded"></div>
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Setahun Terakhir
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {category.yearlyItems.map((item, index) => {
                            const currentExpense = getCurrentExpense(categoryKey, false, item);
                            const itemKey = `${categoryKey}_yearly_${item}`;
                            const isIncomplete = isItemIncomplete(itemKey);
                            
                            return (
                              <div 
                                key={item}
                                className={`p-3 border rounded-lg ${getBackgroundColorClass(index)} ${
                                  isIncomplete
                                    ? 'border-red-300 border-2' 
                                    : 'border-gray-200'
                                }`}
                              >
                                <EnhancedExpenseInput
                                  label={item}
                                  value={currentExpense}
                                  onChange={expense => updateCategoryExpense(categoryKey, false, item, expense)}
                                  useNewCategories={true}
                                  itemKey={itemKey}
                                  incompleteEntries={incompleteEntries}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Navigation Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  onClick={navigateToPrevTab}
                  disabled={activeTab === categoryKeys[0]}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kategori Sebelumnya
                </Button>
                
                <div className="text-xs text-center text-gray-500">
                  <div>Kategori {categoryKey} • {progress.completed}/{progress.total} item terisi</div>
                  <div className="font-medium text-sm">
                    Total Kategori: Rp {formatNumber(totals.monthlyTotal + totals.yearlyTotal)}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={navigateToNextTab}
                  disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
                  className="w-full sm:w-auto"
                >
                  Kategori Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};