import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { SurveyData } from "@/types/survey";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
interface Page1IdentityProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page1Identity = ({
  data,
  updateData
}: Page1IdentityProps) => {
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  return <div className="space-y-6">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="namaPendata">Nama Petugas Pendataan Lapangan</Label>
          <Input id="namaPendata" value={data.namaPendata} onChange={e => updateData({
          namaPendata: e.target.value
        })} placeholder="Masukkan nama petugas pendataan lapangan" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kecamatan">Kecamatan</Label>
          <Input id="kecamatan" value={data.kecamatan} onChange={e => updateData({
          kecamatan: e.target.value
        })} placeholder="Masukkan kecamatan" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desa">Desa/Kelurahan</Label>
          <Input id="desa" value={data.desa} onChange={e => updateData({
          desa: e.target.value
        })} placeholder="Masukkan desa" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat SLS</Label>
          <Input id="alamat" value={data.alamat} onChange={e => updateData({
          alamat: e.target.value
        })} placeholder="Masukkan alamat" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="namaKepalaRumahTangga">Nama Kepala Rumah Tangga</Label>
          <Input id="namaKepalaRumahTangga" value={data.namaKepalaRumahTangga} onChange={e => updateData({
          namaKepalaRumahTangga: e.target.value
        })} placeholder="Masukkan nama kepala rumah tangga" />
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
          {data.namaAnggotaRumahTangga.map((nama, index) => <div key={index} className="flex items-center gap-2">
              <Label className="min-w-fit">#{index + 1}</Label>
              <Input value={nama} onChange={e => updateAnggotaRumahTangga(index, e.target.value)} placeholder={`Nama anggota rumah tangga ${index + 1}`} className="flex-1" />
              {data.namaAnggotaRumahTangga.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => removeAnggotaRumahTangga(index)} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                </Button>}
            </div>)}
        </div>

        <div className="text-sm text-muted-foreground">
          Jumlah Anggota Rumah Tangga: {data.jumlahAnggotaRumahTangga}
        </div>
      </div>
    </div>;
};