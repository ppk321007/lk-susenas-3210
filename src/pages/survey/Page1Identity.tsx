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

  // Fetch user assignments on mount
  useEffect(() => {
    const fetchUserAssignments = async () => {
      console.log('🚀 Starting to fetch user assignments...');
      setIsLoading(true);

      try {
        // DEBUG: Check all storage
        console.log('🔍 Checking localStorage...');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`LocalStorage[${key}]:`, localStorage.getItem(key));
        }

        // Get username from various possible sources
        let username = '';
        
        // Method 1: Direct from localStorage 'userData'
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            console.log('📦 userData found:', userData);
            username = userData.user?.nama || userData.nama || '';
            console.log('👤 Username from userData:', username);
          } catch (parseError) {
            console.error('❌ Error parsing userData:', parseError);
          }
        }

        // Method 2: Check for 'userInfo'
        if (!username) {
          const userInfoString = localStorage.getItem('userInfo');
          if (userInfoString) {
            try {
              const userInfo = JSON.parse(userInfoString);
              console.log('📦 userInfo found:', userInfo);
              username = userInfo.nama || userInfo.username || '';
              console.log('👤 Username from userInfo:', username);
            } catch (parseError) {
              console.error('❌ Error parsing userInfo:', parseError);
            }
          }
        }

        // Method 3: Try sessionStorage
        if (!username) {
          const sessionUser = sessionStorage.getItem('user');
          if (sessionUser) {
            try {
              const user = JSON.parse(sessionUser);
              username = user.nama || user.username || '';
              console.log('👤 Username from sessionStorage:', username);
            } catch (parseError) {
              console.error('❌ Error parsing sessionStorage:', parseError);
            }
          }
        }

        // Method 4: For testing - use known usernames from your spreadsheet
        if (!username) {
          // Usernames from your MARET25 sheet
          const knownUsers = ['ppk3210', 'petugas-1'];
          username = knownUsers[0]; // Default to first user for testing
          console.log('🧪 Using test username:', username);
          
          // Save to localStorage for testing
          localStorage.setItem('userData', JSON.stringify({
            success: true,
            message: 'Login berhasil',
            user: {
              nama: username,
              role: 'operator'
            }
          }));
        }

        if (!username) {
          console.error('❌ No username found!');
          toast({
            title: "Login Diperlukan",
            description: "Silakan login terlebih dahulu.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        console.log(`🎯 Fetching assignments for username: "${username}"`);

        // Call the Edge Function
        const { data: response, error } = await supabase.functions.invoke('get-user-assignments', {
          body: { username: username }
        });

        if (error) {
          console.error('❌ Edge Function error:', error);
          throw new Error(`Function error: ${error.message}`);
        }

        console.log('✅ Edge Function response:', response);

        if (response?.success && response.data) {
          console.log('📊 Assignments data:', response.data);
          setUserAssignments(response.data);
          
          // Auto-fill user data
          updateData({
            namaPendata: username,
            pencacah: response.data.pencacah || '',
            pemeriksa: response.data.pemeriksa || ''
          });
          
          toast({
            title: "Data Dimuat",
            description: `Ditemukan ${response.data.assignments.length} penugasan NKS`,
          });
        } else {
          console.warn('⚠️ No assignments found or error in response');
          toast({
            title: "Data Tidak Ditemukan",
            description: response?.message || "User ini belum memiliki penugasan.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Error fetching assignments:', error);
        toast({
          title: "Gagal Memuat Data",
          description: error.message || "Tidak dapat memuat data penugasan. Silakan coba lagi.",
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
      console.log('📍 Selected NKS:', assignment.nks);
      
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
        console.log('🎯 Selected No Sampel:', assignment.noSampelList[index]);
        
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

  // Debug current state
  console.log('🔄 Current state:', {
    isLoading,
    userAssignmentsCount: userAssignments?.assignments?.length || 0,
    selectedNksIndex,
    selectedNoSampelIndex,
    namaPendata: data.namaPendata,
    pencacah: data.pencacah,
    pemeriksa: data.pemeriksa
  });

  return (
    <div className="space-y-6">
      {/* Debug Panel - Can be removed later */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-blue-800">Info Status:</h3>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {isLoading ? 'Loading...' : userAssignments ? `${userAssignments.assignments.length} NKS ditemukan` : 'Tidak ada data'}
          </span>
        </div>
        <div className="text-xs text-blue-600 mt-2 grid grid-cols-2 gap-1">
          <div>User: {data.namaPendata || '-'}</div>
          <div>Pencacah: {data.pencacah || '-'}</div>
          <div>Pemeriksa: {data.pemeriksa || '-'}</div>
          <div>NKS: {data.nks || '-'}</div>
        </div>
      </div>

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
          >
            <Upload className="h-4 w-4" />
            Unggah Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 flex-col gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Memuat data penugasan...</span>
          <span className="text-sm text-gray-500">Mengambil data dari spreadsheet</span>
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
                className="bg-gray-50"
                placeholder="Otomatis dari login" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pencacah">Pencacah</Label>
              <Input 
                id="pencacah" 
                value={data.pencacah} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari data" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input 
                id="pemeriksa" 
                value={data.pemeriksa} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari data" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nks">NKS</Label>
              <Select 
                onValueChange={handleNksChange} 
                value={selectedNksIndex !== null ? selectedNksIndex.toString() : undefined}
                disabled={!userAssignments?.assignments?.length}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      !userAssignments?.assignments?.length 
                        ? "Tidak ada data penugasan" 
                        : "Pilih NKS"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {userAssignments?.assignments.map((assignment, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {assignment.nks} - {assignment.desa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userAssignments?.assignments?.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  User ini tidak memiliki penugasan NKS
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input 
                id="kecamatan" 
                value={data.kecamatan} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desa">Desa/Kelurahan</Label>
              <Input 
                id="desa" 
                value={data.desa} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sls">SLS</Label>
              <Input 
                id="sls" 
                value={data.sls} 
                readOnly
                className="bg-gray-50"
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
                  <SelectValue 
                    placeholder={
                      selectedNksIndex === null 
                        ? "Pilih NKS terlebih dahulu" 
                        : "Pilih No Sampel"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedNksIndex !== null && 
                   userAssignments?.assignments[selectedNksIndex]?.noSampelList.map((noSampel, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {noSampel} - {userAssignments.assignments[selectedNksIndex].namaKrtList[index] || ''}
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
                className="bg-gray-50"
                placeholder="Otomatis dari NKS" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
              <Input 
                id="namaKepalaRumahTangga" 
                value={data.namaKepalaRumahTangga} 
                readOnly
                className="bg-gray-50"
                placeholder="Otomatis dari No Sampel" 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Nama Anggota Rumah Tangga</Label>
                <p className="text-sm text-gray-500">
                  Tambahkan semua anggota rumah tangga selain kepala rumah tangga
                </p>
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
                  <Label className="min-w-[40px]">#{index + 1}</Label>
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

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span>Jumlah Anggota Rumah Tangga:</span>
                <span className="font-semibold">{data.jumlahAnggotaRumahTangga} orang</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Termasuk kepala rumah tangga: {data.namaKepalaRumahTangga ? '✓' : 'Belum dipilih'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};