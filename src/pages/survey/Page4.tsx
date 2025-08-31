import { SurveyData } from "@/types/survey";

interface Page4Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}

export const Page4 = ({ data, updateData }: Page4Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Halaman 4</h2>
      <div className="text-center text-muted-foreground">
        <p>Konten halaman 4 akan ditambahkan sesuai kebutuhan</p>
      </div>
    </div>
  );
};