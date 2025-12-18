import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { SurveyData } from "@/types/survey";
import { useToast } from "@/hooks/use-toast";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assignment {
  nks: string;
  kecamatan: string;
  desa: string;
  sls: string;
  alamat: string;
  noSampelList: string[];
  namaKrtList: string[];
}

interface UserAssignments {
  user: string;
  pencacah: string;
  pemeriksa: string;
  assignments: Assignment[];
}

interface Page1IdentityProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}

export const Page1Identity = ({
  data,
  updateData
}: Page1IdentityProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignments | null>(null);
  const [selectedNksIndex, setSelectedNksIndex] = useState<number | null>(null);
  const [selectedNoSampelIndex, setSelectedNoSampelIndex] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch user assignments on mount
  useEffect(() => {
    const fetchUserAssignments = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        // 1. Dapatkan session dari Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error(`Error sesi: ${sessionError.message}`);
        }

        if (!session) {
          setFetchError("Anda belum login. Silakan login terlebih dahulu.");
          return;
        }

        // 2. Ambil user data dari session
        const user = session.user;
        const userEmail = user.email;
        const userName = user.user_metadata?.nama || user.user_metadata?.full_name || userEmail?.split('@')[0] || user.id.substring(0, 8);

        console.log('Fetching assignments for user:', { userName, userEmail });

        // 3. Panggil Edge Function dengan username
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: userName }
        });

        if (error) {
          console.error('Edge Function error:', error);
          throw new Error(`Error dari server: ${error.message}`);
        }

        if (!response) {
          throw new Error("Tidak ada respon dari server");
        }

        // 4. Handle berbagai format response
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.success && response.data) {
          setUserAssignments(response.data);
          
          // Auto-fill nama petugas dan pemeriksa
          updateData({
            namaPendata: userName,
            pemeriksa: response.data.pemeriksa || ''
          });
          
          console.log('Assignments loaded successfully:', response.data.assignments.length);
        } else {
          // Coba format response alternatif
          if (response.data && response.data.assignments) {
            setUserAssignments(response.data);
            updateData({
              namaPendata: userName,
              pemeriksa: response.data.pemeriksa || ''
            });
          } else {
            throw new Error("Format data tidak valid dari server");
          }
        }
      } catch (error: any) {
        console.error('Error fetching user assignments:', error);
        
        // Berikan pesan error yang lebih spesifik
        let errorMessage = error.message || "Gagal memuat data penugasan";
        
        if (error.message.includes('sesi') || error.message.includes('login')) {
          errorMessage = "Sesi login tidak valid. Silakan login ulang.";
        } else if (error.message.includes('Format data')) {
          errorMessage = "Data penugasan tidak dalam format yang diharapkan.";
        } else if (error.message.includes('tidak ada respon')) {
          errorMessage = "Server tidak merespon. Periksa koneksi internet.";
        }
        
        setFetchError(errorMessage);
        
        toast({
          title: "Gagal Memuat Data Penugasan",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAssignments();
  }, [toast, updateData]);

  const handleNksChange = (value: string) => {
    const index = parseInt(value);
    setSelectedNksIndex(index);
    setSelectedNoSampelIndex(null);
    
    if (userAssignments && index >= 0 && index < userAssignments.assignments.length) {
      const assignment = userAssignments.assignments[index];
      updateData({
        nks: assignment.nks,
        kecamatan: assignment.kecamatan,
        desa: assignment.desa,
        sls: assignment.sls,
        alamat: assignment.alamat,
        noSampel: '',
        namaKepalaRumahTangga: ''
      });
    }
  };

  const handleNoSampelChange = (value: string) => {
    const index = parseInt(value);
    setSelectedNoSampelIndex(index);
    
    if (userAssignments && selectedNksIndex !== null) {
      const assignment = userAssignments.assignments[selectedNksIndex];
      if (assignment && index >= 0 && index < assignment.noSampelList.length) {
        updateData({
          noSampel: assignment.noSampelList[index],
          namaKepalaRumahTangga: assignment.namaKrtList[index] || ''
        });
      }
    }
  };

  const handleLoadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonString = e.target?.result as string;
        const importData = JSON.parse(jsonString);
        
        if (importData.surveyData) {
          updateData(importData.surveyData);
          toast({
            title: "Data Berhasil Dimuat",
            description: "Data survei telah berhasil dimuat dari file."
          });
        } else {
          throw new Error("Format file tidak valid");
        }
      } catch (error) {
        toast({
          title: "Gagal Memuat Data",
          description: "File yang dipilih tidak valid atau rusak.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addAnggotaRumahTangga = () => {
    const newAnggota = [...data.namaAnggotaRumahTangga, ""];
    updateData({
      namaAnggotaRumahTangga: newAnggota,
      jumlahAnggotaRumahTangga: newAnggota.length
    });
  };

  const removeAnggotaRumahTangga = (index: number) => {
    if (data.namaAnggotaRumahTangga.length <= 1) return;
    
    const newAnggota = data.namaAnggotaRumahTangga.filter((_, i) => i !== index);
    updateData({
      namaAnggotaRumahTangga: newAnggota,
      jumlahAnggotaRumahTangga: newAnggota.length
    });
  };

  const updateAnggotaRumahTangga = (index: number, value: string) => {
    const newAnggota = [...data.namaAnggotaRumahTangga];
    newAnggota[index] = value;
    updateData({
      namaAnggotaRumahTangga: newAnggota
    });
  };

  const retryFetchAssignments = async () => {
    setFetchError(null);
    setIsLoading(true);

    try {
      // Dapatkan session lagi untuk memastikan data terbaru
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setFetchError("Anda belum login. Silakan login ulang.");
        toast({
          title: "Login Diperlukan",
          description: "Silakan login terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      const user = session.user;
      const userName = user.user_metadata?.nama || user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || user.id.substring(0, 8);

      const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
        body: { username: userName }
      });

      if (error) throw error;

      if (response?.success && response.data) {
        setUserAssignments(response.data);
        updateData({
          namaPendata: userName,
          pemeriksa: response.data.pemeriksa || ''
        });
        
        toast({
          title: "Data Berhasil Dimuat",
          description: "Data penugasan berhasil dimuat ulang."
        });
      } else if (response?.data) {
        // Fallback untuk format response alternatif
        setUserAssignments(response.data);
        updateData({
          namaPendata: userName,
          pemeriksa: response.data.pemeriksa || ''
        });
        
        toast({
          title: "Data Berhasil Dimuat",
          description: "Data penugasan berhasil dimuat ulang."
        });
      } else {
        throw new Error("Format response tidak dikenali");
      }
    } catch (error: any) {
      console.error('Retry error:', error);
      setFetchError(error.message || "Gagal memuat data. Silakan coba lagi.");
      
      toast({
        title: "Gagal Memuat Data",
        description: error.message || "Terjadi kesalahan saat memuat data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk logout jika session bermasalah
  const handleLogoutRedirect = () => {
    supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-600">Keterangan Identitas</h2>
        
        <div className="relative">
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".json" 
            onChange={handleLoadData} 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2" 
            variant="outline" 
            size="sm"
          >
            <Upload className="h-4 w-4" />
            Unggah Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Memuat data penugasan...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex flex-col space-y-3">
            <div className="text-destructive font-medium">Gagal Memuat Data Penugasan</div>
            <div className="text-sm text-muted-foreground">{fetchError}</div>
            
            <div className="flex gap-2">
              <Button onClick={retryFetchAssignments} variant="default" size="sm">
                Coba Lagi
              </Button>
              
              {fetchError.includes("login") && (
                <Button onClick={handleLogoutRedirect} variant="outline" size="sm">
                  Ke Halaman Login
                </Button>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p>Tip: Pastikan:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Edge Function sudah dikonfigurasi dengan benar di Supabase</li>
                <li>Username Anda terdaftar dalam spreadsheet penugasan</li>
                <li>Session login masih valid</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom 1: Nama Petugas Pendataan Lapangan */}
            <div className="space-y-2">
              <Label htmlFor="namaPendata">Nama Petugas Pendataan Lapangan</Label>
              <Input 
                id="namaPendata" 
                value={data.namaPendata} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari login" 
              />
            </div>

            {/* Kolom 2: Pemeriksa */}
            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input 
                id="pemeriksa" 
                value={data.pemeriksa} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ pemeriksa: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari data" : "Masukkan nama pemeriksa"} 
              />
            </div>

            {/* Kolom 3: NKS */}
            <div className="space-y-2">
              <Label htmlFor="nks">NKS</Label>
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
                disabled={!userAssignments || userAssignments.assignments.length === 0}
              >
                <SelectTrigger className={
                  !userAssignments ? "bg-gray-100" : 
                  userAssignments.assignments.length === 0 ? "border-amber-200 bg-amber-50" : ""
                }>
                  <SelectValue placeholder={
                    !userAssignments ? "Data belum dimuat" : 
                    userAssignments.assignments.length === 0 ? "Tidak ada penugasan" : 
                    "Pilih NKS"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {userAssignments?.assignments.map((assignment, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {assignment.nks}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {userAssignments?.assignments.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Tidak ada penugasan ditemukan untuk username Anda
                </p>
              )}
            </div>

            {/* Kolom 4: Kecamatan */}
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input 
                id="kecamatan" 
                value={data.kecamatan} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ kecamatan: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan kecamatan"} 
              />
            </div>

            {/* Kolom 5: Desa/Kelurahan */}
            <div className="space-y-2">
              <Label htmlFor="desa">Desa/Kelurahan</Label>
              <Input 
                id="desa" 
                value={data.desa} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ desa: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan desa"} 
              />
            </div>

            {/* Kolom 6: SLS */}
            <div className="space-y-2">
              <Label htmlFor="sls">SLS</Label>
              <Input 
                id="sls" 
                value={data.sls} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ sls: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan SLS"} 
              />
            </div>

            {/* Kolom 7: No Sampel */}
            <div className="space-y-2">
              <Label htmlFor="noSampel">No Sampel</Label>
              <Select 
                onValueChange={handleNoSampelChange} 
                value={selectedNoSampelIndex !== null ? selectedNoSampelIndex.toString() : undefined}
                disabled={!userAssignments || selectedNksIndex === null}
              >
                <SelectTrigger className={
                  !userAssignments ? "bg-gray-100" : 
                  selectedNksIndex === null ? "bg-gray-100" : ""
                }>
                  <SelectValue placeholder={
                    !userAssignments ? "Data belum dimuat" : 
                    selectedNksIndex === null ? "Pilih NKS dahulu" : 
                    "Pilih No Sampel"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {selectedNksIndex !== null && userAssignments?.assignments[selectedNksIndex]?.noSampelList.map((noSampel, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {noSampel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kolom 8: Alamat */}
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                value={data.alamat} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ alamat: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan alamat"} 
              />
            </div>

            {/* Kolom 9: Nama Kepala Rumah Tangga */}
            <div className="space-y-2">
              <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
              <Input 
                id="namaKepalaRumahTangga" 
                value={data.namaKepalaRumahTangga} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ namaKepalaRumahTangga: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari No Sampel" : "Masukkan nama kepala rumah tangga"} 
              />
            </div>
          </div>

          {/* Bagian Anggota Rumah Tangga */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nama Anggota Rumah Tangga</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addAnggotaRumahTangga} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Anggota
              </Button>
            </div>

            <div className="space-y-3">
              {data.namaAnggotaRumahTangga.map((nama, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Label className="min-w-fit">#{index + 1}</Label>
                  <Input 
                    value={nama} 
                    onChange={e => updateAnggotaRumahTangga(index, e.target.value)} 
                    placeholder={`Nama anggota rumah tangga ${index + 1}`} 
                    className="flex-1" 
                  />
                  {data.namaAnggotaRumahTangga.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeAnggotaRumahTangga(index)} 
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              Jumlah Anggota Rumah Tangga: {data.jumlahAnggotaRumahTangga}
            </div>
          </div>
        </>
      )}
    </div>
  );
};