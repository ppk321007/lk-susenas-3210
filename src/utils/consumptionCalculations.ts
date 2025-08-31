import { SurveyData } from "@/types/survey";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { NON_FOOD_CATEGORIES } from "@/data/nonFoodCategories";
import { calculateImputasiFromFood } from "./imputasiCalculations";

export const calculateAverageMonthlyConsumption = (data: SurveyData): number => {
  // Calculate food monthly average (from weekly data)
  const getFoodCategoryTotal = (categoryKey: string) => {
    const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
    let totalPembelian = 0;
    let totalProduksiSendiri = 0;

    if (category.items && category.items.length > 0) {
      category.items.forEach((item) => {
        const key = `${categoryKey}_${item}`;
        const expense = data.makananMinuman[key];
        if (expense) {
          totalPembelian += expense.pembelian || 0;
          totalProduksiSendiri += expense.produksiSendiri || 0;
        }
      });
    } else {
      // For categories handled by MakananMinumanJadiInput
      data.namaAnggotaRumahTangga.forEach((_, index) => {
        const key = `${categoryKey}_${index}`;
        const expense = data.makananMinuman[key];
        if (expense) {
          totalPembelian += expense.pembelian || 0;
          totalProduksiSendiri += expense.produksiSendiri || 0;
        }
      });
    }

    return { totalPembelian, totalProduksiSendiri };
  };

  // Calculate food subtotal (weekly)
  const foodSubtotal = Object.keys(FOOD_CATEGORIES).reduce((total, categoryKey) => {
    const categoryTotal = getFoodCategoryTotal(categoryKey);
    return total + categoryTotal.totalPembelian + categoryTotal.totalProduksiSendiri;
  }, 0);

  // Convert weekly food to monthly average
  const rataRataSebulan = Math.round(foodSubtotal * 52 / 12); // Weekly * 52 weeks / 12 months

  // Calculate non-food monthly average
  const nonFoodMonthlyAverage = Object.keys(NON_FOOD_CATEGORIES).reduce((totalMonthly, categoryKey) => {
    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
    let monthlyDataTotal = 0;
    if (monthlyData && typeof monthlyData === 'object') {
      monthlyDataTotal = Object.values(monthlyData).reduce((sum, val) => {
        if (val && typeof val === 'object' && 'pembelian' in val && 'produksiSendiri' in val) {
          return sum + (val.pembelian || 0) + (val.produksiSendiri || 0);
        }
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    }
    return totalMonthly + monthlyDataTotal;
  }, 0) + 
  (Object.keys(NON_FOOD_CATEGORIES).reduce((totalYearly, categoryKey) => {
    let yearlyDataTotal = 0;
    if (data.komoditiSetahun && typeof data.komoditiSetahun === 'object') {
      yearlyDataTotal = Object.entries(data.komoditiSetahun)
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
    return totalYearly + yearlyDataTotal;
  }, 0) / 12); // Convert yearly to monthly

  // Return total monthly average
  return rataRataSebulan + nonFoodMonthlyAverage;
};

/**
 * Apply automatic imputasi calculations to survey data
 */
export const applySurveyImputasiCalculations = (data: SurveyData): SurveyData => {
  console.log("🚀 applySurveyImputasiCalculations called with data:", data);
  const imputasiUpdates = calculateImputasiFromFood(data);
  console.log("📊 Imputasi updates calculated:", imputasiUpdates);
  
  const result = {
    ...data,
    ...imputasiUpdates
  };
  
  console.log("✅ Final result after applying imputasi:", result);
  return result;
};