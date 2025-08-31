import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
interface SurveyLayoutProps {
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
  title: string;
}
export const SurveyLayout = ({
  children,
  currentPage,
  totalPages,
  onNext,
  onPrevious,
  title
}: SurveyLayoutProps) => {
  return <div className="min-h-screen p-2 lg:p-4 bg-amber-200">
      <div className="max-w-none w-full mx-auto">
        <Card className="w-full">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-bold text-professional-navy text-3xl">LK VSEN.KP-3210</CardTitle>
            <p className="text-professional-blue text-2xl font-medium">{title}</p>
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-sm text-professional-slate">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 lg:p-6">
            <div className="mb-6 w-full">
              {children}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={onPrevious} disabled={currentPage === 1} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button onClick={onNext} disabled={currentPage === totalPages} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};