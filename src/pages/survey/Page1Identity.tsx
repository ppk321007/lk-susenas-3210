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
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        setFetchError("Informasi pengguna tidak ditemukan. Silakan login ulang.");
        return;
      }

      try {
        const { nama } = JSON.parse(userInfo);
        setIsLoading(true);
        setFetchError(null);

        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: nama }
        });

        if (error) {
          console.error('Edge Function error:', error);
          throw new Error(`Error dari server: ${error.message}`);
        }

        if (!response) {
          throw new Error("Tidak ada respon dari server");
        }

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.success && response.data) {
          setUserAssignments(response.data);
          // Auto-fill nama petugas dan pemeriksa
          updateData({
            namaPendata: nama,
            pemeriksa: response.data.pemeriksa || ''
          });
        } else {
          throw new Error("Format data tidak valid");
        }
      } catch (error: any) {
        console.error('Error fetching user assignments:', error);
        setFetchError(error.message || "Gagal memuat data penugasan");
        
        toast({
          title: "Gagal Memuat Data Penugasan",
          description: error.message || "Tidak dapat memuat data penugasan. Silakan coba lagi nanti.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAssignments();
  }, [toast]);

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

  const retryFetchAssignments = () => {
    setFetchError(null);
    const fetchUserAssignments = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) return;

      const { nama } = JSON.parse(userInfo);
      setIsLoading(true);

      try {
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: nama }
        });

        if (error) throw error;

        if (response?.success && response.data) {
          setUserAssignments(response.data);
          updateData({
            namaPendata: nama,
            pemeriksa: response.data.pemeriksa || ''
          });
          toast({
            title: "Data Berhasil Dimuat",
            description: "Data penugasan berhasil dimuat ulang."
          });
        }
      } catch (error) {
        setFetchError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAssignments();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-600">Keterangan Identitas</h2>
        
        <div className="relative">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadData} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" variant="outline" size="sm">
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
            <Button onClick={retryFetchAssignments} variant="outline" size="sm" className="self-start">
              Coba Lagi
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              Tip: Pastikan Edge Function sudah dikonfigurasi dengan benar di Supabase.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom 1 */}
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

            {/* Kolom 2 */}
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

            {/* Kolom 3 */}
            <div className="space-y-2">
              <Label htmlFor="nks">NKS</Label>
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
                disabled={!userAssignments || userAssignments.assignments.length === 0}
              >
                <SelectTrigger>
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
            </div>

            {/* Kolom 4 */}
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

            {/* Kolom 5 */}
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

            {/* Kolom 6 */}
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

            {/* Kolom 7 */}
            <div className="space-y-2">
              <Label htmlFor="noSampel">No Sampel</Label>
              <Select 
                onValueChange={handleNoSampelChange} 
                value={selectedNoSampelIndex !== null ? selectedNoSampelIndex.toString() : undefined}
                disabled={!userAssignments || selectedNksIndex === null}
              >
                <SelectTrigger>
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

            {/* Kolom 8 */}
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

            {/* Kolom 9 */}
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