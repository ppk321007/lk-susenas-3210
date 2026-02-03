import { EnhancedExpenseInput } from "@/components/EnhancedExpenseInput";
import { SurveyData, FoodExpense } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { validatePage2Entries, IncompleteEntry } from "@/utils/validationUtils";
import { getNormalizedExpenseTotals } from "@/utils/expenseNormalizer";
import { useMemo } from "react";

interface MakananMinumanJadiInputProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  categoryKey: string;
  categoryTitle: string;
  incompleteEntries?: IncompleteEntry[];
}

export const MakananMinumanJadiInput = ({ 
  data, 
  updateData, 
  categoryKey, 
  categoryTitle,
  incompleteEntries = []
}: MakananMinumanJadiInputProps) => {
  const { updateWithImputasi } = useSurveyImputasi(data, updateData);

  const updateExpense = (memberIndex: number, expense: FoodExpense) => {
    const itemKey = `${categoryKey}_${memberIndex}`;
    const updatedMakananMinuman = {
      ...data.makananMinuman,
      [itemKey]: expense
    };
    
    console.log(`🔄 MakananMinumanJadiInput updating: ${itemKey}`, expense);
    updateWithImputasi({
      makananMinuman: updatedMakananMinuman
    });
  };

  // Use normalizer for correct totals from entries array
  const getCategoryTotal = useMemo(() => {
    return () => {
      let totalPembelian = 0;
      let totalProduksiSendiri = 0;

      data.namaAnggotaRumahTangga.forEach((_, index) => {
        const key = `${categoryKey}_${index}`;
        const expense = data.makananMinuman[key];
        const normalized = getNormalizedExpenseTotals(expense);
        totalPembelian += normalized.pembelian;
        totalProduksiSendiri += normalized.produksiSendiri;
      });

      return { totalPembelian, totalProduksiSendiri };
    };
  }, [data.makananMinuman, data.namaAnggotaRumahTangga, categoryKey]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  const totals = getCategoryTotal();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {categoryKey}. {categoryTitle}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <div>Total Pembelian: Rp {formatNumber(totals.totalPembelian)}</div>
          <div>Total Produksi Sendiri: Rp {formatNumber(totals.totalProduksiSendiri)}</div>
          <div className="font-semibold">
            Jumlah: Rp {formatNumber(totals.totalPembelian + totals.totalProduksiSendiri)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.namaAnggotaRumahTangga.map((nama, index) => {
            const itemKey = `${categoryKey}_${index}`;
            const currentExpense = data.makananMinuman[itemKey] || {
              pembelian: 0,
              produksiSendiri: 0
            };

            return (
              <EnhancedExpenseInput
                key={itemKey}
                label={`${index + 1}. ${nama}`}
                value={currentExpense}
                onChange={(expense) => updateExpense(index, expense)}
                itemKey={itemKey}
                incompleteEntries={incompleteEntries}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};