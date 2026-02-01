import { SurveyData } from "@/types/survey";
import { FOOD_CATEGORIES } from "@/data/foodCategories";
import { NON_FOOD_CATEGORIES } from "@/data/nonFoodCategories";
import { calculateImputasiFromFood } from "./imputasiCalculations";
import { 
  getFoodCategoryTotals, 
  getNonFoodMonthlyTotal, 
  getNonFoodYearlyTotal 
} from "./expenseNormalizer";

export const calculateAverageMonthlyConsumption = (data: SurveyData): number => {
  // Calculate food subtotal using normalizer (weekly data)
  const foodSubtotal = Object.keys(FOOD_CATEGORIES).reduce((total, categoryKey) => {
    const category = FOOD_CATEGORIES[categoryKey as keyof typeof FOOD_CATEGORIES];
    const { totalPembelian, totalProduksiSendiri } = getFoodCategoryTotals(
      categoryKey,
      data.makananMinuman,
      category?.items || [],
      data.namaAnggotaRumahTangga
    );
    return total + totalPembelian + totalProduksiSendiri;
  }, 0);

  // Convert weekly food to monthly average
  const rataRataSebulan = Math.round(foodSubtotal * 52 / 12); // Weekly * 52 weeks / 12 months

  // Calculate non-food monthly average using normalizer
  const nonFoodMonthlyAverage = Object.keys(NON_FOOD_CATEGORIES).reduce((totalMonthly, categoryKey) => {
    const monthlyData = data[`komoditi${categoryKey}Sebulan` as keyof SurveyData] as Record<string, any>;
    return totalMonthly + getNonFoodMonthlyTotal(monthlyData);
  }, 0) + 
  (Object.keys(NON_FOOD_CATEGORIES).reduce((totalYearly, categoryKey) => {
    return totalYearly + getNonFoodYearlyTotal(data.komoditiSetahun, categoryKey);
  }, 0) / 12); // Convert yearly to monthly

  // Return total monthly average
  return rataRataSebulan + nonFoodMonthlyAverage;
};

/**
 * Calculate transfer amounts from "Uang berasal dari rumah tangga lain" entries
 */
export const calculateTransferFromHouseholds = (data: SurveyData): number => {
  let totalTransfer = 0;

  // Calculate from food data (Page 2) - multiply by 30/7 * 12 to get annual amount
  Object.entries(data.makananMinuman || {}).forEach(([key, expense]) => {
    if (expense?.entries) {
      expense.entries.forEach(entry => {
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Uang berasal dari rumah tangga lain') {
          totalTransfer += (entry.nilai || 0) * 30/7 * 12;
        }
      });
    }
  });

  // Calculate from non-food data (Page 3)
  // Monthly items: multiply by 12
  Object.keys(data).forEach(key => {
    if (key.includes('Sebulan') && typeof data[key as keyof SurveyData] === 'object') {
      const monthlyData = data[key as keyof SurveyData] as Record<string, any>;
      Object.values(monthlyData || {}).forEach(expense => {
        if (expense?.entries) {
          expense.entries.forEach((entry: any) => {
            if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Uang berasal dari rumah tangga lain') {
              totalTransfer += (entry.nilai || 0) * 12;
            }
          });
        }
      });
    }
  });

  // Yearly items: multiply by 1
  Object.entries(data.komoditiSetahun || {}).forEach(([key, expense]) => {
    if (expense && typeof expense === 'object' && 'entries' in expense) {
      const expenseObj = expense as any;
      expenseObj.entries?.forEach((entry: any) => {
        if (entry.kategori === 'Pembelian' && entry.jenisDetail === 'Uang berasal dari rumah tangga lain') {
          totalTransfer += (entry.nilai || 0) * 1;
        }
      });
    }
  });

  return totalTransfer;
};

/**
 * Apply automatic imputasi calculations to survey data
 */
export const applySurveyImputasiCalculations = (data: SurveyData): SurveyData => {
  console.log("🚀 applySurveyImputasiCalculations called with data:", data);
  const imputasiUpdates = calculateImputasiFromFood(data);
  console.log("📊 Imputasi updates calculated:", imputasiUpdates);
  
  // Calculate transfer from households
  const householdTransferAmount = calculateTransferFromHouseholds(data);
  console.log("💰 Household transfer amount:", householdTransferAmount);

  // Update transfer berjalan with calculated amount
  // IMPORTANT: Preserve all user input fields from data.transferBerjalan, only apply imputasi fields
  const updatedTransferBerjalan = {
    ...data.transferBerjalan,
    // Merge in the imputasi-calculated fields (only imputasi, not user inputs)
    pemerintah: {
      ...data.transferBerjalan?.pemerintah,
      imputasiTransferDiterimaUang: imputasiUpdates.transferBerjalan?.pemerintah?.imputasiTransferDiterimaUang,
      imputasiTransferDiterimaBarang: imputasiUpdates.transferBerjalan?.pemerintah?.imputasiTransferDiterimaBarang
    },
    pemerintahBantuan: {
      ...data.transferBerjalan?.pemerintahBantuan,
      imputasiTransferDiterimaUang: imputasiUpdates.transferBerjalan?.pemerintahBantuan?.imputasiTransferDiterimaUang,
      imputasiTransferDiterimaBarang: imputasiUpdates.transferBerjalan?.pemerintahBantuan?.imputasiTransferDiterimaBarang
    },
    pemerintahUangPensiun: {
      ...data.transferBerjalan?.pemerintahUangPensiun,
      imputasiTransferDiterimaUang: imputasiUpdates.transferBerjalan?.pemerintahUangPensiun?.imputasiTransferDiterimaUang
    },
    badanUsaha: {
      ...data.transferBerjalan?.badanUsaha,
      imputasiTransferDiterimaBarang: imputasiUpdates.transferBerjalan?.badanUsaha?.imputasiTransferDiterimaBarang
    },
    rumahTanggaLain: {
      ...data.transferBerjalan?.rumahTanggaLain,
      imputasiTransferDiterimaBarang: householdTransferAmount
    },
    lembagaNirlaba: {
      ...data.transferBerjalan?.lembagaNirlaba,
      imputasiTransferDiterimaBarang: imputasiUpdates.transferBerjalan?.lembagaNirlaba?.imputasiTransferDiterimaBarang
    },
    luarNegeri: {
      ...data.transferBerjalan?.luarNegeri,
      imputasiTransferDiterimaBarang: imputasiUpdates.transferBerjalan?.luarNegeri?.imputasiTransferDiterimaBarang
    }
  };

  const result = {
    ...data,
    ...imputasiUpdates,
    transferBerjalan: updatedTransferBerjalan
  };
  
  console.log("✅ Final result after applying imputasi:", result);
  return result;
};