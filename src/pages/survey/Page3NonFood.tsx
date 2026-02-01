import { SurveyData, NonFoodExpense } from "@/types/survey";
import { NON_FOOD_DETAIL_CATEGORIES } from "@/data/nonFoodDetailCategories";
import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage3Entries } from "@/utils/validationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, BarChart3, SkipForward, Calendar, Clock } from "lucide-react";
import { useState, useMemo } from "react";

interface Page3NonFoodProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}

// Warna latar belakang yang lebih kontras untuk setiap item (monthly)
const MONTHLY_COLORS = [
  'bg-blue-100/80',
  'bg-cyan-100/80',
  'bg-sky-100/80',
  'bg-indigo-100/80',
  'bg-violet-100/80',
  'bg-blue-200/80',
  'bg-cyan-200/80',
  'bg-sky-200/80',
  'bg-indigo-200/80',
  'bg-violet-200/80',
];

// Warna latar belakang yang lebih kontras untuk setiap item (yearly)
const YEARLY_COLORS = [
  'bg-green-100/80',
  'bg-emerald-100/80',
  'bg-teal-100/80',
  'bg-lime-100/80',
  'bg-amber-100/80',
  'bg-green-200/80',
  'bg-emerald-200/80',
  'bg-teal-200/80',
  'bg-lime-200/80',
  'bg-amber-200/80',
];

// Atau alternatif dengan gradien untuk lebih kontras:
// const MONTHLY_COLORS = [
//   'bg-gradient-to-r from-blue-50 to-blue-100',
//   'bg-gradient-to-r from-cyan-50 to-cyan-100',
//   'bg-gradient-to-r from-sky-50 to-sky-100',
//   'bg-gradient-to-r from-indigo-50 to-indigo-100',
//   'bg-gradient-to-r from-violet-50 to-violet-100',
//   'bg-gradient-to-r from-blue-100 to-blue-200',
//   'bg-gradient-to-r from-cyan-100 to-cyan-200',
//   'bg-gradient-to-r from-sky-100 to-sky-200',
//   'bg-gradient-to-r from-indigo-100 to-indigo-200',
//   'bg-gradient-to-r from-violet-100 to-violet-200',
// ];

// const YEARLY_COLORS = [
//   'bg-gradient-to-r from-green-50 to-green-100',
//   'bg-gradient-to-r from-emerald-50 to-emerald-100',
//   'bg-gradient-to-r from-teal-50 to-teal-100',
//   'bg-gradient-to-r from-lime-50 to-lime-100',
//   'bg-gradient-to-r from-amber-50 to-amber-100',
//   'bg-gradient-to-r from-green-100 to-green-200',
//   'bg-gradient-to-r from-emerald-100 to-emerald-200',
//   'bg-gradient-to-r from-teal-100 to-teal-200',
//   'bg-gradient-to-r from-lime-100 to-lime-200',
//   'bg-gradient-to-r from-amber-100 to-amber-200',
// ];

