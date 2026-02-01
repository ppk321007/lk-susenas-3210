import { FoodExpense, NonFoodExpense } from "@/types/survey";

/**
 * Normalizes expense data to get consistent totals whether data comes from:
 * 1. Direct input (pembelian/produksiSendiri fields)
 * 2. Entries array (from EnhancedExpenseInput or loaded from spreadsheet)
 * 
 * This ensures totals are always calculated correctly regardless of data source.
 */
export const getNormalizedExpenseTotals = (expense: FoodExpense | NonFoodExpense | any): {
  pembelian: number;
  produksiSendiri: number;
  total: number;
} => {
  if (!expense) {
    return { pembelian: 0, produksiSendiri: 0, total: 0 };
  }

  let pembelian = 0;
  let produksiSendiri = 0;

  // FIRST: Try to calculate from entries array (most reliable for EnhancedExpenseInput data)
  if (expense.entries && Array.isArray(expense.entries) && expense.entries.length > 0) {
    expense.entries.forEach((entry: any) => {
      const nilai = entry.nilai || 0;
      if (entry.kategori === 'Pembelian') {
        pembelian += nilai;
      } else if (entry.kategori === 'Produksi Sendiri/Pemberian' || entry.kategori === 'Pemberian') {
        produksiSendiri += nilai;
      }
    });
  }

  // FALLBACK: If no entries with values found, use direct fields
  if (pembelian === 0 && produksiSendiri === 0) {
    pembelian = expense.pembelian || 0;
    produksiSendiri = expense.produksiSendiri || 0;
  }

  return {
    pembelian,
    produksiSendiri,
    total: pembelian + produksiSendiri
  };
};

/**
 * Calculate totals for a food category (A-N) from survey data
 * NOTE: Food data is expected to be in weekly period by default
 * Returns totals in their raw period (weekly), conversion to monthly/yearly happens elsewhere
 */
export const getFoodCategoryTotals = (
  categoryKey: string,
  makananMinuman: Record<string, any>,
  categoryItems: string[],
  namaAnggotaRumahTangga: string[]
): { totalPembelian: number; totalProduksiSendiri: number } => {
  let totalPembelian = 0;
  let totalProduksiSendiri = 0;

  if (categoryItems && categoryItems.length > 0) {
    // Standard categories with items (A-L)
    categoryItems.forEach(item => {
      const key = `${categoryKey}_${item}`;
      const expense = makananMinuman[key];
      
      if (expense && expense.entries && Array.isArray(expense.entries)) {
        // Process entries and keep them in their original period
        expense.entries.forEach((entry: any) => {
          const nilai = entry.nilai || 0;
          if (entry.kategori === 'Pembelian') {
            totalPembelian += nilai;
          } else if (entry.kategori === 'Produksi Sendiri/Pemberian' || entry.kategori === 'Pemberian') {
            totalProduksiSendiri += nilai;
          }
        });
      } else {
        // Fallback to direct fields
        const normalized = getNormalizedExpenseTotals(expense);
        totalPembelian += normalized.pembelian;
        totalProduksiSendiri += normalized.produksiSendiri;
      }
    });
  } else {
    // Per-member categories (M, N)
    namaAnggotaRumahTangga.forEach((_, index) => {
      const key = `${categoryKey}_${index}`;
      const expense = makananMinuman[key];
      
      if (expense && expense.entries && Array.isArray(expense.entries)) {
        // Process entries and keep them in their original period
        expense.entries.forEach((entry: any) => {
          const nilai = entry.nilai || 0;
          if (entry.kategori === 'Pembelian') {
            totalPembelian += nilai;
          } else if (entry.kategori === 'Produksi Sendiri/Pemberian' || entry.kategori === 'Pemberian') {
            totalProduksiSendiri += nilai;
          }
        });
      } else {
        // Fallback to direct fields
        const normalized = getNormalizedExpenseTotals(expense);
        totalPembelian += normalized.pembelian;
        totalProduksiSendiri += normalized.produksiSendiri;
      }
    });
  }

  return { totalPembelian, totalProduksiSendiri };
};

/**
 * Calculate totals for a non-food category from monthly data
 * NOTE: This function expects data that's already normalized to monthly period
 * If entries have periode field set to 'tahun', they need conversion to monthly first
 */
export const getNonFoodMonthlyTotal = (
  monthlyData: Record<string, any> | undefined
): number => {
  if (!monthlyData || typeof monthlyData !== 'object') {
    return 0;
  }

  return Object.values(monthlyData).reduce((sum, expense) => {
    if (!expense) return sum;
    
    // Check if expense has entries with periode field
    if (expense.entries && Array.isArray(expense.entries)) {
      return sum + expense.entries.reduce((entrySum: number, entry: any) => {
        const nilai = entry.nilai || 0;
        const periode = entry.periode || 'minggu';
        
        // Convert to monthly based on periode
        let monthlyValue = 0;
        if (periode === 'minggu' || periode === 'weekly') {
          monthlyValue = Math.round(nilai * 30 / 7);
        } else if (periode === 'bulan' || periode === 'monthly') {
          monthlyValue = nilai;
        } else if (periode === 'tahun' || periode === 'yearly') {
          // If already yearly, divide by 12 to get monthly
          monthlyValue = Math.round(nilai / 12);
        } else {
          // Default to weekly
          monthlyValue = Math.round(nilai * 30 / 7);
        }
        return entrySum + monthlyValue;
      }, 0);
    }
    
    // Fallback to direct fields (assumed to be monthly)
    const normalized = getNormalizedExpenseTotals(expense);
    return sum + normalized.total;
  }, 0);
};

/**
 * Calculate totals for a non-food category from yearly data
 */
export const getNonFoodYearlyTotal = (
  komoditiSetahun: Record<string, any> | undefined,
  categoryKey: string
): number => {
  if (!komoditiSetahun || typeof komoditiSetahun !== 'object') {
    return 0;
  }

  return Object.entries(komoditiSetahun)
    .filter(([key]) => key.startsWith(`${categoryKey}_yearly_`))
    .reduce((sum, [, expense]) => {
      const normalized = getNormalizedExpenseTotals(expense);
      return sum + normalized.total;
    }, 0);
};
