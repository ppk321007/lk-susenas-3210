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

interface UserAssignmentsResponse {
  success: boolean;
  data?: {
    user: string;
    role: string;
    pencacah: string;
    pemeriksa: string;
    assignments: Assignment[];
    message?: string;
  };
  error?: string;
  message?: string;
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
  const [userAssignments, setUserAssignments] = useState<UserAssignmentsResponse['data'] | null>(null);
  const [selectedNksIndex, setSelectedNksIndex] = useState<number | null>(null);
  const [selectedNoSampelIndex, setSelectedNoSampelIndex] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Dapatkan user info dari localStorage saja (tidak perlu Supabase auth)
  useEffect(() => {
    const getUserInfo = () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedInfo = JSON.parse(userInfo);
          // Coba beberapa kemungkinan key untuk username
          const name = parsedInfo.nama || 
                      parsedInfo.username || 
                      parsedInfo.user ||
                      parsedInfo.email?.split('@')[0] || 
                      'Pengguna';
          
          setUserName(name);
          // Update data survey dengan nama user
          if (name !== 'Pengguna') {
            updateData({ namaPendata: name });
          }
          console.log('User info dari localStorage:', name);
        } else {
          console.warn('Tidak ada userInfo di localStorage');
          setUserName('Pengguna');
        }
      } catch (error) {
        console.error('Error parsing localStorage:', error);
        setUserName('Pengguna');
      }
    };

    getUserInfo();
  }, [updateData]);

  // Fetch user assignments
  useEffect(() => {
    const fetchUserAssignments = async () => {
      if (!userName || userName === 'Pengguna') {
        console.log('Menunggu username yang valid...');
        return;
      }

      try {
        setIsLoading(true);
        setFetchError(null);

        console.log(`Mengambil data penugasan untuk: ${userName}`);

        // Panggil Edge Function
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: userName }
        });

        if (error) {
          console.error('Error dari Supabase Functions:', error);
          throw new Error(`Error server: ${error.message}`);
        }

        // Validasi response
        if (!response) {
          throw new Error("Tidak ada response dari server");
        }

        console.log('Response dari Edge Function:', response);

        if (response.success && response.data) {
          // Simpan data assignments
          setUserAssignments(response.data);
          
          // Auto-fill data ke form
          updateData({
            namaPendata: response.data.user,
            pemeriksa: response.data.pemeriksa || '',
            // Anda bisa menambahkan auto-fill lainnya di sini
          });
          
          console.log(`✓ Berhasil memuat ${response.data.assignments.length} penugasan`);
          
          // Jika ada message dari server (contoh: "belum ada penugasan")
          if (response.data.message) {
            toast({
              title: "Info Penugasan",
              description: response.data.message,
              variant: "default"
            });
          }
        } else if (response.message) {
          // Jika ada message error
          throw new Error(response.message);
        } else {
          throw new Error("Format response tidak valid");
        }
      } catch (error: any) {
        console.error('Error fetching assignments:', error);
        
        // Tentukan pesan error yang user-friendly
        let errorMessage = error.message || "Gagal memuat data penugasan";
        
        if (error.message.includes('tidak terdaftar')) {
          errorMessage = "Username Anda tidak terdaftar di sistem. Hubungi administrator.";
        } else if (error.message.includes('koneksi')) {
          errorMessage = "Koneksi internet terputus. Periksa koneksi Anda.";
        } else if (error.message.includes('server')) {
          errorMessage = "Server sedang mengalami masalah. Coba lagi nanti.";
        }
        
        setFetchError(errorMessage);
        
        toast({
          title: "Gagal Memuat Data",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Hanya fetch jika userName valid
    if (userName && userName !== 'Pengguna') {
      fetchUserAssignments();
    }
  }, [userName, toast, updateData]);

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
      // Refresh username dari localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          const name = parsedInfo.nama || 
                      parsedInfo.username || 
                      parsedInfo.user ||
                      parsedInfo.email?.split('@')[0] || 
                      'Pengguna';
          
          if (name !== userName && name !== 'Pengguna') {
            setUserName(name);
          }
        } catch (error) {
          console.error('Error parsing localStorage:', error);
        }
      }

      if (!userName || userName === 'Pengguna') {
        throw new Error("Silakan login ulang untuk mendapatkan username");
      }

      // Panggil ulang Edge Function
      const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
        body: { username: userName }
      });

      if (error) throw error;

      if (response?.success && response.data) {
        setUserAssignments(response.data);
        updateData({
          namaPendata: response.data.user,
          pemeriksa: response.data.pemeriksa || ''
        });
        
        toast({
          title: "Data Berhasil Dimuat Ulang",
          description: "Data penugasan berhasil dimuat ulang."
        });
      } else if (response?.message) {
        throw new Error(response.message);
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

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const handleManualEntry = () => {
    // Mode manual: user bisa input data sendiri
    setUserAssignments(null);
    setFetchError(null);
    toast({
      title: "Mode Input Manual",
      description: "Silakan isi data secara manual di form bawah.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-600">Keterangan Identitas</h2>
        
        <div className="flex items-center gap-2">
          {userName && userName !== 'Pengguna' && (
            <div className="text-sm text-muted-foreground hidden md:block">
              User: <span className="font-medium">{userName}</span>
            </div>
          )}
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
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {userName ? `Memuat data penugasan untuk ${userName}...` : "Memuat data pengguna..."}
          </span>
          <span className="text-xs text-muted-foreground">Membaca dari Google Sheets...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex flex-col space-y-3">
            <div className="text-destructive font-medium">Gagal Memuat Data Penugasan</div>
            <div className="text-sm text-muted-foreground">{fetchError}</div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={retryFetchAssignments} variant="default" size="sm">
                Coba Lagi
              </Button>
              
              <Button onClick={handleLoginRedirect} variant="outline" size="sm">
                Login Ulang
              </Button>
              
              <Button onClick={handleManualEntry} variant="ghost" size="sm">
                Input Manual
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p className="font-medium">Penyelesaian masalah:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Pastikan username Anda terdaftar di spreadsheet USER</li>
                <li>Pastikan Anda memiliki penugasan di spreadsheet PETUGAS</li>
                <li>Periksa koneksi internet Anda</li>
                <li>Hubungi admin jika masalah berlanjut</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tampilkan info role jika ada */}
          {userAssignments?.role && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Role:</span> {userAssignments.role}
                  {userAssignments.pencacah && (
                    <span className="ml-4">
                      <span className="font-medium">Pencacah:</span> {userAssignments.pencacah}
                    </span>
                  )}
                </div>
                {userAssignments.assignments.length > 0 && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {userAssignments.assignments.length} penugasan ditemukan
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom 1: Nama Petugas Pendataan Lapangan */}
            <div className="space-y-2">
              <Label htmlFor="namaPendata">Nama Petugas Pendataan Lapangan</Label>
              <Input 
                id="namaPendata" 
                value={data.namaPendata || userName} 
                readOnly={!!userAssignments}
                onChange={(e) => !userAssignments && updateData({ namaPendata: e.target.value })}
                className={userAssignments ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari login" : "Masukkan nama petugas"} 
              />
            </div>

            {/* Kolom 2: Pemeriksa */}
            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input 
                id="pemeriksa" 
                value={data.pemeriksa || userAssignments?.pemeriksa || ''} 
                readOnly={!!userAssignments?.pemeriksa}
                onChange={(e) => !userAssignments?.pemeriksa && updateData({ pemeriksa: e.target.value })}
                className={userAssignments?.pemeriksa ? "bg-muted" : ""}
                placeholder={userAssignments?.pemeriksa ? "Otomatis dari data" : "Masukkan nama pemeriksa"} 
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
                      {assignment.nks} - {assignment.kecamatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {userAssignments?.assignments.length === 0 && userName && userName !== 'Pengguna' && (
                <p className="text-xs text-amber-600 mt-1">
                  Tidak ada penugasan ditemukan untuk username "{userName}"
                </p>
              )}
            </div>

            {/* Kolom 4: Kecamatan */}
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input 
                id="kecamatan" 
                value={data.kecamatan} 
                readOnly={!!userAssignments && selectedNksIndex !== null}
                onChange={(e) => !userAssignments && updateData({ kecamatan: e.target.value })}
                className={userAssignments && selectedNksIndex !== null ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan kecamatan"} 
              />
            </div>

            {/* Kolom 5: Desa/Kelurahan */}
            <div className="space-y-2">
              <Label htmlFor="desa">Desa/Kelurahan</Label>
              <Input 
                id="desa" 
                value={data.desa} 
                readOnly={!!userAssignments && selectedNksIndex !== null}
                onChange={(e) => !userAssignments && updateData({ desa: e.target.value })}
                className={userAssignments && selectedNksIndex !== null ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan desa"} 
              />
            </div>

            {/* Kolom 6: SLS */}
            <div className="space-y-2">
              <Label htmlFor="sls">SLS</Label>
              <Input 
                id="sls" 
                value={data.sls} 
                readOnly={!!userAssignments && selectedNksIndex !== null}
                onChange={(e) => !userAssignments && updateData({ sls: e.target.value })}
                className={userAssignments && selectedNksIndex !== null ? "bg-muted" : ""}
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
                readOnly={!!userAssignments && selectedNksIndex !== null}
                onChange={(e) => !userAssignments && updateData({ alamat: e.target.value })}
                className={userAssignments && selectedNksIndex !== null ? "bg-muted" : ""}
                placeholder={userAssignments ? "Otomatis dari NKS" : "Masukkan alamat"} 
              />
            </div>

            {/* Kolom 9: Nama Kepala Rumah Tangga */}
            <div className="space-y-2">
              <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
              <Input 
                id="namaKepalaRumahTangga" 
                value={data.namaKepalaRumahTangga} 
                readOnly={!!userAssignments && selectedNoSampelIndex !== null}
                onChange={(e) => !userAssignments && updateData({ namaKepalaRumahTangga: e.target.value })}
                className={userAssignments && selectedNoSampelIndex !== null ? "bg-muted" : ""}
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