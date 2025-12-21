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
import { RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { useState, useMemo } from "react";

interface Page2FoodProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}

// Warna latar belakang yang berbeda untuk setiap item
const ITEM_COLORS = [
  'bg-blue-50/70',
  'bg-green-50/70',
  'bg-amber-50/70',
  'bg-purple-50/70',
  'bg-rose-50/70',
  'bg-cyan-50/70',
  'bg-orange-50/70',
  'bg-teal-50/70',
  'bg-indigo-50/70',
  'bg-pink-50/70',
  'bg-lime-50/70',
  'bg-sky-50/70',
];

export const Page2Food = ({
  data,
  updateData
}: Page2FoodProps) => {
  const {
    updateWithImputasi
  } = useSurveyImputasi(data, updateData);
  
  const [activeTab, setActiveTab] = useState<string>("A");
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

  // Hitung total keseluruhan - FIXED: Calculate from entries if available
  const overallTotal = useMemo(() => {
    let totalPembelian = 0;
    let totalProduksiSendiri = 0;
    
    Object.keys(FOOD_CATEGORIES).forEach(categoryKey => {
      const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
      
      category.items.forEach(item => {
        const key = `${categoryKey}_${item}`;
        const expense = data.makananMinuman[key];
        if (expense) {
          // Check if entries exist and sum from entries
          if (expense.entries && expense.entries.length > 0) {
            expense.entries.forEach((entry: any) => {
              if (entry.kategori === 'Pembelian') {
                totalPembelian += entry.nilai || 0;
              } else {
                totalProduksiSendiri += entry.nilai || 0;
              }
            });
          } else {
            // Fallback to direct values
            totalPembelian += expense.pembelian || 0;
            totalProduksiSendiri += expense.produksiSendiri || 0;
          }
        }
      });
    });
    
    return {
      totalPembelian,
      totalProduksiSendiri
    };
  }, [data.makananMinuman]);

  // Hitung jumlah kategori yang terisi (minimal 1 item terisi)
  const completedCategories = useMemo(() => {
    return Object.values(categoryProgress).filter(p => p.completed > 0).length;
  }, [categoryProgress]);

  // Total kategori = 13 (sesuai permintaan)
  const totalCategories = 13;

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
        // Check if entries exist and sum from entries
        if (expense.entries && expense.entries.length > 0) {
          expense.entries.forEach((entry: any) => {
            if (entry.kategori === 'Pembelian') {
              totalPembelian += entry.nilai || 0;
            } else {
              totalProduksiSendiri += entry.nilai || 0;
            }
          });
        } else {
          // Fallback to direct values
          totalPembelian += expense.pembelian || 0;
          totalProduksiSendiri += expense.produksiSendiri || 0;
        }
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

  // Helper untuk mendapatkan warna background berdasarkan index
  const getBackgroundColorClass = (index: number) => {
    return ITEM_COLORS[index % ITEM_COLORS.length];
  };

  // Get all category keys
  const categoryKeys = Object.keys(FOOD_CATEGORIES);

  // Calculate progress bar percentage - cap at 100% if > 13
  const progressBarPercentage = Math.min((completedCategories / totalCategories) * 100, 100);
  const isProgressComplete = completedCategories >= totalCategories;

  return (
    <div className="max-w-none w-full space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            IV.I KONSUMSI DAN PENGELUARAN BAHAN MAKANAN, BAHAN MINUMAN, DAN ROKOK SEMINGGU TERAKHIR
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk setiap kategori
          </p>
        </div>
      </div>

      {/* Progress Header - Desktop Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm flex-1">
              <div className="font-medium">Halaman 2 - Bahan Makanan & Minuman</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">Progress:</span>
                <span className={`font-bold ${isProgressComplete ? 'text-green-600' : 'text-blue-600'}`}>
                  {completedCategories}/{totalCategories}
                </span>
                <span className="text-gray-500 text-xs">kategori terisi</span>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isProgressComplete ? 'bg-green-500' : 'bg-blue-500'
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
            Total: Rp {formatNumber(overallTotal.totalPembelian + overallTotal.totalProduksiSendiri)}
          </div>
          <div className="text-xs text-gray-500">Pembelian & Produksi Sendiri</div>
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
                          <div className="text-xs text-gray-500">Total Pembelian</div>
                          <div className="text-sm font-semibold">Rp {formatNumber(totals.totalPembelian)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Total Produksi Sendiri</div>
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
                      Reset Kategori
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {category.items.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                            className={`p-3 border rounded-lg ${getBackgroundColorClass(index)} ${
                              isIncomplete 
                                ? 'border-red-200' 
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
                    Total Kategori: Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
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