export const Page3NonFood = ({
  data,
  updateData
}: Page3NonFoodProps) => {
  const {
    updateWithImputasi
  } = useSurveyImputasi(data, updateData);
  
  const [activeTab, setActiveTab] = useState<string>("A");
  const incompleteEntries = validatePage3Entries(data);

  // Fungsi helper untuk mengecek apakah item incomplete
  const isItemIncomplete = (itemKey: string) => {
    return incompleteEntries.some(entry => entry.itemKey === itemKey);
  };

  // Fungsi helper untuk mendapatkan expense - FIXED: handle entries correctly
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

  // Helper to calculate total from expense (handles entries)
  const getExpenseTotal = (expense: any) => {
    if (!expense) return 0;
    
    // Check if entries exist and sum from entries
    if (expense.entries && expense.entries.length > 0) {
      return expense.entries.reduce((sum: number, entry: any) => sum + (entry.nilai || 0), 0);
    }
    
    // Fallback to direct values
    return (expense.pembelian || 0) + (expense.produksiSendiri || 0);
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
        if (expense && getExpenseTotal(expense) > 0) {
          completed++;
        }
      });

      // Check yearly items
      category.yearlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, false, item);
        if (expense && getExpenseTotal(expense) > 0) {
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

  // Hitung total keseluruhan - FIXED: Calculate from entries if available
  const overallTotal = useMemo(() => {
    let monthlyTotal = 0;
    let yearlyTotal = 0;
    
    Object.keys(NON_FOOD_DETAIL_CATEGORIES).forEach(categoryKey => {
      const category = NON_FOOD_DETAIL_CATEGORIES[categoryKey as keyof typeof NON_FOOD_DETAIL_CATEGORIES];

      // Monthly items
      category.monthlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, true, item);
        monthlyTotal += getExpenseTotal(expense);
      });

      // Yearly items
      category.yearlyItems.forEach(item => {
        const expense = getCurrentExpense(categoryKey, false, item);
        yearlyTotal += getExpenseTotal(expense);
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

  // Total kategori target = 19 (sesuai permintaan)
  const totalCategoriesTarget = 19;

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
      monthlyTotal += getExpenseTotal(expense);
    });

    // Calculate yearly total  
    category.yearlyItems.forEach(item => {
      const expense = getCurrentExpense(categoryKey, false, item);
      yearlyTotal += getExpenseTotal(expense);
    });
    
    return {
      monthlyTotal,
      yearlyTotal
    };
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Helper untuk mengubah teks menjadi Proper Case
  const toProperCase = (text: string) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
  const getMonthlyBgColor = (index: number) => {
    return MONTHLY_COLORS[index % MONTHLY_COLORS.length];
  };

  const getYearlyBgColor = (index: number) => {
    return YEARLY_COLORS[index % YEARLY_COLORS.length];
  };

  // Get all category keys
  const categoryKeys = Object.keys(NON_FOOD_DETAIL_CATEGORIES);

  // Calculate progress bar percentage - cap at 100% if > 19
  const progressBarPercentage = Math.min((completedCategories / totalCategoriesTarget) * 100, 100);
  const isProgressComplete = completedCategories >= totalCategoriesTarget;

  return (
    <div className="max-w-none w-full space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            IV.II KONSUMSI DAN PENGELUARAN BARANG BUKAN MAKANAN
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk barang bukan makanan
          </p>
        </div>
      </div>

      {/* Progress Header - Desktop Layout (sama seperti Page 2) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm flex-1">
              <div className="font-medium">Halaman 3 - Barang Bukan Makanan</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-700">Progress:</span>
                <span className={`font-bold ${isProgressComplete ? 'text-green-700' : 'text-purple-700'}`}>
                  {completedCategories}/{totalCategoriesTarget}
                </span>
                <span className="text-gray-600 text-xs">kategori terisi</span>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isProgressComplete ? 'bg-green-600' : 'bg-purple-600'
                  }`}
                  style={{ width: `${progressBarPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={navigateToPrevTab}
                disabled={activeTab === categoryKeys[0]}
                className="flex items-center gap-1 border-purple-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              
              <div className="text-sm px-2 py-1 bg-white rounded border border-purple-300 text-purple-700 font-medium">
                Kategori {activeTab}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={navigateToNextTab}
                disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
                className="flex items-center gap-1 border-purple-300"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-purple-800">
            Total: Rp {formatNumber(overallTotal.monthlyTotal + overallTotal.yearlyTotal)}
          </div>
          <div className="text-xs text-gray-600">Sebulan & Setahun</div>
        </div>
      </div>

      {/* Category Navigation Buttons (sama seperti Page 2) */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categoryKeys.map(key => {
          const progress = categoryProgress[key];
          const isActive = activeTab === key;
          const isComplete = progress.percentage === 100;
          const hasData = progress.percentage > 0;
          
          const categoryTitle = NON_FOOD_DETAIL_CATEGORIES[key as keyof typeof NON_FOOD_DETAIL_CATEGORIES].title;
          
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1 h-8 ${
                !isActive && isComplete 
                  ? "border-green-500 text-green-800 bg-green-100 hover:bg-green-200" 
                  : !isActive && hasData
                  ? "border-yellow-500 text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
                  : "border-gray-300"
              }`}
            >
              {isComplete && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {key}. {toProperCase(categoryTitle)}
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
              <Card className="border border-gray-300">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base text-gray-800">
                          <span className="text-red-600 font-bold">{categoryKey}.</span> {category.title}
                        </CardTitle>
                        
                        {progress.percentage < 100 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-gray-200 border-orange-400 text-orange-700"
                            onClick={() => skipCategory(categoryKey)}
                          >
                            <SkipForward className="h-3 w-3 mr-1" />
                            Lewati
                          </Badge>
                        )}
                      </div>
                      
                      {/* Category Summary - Lebih kontras */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded border border-gray-200 shadow-sm">
                        <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                          <div className="flex items-center justify-center gap-1 text-xs text-blue-700 font-medium">
                            <Calendar className="h-3 w-3" />
                            Sebulan
                          </div>
                          <div className="text-sm font-bold text-blue-800">Rp {formatNumber(totals.monthlyTotal)}</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-100">
                          <div className="flex items-center justify-center gap-1 text-xs text-green-700 font-medium">
                            <Clock className="h-3 w-3" />
                            Setahun
                          </div>
                          <div className="text-sm font-bold text-green-800">Rp {formatNumber(totals.yearlyTotal)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reset Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => resetCategory(categoryKey)}
                      className="flex items-center gap-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="space-y-6">
                    {/* Sebulan Terakhir */}
                    {category.monthlyItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded border border-blue-200">
                          <div className="h-5 w-1.5 bg-blue-600 rounded"></div>
                          <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Sebulan Terakhir
                            <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              {category.monthlyItems.length} item
                            </span>
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {category.monthlyItems.map((item, index) => {
                            const currentExpense = getCurrentExpense(categoryKey, true, item);
                            const itemKey = `${categoryKey}_monthly_${item}`;
                            const isIncomplete = isItemIncomplete(itemKey);
                            
                            return (
                              <div 
                                key={item}
                                className={`p-4 border-2 rounded-lg shadow-sm ${getMonthlyBgColor(index)} ${
                                  isIncomplete
                                    ? 'border-red-400 shadow-red-100' 
                                    : 'border-blue-300 shadow-blue-100'
                                } hover:shadow-md transition-shadow duration-200`}
                              >
                                <EnhancedExpenseInput
                                  label={item}
                                  value={currentExpense}
                                  onChange={expense => updateCategoryExpense(categoryKey, true, item, expense)}
                                  useNewCategories={true}
                                  itemKey={item}
                                  incompleteEntries={incompleteEntries}
                                  periode="bulan"
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
                        <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-green-50 to-green-100 rounded border border-green-200">
                          <div className="h-5 w-1.5 bg-green-600 rounded"></div>
                          <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Setahun Terakhir
                            <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">
                              {category.yearlyItems.length} item
                            </span>
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {category.yearlyItems.map((item, index) => {
                            const currentExpense = getCurrentExpense(categoryKey, false, item);
                            const itemKey = `${categoryKey}_yearly_${item}`;
                            const isIncomplete = isItemIncomplete(itemKey);
                            
                            return (
                              <div 
                                key={item}
                                className={`p-4 border-2 rounded-lg shadow-sm ${getYearlyBgColor(index)} ${
                                  isIncomplete
                                    ? 'border-red-400 shadow-red-100' 
                                    : 'border-green-300 shadow-green-100'
                                } hover:shadow-md transition-shadow duration-200`}
                              >
                                <EnhancedExpenseInput
                                  label={item}
                                  value={currentExpense}
                                  onChange={expense => updateCategoryExpense(categoryKey, false, item, expense)}
                                  useNewCategories={true}
                                  itemKey={itemKey}
                                  incompleteEntries={incompleteEntries}
                                  periode="tahun"
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
              
              {/* Navigation Footer (sama seperti Page 2) */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-300">
                <Button 
                  variant="outline" 
                  onClick={navigateToPrevTab}
                  disabled={activeTab === categoryKeys[0]}
                  className="w-full sm:w-auto border-gray-400 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kategori Sebelumnya
                </Button>
                
                <div className="text-sm text-center text-gray-700">
                  <div className="font-medium">Kategori {categoryKey} • {progress.completed}/{progress.total} item terisi</div>
                  <div className="font-bold text-base text-purple-800">
                    Total Kategori: Rp {formatNumber(totals.monthlyTotal + totals.yearlyTotal)}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={navigateToNextTab}
                  disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
                  className="w-full sm:w-auto border-gray-400 hover:bg-gray-100"
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