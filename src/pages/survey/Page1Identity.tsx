import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, Loader2, RefreshCw } from "lucide-react";
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
  onHouseholdChange?: (nks: string, noSampel: string) => Promise<any>;
  resetSurveyData?: (identityData: Partial<SurveyData>) => void;
  onHouseholdLoadComplete?: () => void;
}

export const Page1Identity = ({
  data,
  updateData,
  onHouseholdChange,
  resetSurveyData,
  onHouseholdLoadComplete
}: Page1IdentityProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignments | null>(null);
  const [selectedNksIndex, setSelectedNksIndex] = useState<number | null>(null);
  const [selectedNoSampelIndex, setSelectedNoSampelIndex] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch user assignments on mount
  useEffect(() => {
    const fetchUserAssignments = async () => {
      const stored = localStorage.getItem('userInfo') ?? sessionStorage.getItem('user');
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const nama = (parsed?.nama ?? "").toString().trim();
      if (!nama) return;

      // Normalize storage so other pages/components can read consistently
      if (!localStorage.getItem('userInfo')) {
        localStorage.setItem('userInfo', JSON.stringify(parsed));
      }
      setIsLoading(true);
      setLoadError(null);

      try {
        console.log('Attempting to fetch assignments for username:', nama);
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: nama }
        });

        if (error) {
          console.error('Supabase function error:', error);
          const errorDetails = error.context?.status ? ` (Status: ${error.context.status})` : '';
          throw new Error(`Supabase Function Error: ${error.message || 'Unknown error'}${errorDetails}`);
        }

        console.log('Response from get-user-assignments:', response);

        if (!response) {
          throw new Error('Respons kosong dari server - periksa apakah Supabase function sudah ter-deploy');
        }

        if (!response.success) {
          const errorMsg = response.error || response.message || 'Gagal memuat data penugasan';
          console.error('Response error:', errorMsg);
          throw new Error(errorMsg);
        }

        if (!response.data) {
          throw new Error('Data penugasan tidak tersedia - silakan hubungi administrator');
        }

        if (!Array.isArray(response.data.assignments) || response.data.assignments.length === 0) {
          const errorMsg = 'Tidak ada penugasan yang ditemukan untuk petugas: ' + nama;
          console.warn('No assignments found:', response.data);
          setLoadError(errorMsg);
          setIsLoading(false);
          toast({
            title: "Data Tidak Ditemukan",
            description: errorMsg,
            variant: "destructive"
          });
          return;
        }

        setUserAssignments(response.data);
        // Auto-fill pencacah and pemeriksa
        updateData({
          namaPendata: nama,
          pencacah: response.data.pencacah || '',
          pemeriksa: response.data.pemeriksa || ''
        });

        // If we already have data.nks and data.noSampel, restore the selection
        if (data.nks && data.noSampel && !hasInitialized) {
          const nksIdx = response.data.assignments.findIndex(
            (a: Assignment) => a.nks === data.nks
          );
          if (nksIdx >= 0) {
            setSelectedNksIndex(nksIdx);
            const noSampelIdx = response.data.assignments[nksIdx].noSampelList.findIndex(
              (ns: string) => ns === data.noSampel
            );
            if (noSampelIdx >= 0) {
              setSelectedNoSampelIndex(noSampelIdx);
            }
          }
          setHasInitialized(true);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data';
        console.error('Error fetching user assignments:', error);
        console.error('Full error object:', error);
        setLoadError(errorMessage);
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
  }, []);

  // Note: loadExistingHouseholdData logic is now integrated into handleNoSampelChange
  // to prevent race conditions where reset/save happens before load completes

  const handleNksChange = async (value: string) => {
    const index = parseInt(value);
    setSelectedNksIndex(index);
    setSelectedNoSampelIndex(null); // Reset no sampel selection
    
    if (userAssignments && index >= 0 && index < userAssignments.assignments.length) {
      const assignment = userAssignments.assignments[index];
      
      // If we have resetSurveyData, use it to reset while keeping identity
      if (resetSurveyData) {
        resetSurveyData({
          namaPendata: data.namaPendata,
          pencacah: data.pencacah,
          pemeriksa: data.pemeriksa,
          nks: assignment.nks,
          kecamatan: assignment.kecamatan,
          desa: assignment.desa,
          sls: assignment.sls,
          alamat: assignment.alamat,
          noSampel: '',
          namaKepalaRumahTangga: ''
        });
      } else {
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
    }
  };

  const handleNoSampelChange = async (value: string) => {
    const index = parseInt(value);
    setSelectedNoSampelIndex(index);
    
    if (userAssignments && selectedNksIndex !== null) {
      const assignment = userAssignments.assignments[selectedNksIndex];
      if (index >= 0 && index < assignment.noSampelList.length) {
        const newNoSampel = assignment.noSampelList[index];
        const newNamaKrt = assignment.namaKrtList[index] || '';
        
        setIsLoadingData(true);
        
        try {
          // FIRST: Load existing data from spreadsheet BEFORE resetting
          let loadedData: any = null;
          if (onHouseholdChange) {
            const result = await onHouseholdChange(assignment.nks, newNoSampel);
            if (result?.success && result?.data) {
              loadedData = result.data;
            }
          }
          
          // NOW: Apply data - either loaded data or fresh reset
          if (loadedData) {
            // We have existing data - use it
            updateData({
              ...loadedData,
              // Ensure identity fields are correct
              namaPendata: data.namaPendata,
              pencacah: data.pencacah,
              pemeriksa: data.pemeriksa,
              nks: assignment.nks,
              kecamatan: assignment.kecamatan,
              desa: assignment.desa,
              sls: assignment.sls,
              alamat: assignment.alamat,
              noSampel: newNoSampel,
              namaKepalaRumahTangga: loadedData.namaKepalaRumahTangga || newNamaKrt
            });
            toast({
              title: "Data Ditemukan",
              description: "Data survei yang sudah ada berhasil dimuat."
            });
          } else {
            // No existing data - reset to fresh state
            if (resetSurveyData) {
              resetSurveyData({
                namaPendata: data.namaPendata,
                pencacah: data.pencacah,
                pemeriksa: data.pemeriksa,
                nks: assignment.nks,
                kecamatan: assignment.kecamatan,
                desa: assignment.desa,
                sls: assignment.sls,
                alamat: assignment.alamat,
                noSampel: newNoSampel,
                namaKepalaRumahTangga: newNamaKrt
              });
            } else {
              updateData({
                noSampel: newNoSampel,
                namaKepalaRumahTangga: newNamaKrt
              });
            }
          }
          
          // Signal that data has been applied to state - re-enables auto-save
          onHouseholdLoadComplete?.();
        } catch (error) {
          console.error('Error loading household data:', error);
          // On error, still update identity fields
          updateData({
            noSampel: newNoSampel,
            namaKepalaRumahTangga: newNamaKrt
          });
          // Also signal completion on error
          onHouseholdLoadComplete?.();
        } finally {
          setIsLoadingData(false);
        }
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

      {isLoadingData && (
        <div className="flex items-center justify-center py-2 bg-blue-50 rounded-md">
          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-blue-600" />
          <span className="text-sm text-blue-600">Memuat data rumah tangga...</span>
        </div>
      )}

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
              {loadError && (
                <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200 mb-2 space-y-1">
                  <div className="font-semibold">⚠️ Gagal Memuat Data Penugasan</div>
                  <div>{loadError}</div>
                  <div className="text-xs text-red-600 mt-2">
                    Solusi: 
                    <ul className="list-disc ml-4 mt-1">
                      <li>Periksa koneksi internet</li>
                      <li>Pastikan username/nama sudah benar</li>
                      <li>Silakan refresh halaman</li>
                      <li>Hubungi administrator jika masalah berlanjut</li>
                    </ul>
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 mb-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat daftar NKS...
                </div>
              )}
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
              >
                <SelectTrigger disabled={isLoading || !userAssignments || !userAssignments.assignments || userAssignments.assignments.length === 0}>
                  <SelectValue placeholder={isLoading ? "Memuat..." : !userAssignments ? "Gagal memuat" : userAssignments.assignments?.length === 0 ? "Tidak ada penugasan" : "Pilih NKS"} />
                </SelectTrigger>
                <SelectContent>
                  {userAssignments?.assignments && userAssignments.assignments.length > 0 ? (
                    userAssignments.assignments.map((assignment, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {assignment.nks} - {assignment.desa}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isLoading ? "Sedang memuat..." : "Tidak ada penugasan tersedia"}
                    </div>
                  )}
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
                disabled={selectedNksIndex === null || !userAssignments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedNksIndex === null ? "Pilih NKS dahulu" : selectedNoSampelIndex === null && userAssignments?.assignments[selectedNksIndex]?.noSampelList?.length === 0 ? "Tidak ada sampel" : "Pilih No Sampel"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedNksIndex !== null && userAssignments?.assignments[selectedNksIndex]?.noSampelList && userAssignments.assignments[selectedNksIndex].noSampelList.length > 0 ? (
                    userAssignments.assignments[selectedNksIndex].noSampelList.map((noSampel, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {noSampel}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {selectedNksIndex === null ? "Pilih NKS terlebih dahulu" : "Tidak ada sampel"}
                    </div>
                  )}
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
    </div>
  );
};
