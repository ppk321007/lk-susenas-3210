import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { MakananMinumanJadiInput } from "@/components/MakananMinumanJadiInput";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { SurveyData, FoodExpense } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage2Entries } from "@/utils/validationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
            IV.I KONSUMSI DAN PENGELUARAN BAHAN MAKANAN, BAHAN MINUMAN, DAN ROKOK SEMINGGU TERAKHIR
          </h2>
          <p className="text-sm text-muted-foreground">
            Isi data konsumsi dan pengeluaran untuk setiap kategori makanan dan minuman
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Total Keseluruhan</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-700">Total Pembelian: <strong>Rp {formatNumber(overallTotal.totalPembelian)}</strong></div>
              <div className="text-sm text-blue-700">Total Produksi Sendiri: <strong>Rp {formatNumber(overallTotal.totalProduksiSendiri)}</strong></div>
              <div className="text-lg font-bold text-blue-900">
                Grand Total: Rp {formatNumber(overallTotal.totalPembelian + overallTotal.totalProduksiSendiri)}
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
          {Object.entries(FOOD_CATEGORIES).map(([categoryKey, category]) => {
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

        {Object.entries(FOOD_CATEGORIES).map(([categoryKey, category]) => {
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Pembelian</div>
                          <div className="font-semibold text-sm">Rp {formatNumber(totals.totalPembelian)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Produksi Sendiri</div>
                          <div className="font-semibold text-sm">Rp {formatNumber(totals.totalProduksiSendiri)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Total Kategori</div>
                          <div className="font-semibold text-sm text-primary">
                            Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
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
                  {category.items.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {category.items.map(item => {
                  const itemKey = `${categoryKey}_${item}`;
                  const currentExpense = data.makananMinuman[itemKey] || {
                    pembelian: 0,
                    produksiSendiri: 0
                  };
                  return <EnhancedExpenseInput key={itemKey} label={item} value={currentExpense} onChange={expense => updateFoodExpense(itemKey, expense)} itemKey={itemKey} incompleteEntries={incompleteEntries} />;
                })}
                    </div> : <MakananMinumanJadiInput data={data} updateData={updateData} categoryKey={categoryKey} categoryTitle={category.title} incompleteEntries={incompleteEntries} />}
                </CardContent>
              </Card>
              
              {/* Navigation Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                <Button variant="outline" onClick={navigateToPrevTab} disabled={activeTab === Object.keys(FOOD_CATEGORIES)[0]} className="w-full sm:w-auto">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kategori Sebelumnya
                </Button>
                
                <div className="text-sm text-muted-foreground text-center">
                  <div>Kategori {activeTab} • {progress.completed} dari {progress.total} item terisi</div>
                  <div className="text-xs">
                    Total: Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
                  </div>
                </div>
                
                <Button variant="outline" onClick={navigateToNextTab} disabled={activeTab === Object.keys(FOOD_CATEGORIES)[Object.keys(FOOD_CATEGORIES).length - 1]} className="w-full sm:w-auto">
                  Kategori Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>;
      })}
      </Tabs>
    </div>;
};