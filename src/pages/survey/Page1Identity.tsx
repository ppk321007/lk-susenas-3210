// components/Page1Identity.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isLoading, setIsLoading] = useState(true);
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

        // Get user info from localStorage
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          setFetchError('Informasi pengguna tidak ditemukan. Silakan login kembali.');
          setIsLoading(false);
          return;
        }

        let userInfo;
        try {
          userInfo = JSON.parse(userInfoStr);
        } catch (e) {
          setFetchError('Format informasi pengguna tidak valid.');
          setIsLoading(false);
          return;
        }

        const { nama } = userInfo;
        if (!nama) {
          setFetchError('Nama pengguna tidak ditemukan.');
          setIsLoading(false);
          return;
        }

        console.log('Fetching assignments for user:', nama);

        // Call edge function
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: nama }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Gagal memanggil fungsi: ${error.message}`);
        }

        console.log('API Response:', response);

        if (response?.success) {
          if (response.data) {
            console.log('Assignments data received:', response.data);
            setUserAssignments(response.data);
            
            // Auto-fill user data
            updateData({
              namaPendata: nama,
              pencacah: response.data.pencacah || '',
              pemeriksa: response.data.pemeriksa || ''
            });
            
            toast({
              title: "Data Berhasil Dimuat",
              description: `Data penugasan untuk ${nama} berhasil dimuat.`,
            });
          } else {
            setFetchError('Data penugasan tidak ditemukan untuk pengguna ini.');
          }
        } else {
          const errorMessage = response?.message || 'Gagal memuat data penugasan';
          setFetchError(errorMessage);
          toast({
            title: "Gagal Memuat Data",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Error fetching user assignments:', error);
        setFetchError(error.message || 'Terjadi kesalahan saat memuat data');
        toast({
          title: "Gagal Memuat Data",
          description: "Tidak dapat memuat data penugasan. Silakan coba lagi.",
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
      
      toast({
        title: "NKS Dipilih",
        description: `NKS ${assignment.nks} telah dipilih.`,
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
        
        toast({
          title: "No Sampel Dipilih",
          description: `No Sampel ${assignment.noSampelList[index]} telah dipilih.`,
        });
      }
    }
  };

  const handleLoadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importData = JSON.parse(jsonString);
        
        if (importData.surveyData) {
          updateData(importData.surveyData);
          toast({
            title: "Data Berhasil Dimuat",
            description: "Data survei telah berhasil dimuat dari file.",
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
    
    reader.onerror = () => {
      toast({
        title: "Gagal Membaca File",
        description: "Tidak dapat membaca file yang dipilih.",
        variant: "destructive"
      });
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
    
    toast({
      title: "Anggota Ditambahkan",
      description: "Anggota rumah tangga baru telah ditambahkan.",
    });
  };

  const removeAnggotaRumahTangga = (index: number) => {
    const newAnggota = data.namaAnggotaRumahTangga.filter((_, i) => i !== index);
    updateData({
      namaAnggotaRumahTangga: newAnggota,
      jumlahAnggotaRumahTangga: newAnggota.length
    });
    
    toast({
      title: "Anggota Dihapus",
      description: "Anggota rumah tangga telah dihapus.",
    });
  };

  const updateAnggotaRumahTangga = (index: number, value: string) => {
    const newAnggota = [...data.namaAnggotaRumahTangga];
    newAnggota[index] = value;
    updateData({
      namaAnggotaRumahTangga: newAnggota
    });
  };

  const renderAssignmentsInfo = () => {
    if (!userAssignments) return null;
    
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Petugas:</strong> {userAssignments.user} | 
          <strong> Pencacah:</strong> {userAssignments.pencacah} | 
          <strong> Pemeriksa:</strong> {userAssignments.pemeriksa}
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Total NKS: {userAssignments.assignments.length}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-600">Keterangan Identitas</h2>
        
        {/* Load Data Button */}
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
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
            Unggah Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Memuat data penugasan...</span>
          <span className="text-sm text-gray-500">Mohon tunggu sebentar</span>
        </div>
      ) : fetchError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fetchError}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {renderAssignmentsInfo()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Petugas */}
            <div className="space-y-2">
              <Label htmlFor="namaPendata">Nama Petugas Pendataan Lapangan</Label>
              <Input 
                id="namaPendata" 
                value={data.namaPendata} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari login" 
              />
              <p className="text-xs text-gray-500">Diisi otomatis dari data login</p>
            </div>

            {/* Pencacah */}
            <div className="space-y-2">
              <Label htmlFor="pencacah">Pencacah</Label>
              <Input 
                id="pencacah" 
                value={data.pencacah} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari data penugasan" 
              />
            </div>

            {/* Pemeriksa */}
            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input 
                id="pemeriksa" 
                value={data.pemeriksa} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari data penugasan" 
              />
            </div>

            {/* NKS Selection */}
            <div className="space-y-2">
              <Label htmlFor="nks">NKS *</Label>
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
                disabled={!userAssignments?.assignments?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !userAssignments?.assignments?.length 
                      ? "Tidak ada data NKS" 
                      : "Pilih NKS"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {userAssignments?.assignments.map((assignment, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {assignment.nks} - {assignment.desa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Pilih NKS dari daftar penugasan</p>
            </div>

            {/* Kecamatan */}
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input 
                id="kecamatan" 
                value={data.kecamatan} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis terisi setelah memilih NKS" 
              />
            </div>

            {/* Desa/Kelurahan */}
            <div className="space-y-2">
              <Label htmlFor="desa">Desa/Kelurahan</Label>
              <Input 
                id="desa" 
                value={data.desa} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis terisi setelah memilih NKS" 
              />
            </div>

            {/* SLS */}
            <div className="space-y-2">
              <Label htmlFor="sls">SLS</Label>
              <Input 
                id="sls" 
                value={data.sls} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis terisi setelah memilih NKS" 
              />
            </div>

            {/* No Sampel Selection */}
            <div className="space-y-2">
              <Label htmlFor="noSampel">No Sampel *</Label>
              <Select 
                onValueChange={handleNoSampelChange} 
                value={selectedNoSampelIndex !== null ? selectedNoSampelIndex.toString() : undefined}
                disabled={selectedNksIndex === null}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    selectedNksIndex === null 
                      ? "Pilih NKS terlebih dahulu" 
                      : "Pilih No Sampel"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {selectedNksIndex !== null && 
                   userAssignments?.assignments[selectedNksIndex]?.noSampelList.map((noSampel, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {noSampel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Pilih No Sampel setelah memilih NKS</p>
            </div>

            {/* Alamat */}
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                value={data.alamat} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis terisi setelah memilih NKS" 
              />
            </div>

            {/* Nama Kepala Rumah Tangga */}
            <div className="space-y-2">
              <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
              <Input 
                id="namaKepalaRumahTangga" 
                value={data.namaKepalaRumahTangga} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis terisi setelah memilih No Sampel" 
              />
            </div>
          </div>

          {/* Anggota Rumah Tangga Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Nama Anggota Rumah Tangga</Label>
                <p className="text-sm text-gray-500">Tambahkan semua anggota rumah tangga</p>
              </div>
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
                  <Label className="min-w-[40px] text-sm">#{index + 1}</Label>
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
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
              <strong>Jumlah Anggota Rumah Tangga:</strong> {data.jumlahAnggotaRumahTangga}
            </div>
          </div>

          {/* Instructions */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Petunjuk Pengisian:</strong>
              <ol className="list-decimal ml-4 mt-1 space-y-1">
                <li>Data petugas, pencacah, dan pemeriksa diisi otomatis dari sistem</li>
                <li>Pilih NKS dari daftar penugasan yang tersedia</li>
                <li>Setelah memilih NKS, pilih No Sampel yang sesuai</li>
                <li>Data wilayah akan terisi otomatis setelah memilih NKS</li>
                <li>Tambahkan semua anggota rumah tangga dengan tombol "Tambah Anggota"</li>
              </ol>
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};