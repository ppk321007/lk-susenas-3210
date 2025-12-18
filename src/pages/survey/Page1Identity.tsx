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

// Ganti useEffect dengan ini:
useEffect(() => {
  const fetchUserAssignments = async () => {
    setIsLoading(true);

    try {
      console.log('=== FETCHING USER ASSIGNMENTS ===');
      
      // Coba beberapa cara untuk mendapatkan username
      let username = '';
      
      // Cara 1: Dari localStorage (cara lama)
      try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          username = userData.user?.nama || userData.nama || '';
          console.log('Username from localStorage userData:', username);
        }
      } catch (e) {
        console.log('Error reading from localStorage:', e);
      }
      
      // Cara 2: Dari sessionStorage (mungkin Anda simpan di sini)
      if (!username) {
        try {
          const sessionUser = sessionStorage.getItem('user');
          if (sessionUser) {
            const parsed = JSON.parse(sessionUser);
            username = parsed.nama || parsed.username || '';
            console.log('Username from sessionStorage:', username);
          }
        } catch (e) {
          console.log('Error reading from sessionStorage:', e);
        }
      }
      
      // Cara 3: Coba ambil dari URL atau state management
      if (!username) {
        // Cek URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get('username') || '';
        console.log('Username from URL params:', username);
      }
      
      // Cara 4: Untuk testing langsung, gunakan username yang ada di spreadsheet
      if (!username) {
        // DAFTAR USER YANG ADA DI SPREADSHEET MARET25
        const possibleUsers = ['ppk3210', 'petugas-1', 'User', 'NamaUser'];
        // Pilih yang pertama untuk testing
        username = possibleUsers[0];
        console.log('Using test username:', username);
        
        // Simpan ke localStorage untuk testing
        localStorage.setItem('userData', JSON.stringify({
          success: true,
          user: { nama: username, role: 'test' }
        }));
      }
      
      if (!username) {
        console.error('❌ Tidak bisa mendapatkan username!');
        toast({
          title: "Login Diperlukan",
          description: "Silakan login terlebih dahulu.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`🔍 Mencari assignments untuk: "${username}"`);
      
      // Panggil function untuk mendapatkan assignments
      const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
        body: { username: username }
      });

      if (error) {
        console.error('❌ Error dari function:', error);
        throw error;
      }

      console.log('📋 Response dari get-user-assignments:', response);

      if (response?.success && response.data) {
        console.log('✅ Assignments ditemukan:', response.data.assignments);
        setUserAssignments(response.data);
        
        // Auto-fill data
        updateData({
          namaPendata: username,
          pencacah: response.data.pencacah || '',
          pemeriksa: response.data.pemeriksa || ''
        });
        
        toast({
          title: "Data Penugasan Dimuat",
          description: `Berhasil memuat ${response.data.assignments.length} NKS`,
        });
      } else {
        console.log('⚠️ Tidak ada assignments ditemukan');
        toast({
          title: "Data Tidak Ditemukan",
          description: response?.message || "User ini belum memiliki penugasan.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memuat data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserAssignments();
}, []);

  const handleNksChange = (value: string) => {
    const index = parseInt(value);
    setSelectedNksIndex(index);
    setSelectedNoSampelIndex(null); // Reset no sampel selection
    
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
      if (index >= 0 && index < assignment.noSampelList.length) {
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

    // Reset input
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-600">Keterangan Identitas</h2>
        
        {/* Load Data Button */}
        <div className="relative">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadData} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            Unggah Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Memuat data penugasan...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="pencacah">Pencacah</Label>
              <Input 
                id="pencacah" 
                value={data.pencacah} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari data" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input 
                id="pemeriksa" 
                value={data.pemeriksa} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari data" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nks">NKS</Label>
              <Select onValueChange={handleNksChange} value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih NKS" />
                </SelectTrigger>
                <SelectContent>
                  {userAssignments?.assignments.map((assignment, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {assignment.nks}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input 
                id="kecamatan" 
                value={data.kecamatan} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desa">Desa/Kelurahan</Label>
              <Input 
                id="desa" 
                value={data.desa} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sls">SLS</Label>
              <Input 
                id="sls" 
                value={data.sls} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noSampel">No Sampel</Label>
              <Select 
                onValueChange={handleNoSampelChange} 
                value={selectedNoSampelIndex !== null ? selectedNoSampelIndex.toString() : undefined}
                disabled={selectedNksIndex === null}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedNksIndex === null ? "Pilih NKS dahulu" : "Pilih No Sampel"} />
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

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                value={data.alamat} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
              <Input 
                id="namaKepalaRumahTangga" 
                value={data.namaKepalaRumahTangga} 
                readOnly
                className="bg-muted"
                placeholder="Otomatis dari No Sampel" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nama Anggota Rumah Tangga</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAnggotaRumahTangga} className="flex items-center gap-2">
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
                    <Button type="button" variant="outline" size="sm" onClick={() => removeAnggotaRumahTangga(index)} className="flex items-center gap-2">
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
