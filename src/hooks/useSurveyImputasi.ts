import { useCallback } from 'react';
import { SurveyData } from '@/types/survey';
import { applySurveyImputasiCalculations } from '@/utils/consumptionCalculations';

/**
 * Custom hook to handle automatic imputasi calculations
 */
export const useSurveyImputasi = (
  data: SurveyData,
  updateData: (updates: Partial<SurveyData>) => void
) => {
  /**
   * Update data with automatic imputasi calculations applied
   */
  const updateWithImputasi = useCallback((updates: Partial<SurveyData>) => {
    const updatedData = { ...data, ...updates };
    const dataWithImputasi = applySurveyImputasiCalculations(updatedData);
    updateData(dataWithImputasi);
  }, [data, updateData]);

  /**
   * Recalculate and apply imputasi for current data
   */
  const recalculateImputasi = useCallback(() => {
    const dataWithImputasi = applySurveyImputasiCalculations(data);
    updateData(dataWithImputasi);
  }, [data, updateData]);

  return {
    updateWithImputasi,
    recalculateImputasi
  };
};