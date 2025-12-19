import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, Loader2, RefreshCw } from "lucide-react";
import { SurveyData } from "@/types/survey";
import { useToast } from "@/hooks/use-toast";
import { useRef, useEffect, useState, useCallback } from "react";
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
}

export const Page1Identity = ({
  data,
  updateData,
  onHouseholdChange,
  resetSurveyData
}: Page1IdentityProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignments | null>(null);
  const [selectedNksIndex, setSelectedNksIndex] = useState<number | null>(null);
  const [selectedNoSampelIndex, setSelectedNoSampelIndex] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

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

      try {
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: nama }
        });

        if (error) throw error;

        if (response?.success && response.data) {
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
        }
      } catch (error) {
        console.error('Error fetching user assignments:', error);
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

  // Load existing survey data for a household
  const loadExistingHouseholdData = useCallback(async (nks: string, noSampel: string) => {
    if (!onHouseholdChange) return;

    setIsLoadingData(true);
    try {
      const result = await onHouseholdChange(nks, noSampel);
      
      if (result?.success && result?.data) {
        // Found existing data, merge it
        const existingData = result.data;
        updateData({
          ...existingData,
          // Make sure we keep the current identity selections
          nks: nks,
          noSampel: noSampel
        });
        toast({
          title: "Data Ditemukan",
          description: "Data survei yang sudah ada berhasil dimuat."
        });
      }
    } catch (error) {
      console.error('Error loading household data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [onHouseholdChange, updateData, toast]);

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
        
        // If we have resetSurveyData, reset the survey data first
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
        
        // Try to load existing data for this household
        await loadExistingHouseholdData(assignment.nks, newNoSampel);
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
          {isLoadingData && (
            <div className="flex items-center justify-center py-2 bg-blue-50 rounded-md">
              <RefreshCw className="h-4 w-4 animate-spin mr-2 text-blue-600" />
              <span className="text-sm text-blue-600">Memuat data rumah tangga...</span>
            </div>
          )}

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
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
              >
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
