import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface SurveyLayoutProps {
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
  onPageJump?: (page: number) => void;
  title: string;
}

export const SurveyLayout = ({
  children,
  currentPage,
  totalPages,
  onNext,
  onPrevious,
  onPageJump,
  title
}: SurveyLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { nama } = JSON.parse(userInfo);
      setUserName(nama);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    toast({
      title: "Berhasil Logout",
      description: "Anda telah keluar dari aplikasi."
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-2 lg:p-4 bg-orange-200">
      <div className="max-w-none w-full mx-auto">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span className="font-medium">{userName}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

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

            {currentPage >= 2 && onPageJump && <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    {Array.from({
                  length: totalPages
                }, (_, i) => <PaginationItem key={i + 1}>
                        <PaginationLink onClick={() => onPageJump(i + 1)} isActive={currentPage === i + 1} className="cursor-pointer">
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>)}
                  </PaginationContent>
                </Pagination>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};