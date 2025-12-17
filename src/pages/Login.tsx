import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, User, Lock } from "lucide-react";

const Login = () => {
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nama.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Nama dan password harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-login', {
        body: { nama: nama.trim(), password: password.trim() }
      });

      if (error) throw error;

      if (data.success) {
        // Store user info in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: "Berhasil",
          description: `Selamat datang, ${data.user.nama}!`,
        });
        
        navigate('/');
      } else {
        toast({
          title: "Login Gagal",
          description: data.message || "Nama atau password salah",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Animated light orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" 
             style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" 
             style={{ animation: 'float 6s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"
             style={{ animation: 'float 10s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"
             style={{ animation: 'float 7s ease-in-out infinite reverse' }} />
        
        {/* Moving light streaks */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-px w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent top-1/4"
               style={{ animation: 'slideRight 4s linear infinite' }} />
          <div className="absolute h-px w-1/3 bg-gradient-to-r from-transparent via-blue-300/40 to-transparent top-1/2"
               style={{ animation: 'slideRight 5s linear infinite', animationDelay: '1s' }} />
          <div className="absolute h-px w-2/5 bg-gradient-to-r from-transparent via-purple-300/30 to-transparent top-3/4"
               style={{ animation: 'slideRight 6s linear infinite', animationDelay: '2s' }} />
        </div>
      </div>

      {/* Glass morphism login card */}
      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Selamat Datang</CardTitle>
          <CardDescription className="text-gray-300">
            Silakan masuk untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-white/90 font-medium">Nama</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama anda"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Masuk</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        
        @keyframes slideRight {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(200%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
