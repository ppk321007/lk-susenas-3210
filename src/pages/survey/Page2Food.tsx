import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { MakananMinumanJadiInput } from "@/components/MakananMinumanJadiInput";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { SurveyData, FoodExpense } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage2Entries } from "@/utils/validationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, BarChart3, SkipForward } from "lucide-react";
import { useState, useMemo } from "react";

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
  
  const [activeTab, setActiveTab] = useState<string>("1");
  const incompleteEntries = validatePage2Entries(data);

  // Fungsi helper untuk mengecek apakah item incomplete
  const isItemIncomplete = (itemKey: string) => {
    return incompleteEntries.some(entry => entry.itemKey === itemKey);
  };

  // Hitung progress per kategori
  const categoryProgress = useMemo(() => {
    const progress: Record<string, {
      completed: number;
      total: number;
      percentage: number;
    }> = {};
    
    Object.entries(FOOD_CATEGORIES).forEach(([categoryKey, category]) => {
      let completed = 0;
      let total = category.items.length;
      
      category.items.forEach(item => {
        const itemKey = `${categoryKey}_${item}`;
        const expense = data.makananMinuman[itemKey];
        // Anggap completed jika salah satu field terisi
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
  }, [data.makananMinuman]);

  // Hitung total keseluruhan
  const overallTotal = useMemo(() => {
    let totalPembelian = 0;
    let totalProduksiSendiri = 0;
    
    Object.keys(FOOD_CATEGORIES).forEach(categoryKey => {
      const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
      
      category.items.forEach(item => {
        const key = `${categoryKey}_${item}`;
        const expense = data.makananMinuman[key];
        if (expense) {
          totalPembelian += expense.pembelian || 0;
          totalProduksiSendiri += expense.produksiSendiri || 0;
        }
      });
    });
    
    return {
      totalPembelian,
      totalProduksiSendiri
    };
  }, [data.makananMinuman]);

  // Hitung progress keseluruhan
  const overallProgress = useMemo(() => {
    const allProgress = Object.values(categoryProgress);
    if (allProgress.length === 0) return 0;
    
    const totalCompleted = allProgress.reduce((sum, p) => sum + p.completed, 0);
    const totalItems = allProgress.reduce((sum, p) => sum + p.total, 0);
    
    return totalItems > 0 ? Math.round(totalCompleted / totalItems * 100) : 0;
  }, [categoryProgress]);

  const updateFoodExpense = (itemKey: string, expense: FoodExpense) => {
    updateWithImputasi({
      makananMinuman: {
        ...data.makananMinuman,
        [itemKey]: expense
      }
    });
  };

  const skipCategory = (categoryKey: string) => {
    // Set semua item dalam kategori menjadi 0 (tidak ada pengeluaran)
    const updates: Partial<SurveyData> = {
      makananMinuman: {
        ...data.makananMinuman
      }
    };
    
    const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
    
    category.items.forEach(item => {
      const itemKey = `${categoryKey}_${item}`;
      // Jika belum ada data, set ke 0
      if (!updates.makananMinuman![itemKey]) {
        updates.makananMinuman![itemKey] = {
          pembelian: 0,
          produksiSendiri: 0
        };
      }
    });
    
    updateWithImputasi(updates);
  };

  const resetCategory = (categoryKey: string) => {
    const updates: Partial<SurveyData> = {
      makananMinuman: {
        ...data.makananMinuman
      }
    };
    
    const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
    
    category.items.forEach(item => {
      const itemKey = `${categoryKey}_${item}`;
      updates.makananMinuman![itemKey] = {
        pembelian: 0,
        produksiSendiri: 0
      };
    });
    
    updateWithImputasi(updates);
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

  const getCompletionStatus = (percentage: number) => {
    if (percentage === 100) return "complete";
    if (percentage >= 50) return "partial";
    return "empty";
  };

  const navigateToNextTab = () => {
    const categoryKeys = Object.keys(FOOD_CATEGORIES);
    const currentIndex = categoryKeys.indexOf(activeTab);
    if (currentIndex < categoryKeys.length - 1) {
      setActiveTab(categoryKeys[currentIndex + 1]);
    }
  };

  const navigateToPrevTab = () => {
    const categoryKeys = Object.keys(FOOD_CATEGORIES);
    const currentIndex = categoryKeys.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(categoryKeys[currentIndex - 1]);
    }
  };

  // Helper untuk mendapatkan warna border berdasarkan index
  const getBorderColorClass = (index: number) => {
    const colors = [
      'border-l-blue-300',
      'border-l-green-300',
      'border-l-amber-300',
      'border-l-violet-300'
    ];
    return colors[index % colors.length];
  };

  // Get all category keys
  const categoryKeys = Object.keys(FOOD_CATEGORIES);

  return (
    <div className="max-w-none w-full space-y-4">
      {/* Header Section - Minimalis */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            IV.I KONSUMSI DAN PENGELUARAN BAHAN MAKANAN, BAHAN MINUMAN, DAN ROKOK SEMINGGU TERAKHIR
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk setiap kategori
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={navigateToPrevTab}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={activeTab === categoryKeys[0]}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="text-sm px-2 py-1 bg-gray-100 rounded">
            {activeTab}/{categoryKeys.length}
          </div>
          
          <button 
            onClick={navigateToNextTab}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overall Progress Bar - Minimalis */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Progress Keseluruhan</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        
        <div className="text-right text-xs">
          <div className="font-medium">Rp {formatNumber(overallTotal.totalPembelian + overallTotal.totalProduksiSendiri)}</div>
          <div className="text-gray-500">Total</div>
        </div>
      </div>

      {/* Progress Dots - Navigasi Visual */}
      <div className="flex gap-1 justify-center">
        {categoryKeys.map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`h-1.5 rounded-full transition-all ${
              activeTab === key 
                ? 'w-6 bg-blue-500' 
                : categoryProgress[key].percentage === 100 
                  ? 'w-2 bg-green-400'
                  : categoryProgress[key].percentage > 0
                    ? 'w-2 bg-yellow-400'
                    : 'w-2 bg-gray-300'
            }`}
            title={`Kategori ${key}: ${categoryProgress[key].percentage}% selesai`}
          />
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex overflow-x-auto py-1 mb-4 no-scrollbar">
          {categoryKeys.map(key => {
            const progress = categoryProgress[key];
            const status = getCompletionStatus(progress.percentage);
            
            return (
              <TabsTrigger 
                key={key} 
                value={key}
                className="px-3 py-1.5 text-xs whitespace-nowrap"
              >
                <span className="mr-1">{key}</span>
                <Badge 
                  variant="outline" 
                  className={`h-4 w-4 p-0 text-[9px] ${
                    status === "complete" ? "bg-green-100 text-green-700 border-green-300" :
                    status === "partial" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                    "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {progress.completed}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categoryKeys.map(categoryKey => {
          const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
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
                          <span className="text-red-600">{categoryKey}.</span> {category.title}
                        </CardTitle>
                        
                        {progress.percentage < 100 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => skipCategory(categoryKey)}
                          >
                            <SkipForward className="h-3 w-3 mr-1" />
                            Lewati
                          </Badge>
                        )}
                      </div>
                      
                      {/* Category Summary - Minimalis */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Pembelian</div>
                          <div className="text-sm font-semibold">Rp {formatNumber(totals.totalPembelian)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Produksi Sendiri</div>
                          <div className="text-sm font-semibold">Rp {formatNumber(totals.totalProduksiSendiri)}</div>
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
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {category.items.length > 0 ? (
                    <div className="space-y-2">
                      {category.items.map((item, index) => {
                        const itemKey = `${categoryKey}_${item}`;
                        const currentExpense = data.makananMinuman[itemKey] || {
                          pembelian: 0,
                          produksiSendiri: 0
                        };
                        const isIncomplete = isItemIncomplete(itemKey);
                        
                        return (
                          <div 
                            key={itemKey} 
                            className={`p-3 border rounded-lg ${getBorderColorClass(index)} ${
                              isIncomplete 
                                ? 'border-red-200 bg-red-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <EnhancedExpenseInput 
                              label={item}
                              value={currentExpense}
                              onChange={expense => updateFoodExpense(itemKey, expense)}
                              itemKey={itemKey}
                              incompleteEntries={incompleteEntries}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <MakananMinumanJadiInput 
                      data={data} 
                      updateData={updateData} 
                      categoryKey={categoryKey} 
                      categoryTitle={category.title} 
                      incompleteEntries={incompleteEntries} 
                    />
                  )}
                </CardContent>
              </Card>
              
              {/* Navigation Footer - Minimalis */}
              <div className="flex justify-between items-center pt-3 border-t">
                <button 
                  onClick={navigateToPrevTab}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeTab === categoryKeys[0]}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </button>
                
                <div className="text-xs text-center text-gray-500">
                  <div>{progress.completed}/{progress.total} item terisi</div>
                  <div className="font-medium">
                    Total: Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
                  </div>
                </div>
                
                <button 
                  onClick={navigateToNextTab}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeTab === categoryKeys[categoryKeys.length - 1]}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};