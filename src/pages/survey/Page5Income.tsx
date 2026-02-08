import { SurveyData, UpahGajiEntry, UsahaEntry } from "@/types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { TransferBerjalanEntry } from "@/components/TransferBerjalanEntry";
import { TransferModalEntry } from "@/components/TransferModalEntry";
import { AsetPerubahanEntry } from "@/components/AsetPerubahanEntry";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";
import { ImputasiTooltip } from "@/components/ImputasiTooltip";
interface Page4IncomeProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
}
export const Page5Income = ({
  data,
  updateData
}: Page4IncomeProps) => {
  const {
    updateWithImputasi,
    recalculateImputasi
  } = useSurveyImputasi(data, updateData);
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };
  const parseNumber = (str: string) => {
    return parseInt(str.replace(/\D/g, '')) || 0;
  };

  // Handle upah/gaji entries
  const addUpahEntry = () => {
    const newEntry: UpahGajiEntry = {
      id: Date.now().toString(),
      uraianPekerjaan: "",
      kategoriLU: "",
      jenisPekerjaan: "",
      upahUang: 0,
      upahBarang: 0,
      lembur: 0,
      imputasiUpahGajiBarang: 0
    };
    updateWithImputasi({
      pendapatanUpah: [...(data.pendapatanUpah || []), newEntry]
    });
  };
  const updateUpahEntry = (index: number, updates: Partial<UpahGajiEntry>) => {
    const updatedEntries = [...(data.pendapatanUpah || [])];
    updatedEntries[index] = {
      ...updatedEntries[index],
      ...updates
    };
    updateWithImputasi({
      pendapatanUpah: updatedEntries
    });
  };
  const removeUpahEntry = (index: number) => {
    const updatedEntries = data.pendapatanUpah?.filter((_, i) => i !== index) || [];
    updateWithImputasi({
      pendapatanUpah: updatedEntries
    });
  };

  // Handle usaha entries
  const addUsahaEntry = () => {
    const newEntry: UsahaEntry = {
      id: Date.now().toString(),
      uraianKegiatan: "",
      kategoriLU: "",
      jenisPekerjaan: "",
      nilaiProduksi: 0,
      biayaProduksi: 0,
      surplus: 0
    };
    updateWithImputasi({
      pendapatanUsaha: [...(data.pendapatanUsaha || []), newEntry]
    });
  };
  const updateUsahaEntry = (index: number, updates: Partial<UsahaEntry>) => {
    const updatedEntries = [...(data.pendapatanUsaha || [])];
    updatedEntries[index] = {
      ...updatedEntries[index],
      ...updates
    };
    // Calculate surplus automatically
    if (updates.nilaiProduksi !== undefined || updates.biayaProduksi !== undefined) {
      updatedEntries[index].surplus = updatedEntries[index].nilaiProduksi - updatedEntries[index].biayaProduksi;
    }
    updateWithImputasi({
      pendapatanUsaha: updatedEntries
    });
  };
  const removeUsahaEntry = (index: number) => {
    const updatedEntries = data.pendapatanUsaha?.filter((_, i) => i !== index) || [];
    updateWithImputasi({
      pendapatanUsaha: updatedEntries
    });
  };
  const upahEntries = data.pendapatanUpah || [];
  const usahaEntries = data.pendapatanUsaha || [];
  const totalUpah = upahEntries.reduce((sum, entry) => sum + entry.upahUang + entry.upahBarang + entry.lembur, 0);
  const totalUsaha = usahaEntries.reduce((sum, entry) => sum + entry.surplus, 0);
  return <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-professional-navy">
          HALAMAN 5 - PENDAPATAN RUMAH TANGGA
        </h2>
        <Button
          onClick={recalculateImputasi}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* BLOK VA - Pendapatan Upah/Gaji */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VA. PENDAPATAN DARI UPAH/GAJI BERUPA UANG/BARANG/JASA YANG DITERIMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-professional-table-header text-professional-table-header-foreground">
                    <th className="border border-gray-300 p-2">No</th>
                    <th className="border border-gray-300 p-2">Uraian Pekerjaan</th>
                    <th className="border border-gray-300 p-2">Kategori LU</th>
                    <th className="border border-gray-300 p-2">Jenis Pekerjaan</th>
                    <th className="border border-gray-300 p-2">Upah/Gaji Uang</th>
                    <th className="border border-gray-300 p-2">Upah/Gaji Barang</th>
                    <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Upah/Gaji Barang</th>
                    <th className="border border-gray-300 p-2">Lembur/Honorarium</th>
                    <th className="border border-gray-300 p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {upahEntries.map((entry, index) => <tr key={entry.id}>
                      <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.uraianPekerjaan} onChange={e => updateUpahEntry(index, {
                      uraianPekerjaan: e.target.value
                    })} placeholder="Uraian pekerjaan" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.kategoriLU} onChange={e => updateUpahEntry(index, {
                      kategoriLU: e.target.value
                    })} placeholder="Kategori LU" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.jenisPekerjaan} onChange={e => updateUpahEntry(index, {
                      jenisPekerjaan: e.target.value
                    })} placeholder="Jenis pekerjaan" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={entry.upahUang ? formatNumber(entry.upahUang) : ''} onChange={e => updateUpahEntry(index, {
                      upahUang: parseNumber(e.target.value)
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={entry.upahBarang ? formatNumber(entry.upahBarang) : ''} onChange={e => updateUpahEntry(index, {
                      upahBarang: parseNumber(e.target.value)
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2 text-right bg-amber-50">
                        <ImputasiTooltip 
                          value={entry.imputasiUpahGajiBarang || 0}
                          originalValue={entry.upahBarang || 0}
                          conversionText="(sama dengan Upah/Gaji Barang)"
                          label="Imputasi Upah/Gaji Barang"
                        >
                          Rp {formatNumber(entry.imputasiUpahGajiBarang || 0)}
                        </ImputasiTooltip>
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={entry.lembur ? formatNumber(entry.lembur) : ''} onChange={e => updateUpahEntry(index, {
                      lembur: parseNumber(e.target.value)
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <Button size="sm" variant="destructive" onClick={() => removeUpahEntry(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>)}
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2 text-center" colSpan={4}>JUMLAH</td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(upahEntries.reduce((sum, entry) => sum + entry.upahUang, 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(upahEntries.reduce((sum, entry) => sum + entry.upahBarang, 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(upahEntries.reduce((sum, entry) => sum + (entry.imputasiUpahGajiBarang || 0), 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(upahEntries.reduce((sum, entry) => sum + entry.lembur, 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(totalUpah)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Button onClick={addUpahEntry} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Baris
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BLOK VB - Pendapatan Usaha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VB. PENDAPATAN DARI USAHA RUMAH TANGGA SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-professional-table-header text-professional-table-header-foreground">
                    <th className="border border-gray-300 p-2">No</th>
                    <th className="border border-gray-300 p-2">Uraian Kegiatan Usaha</th>
                    <th className="border border-gray-300 p-2">Kategori LU</th>
                    <th className="border border-gray-300 p-2">Jenis Pekerjaan</th>
                    <th className="border border-gray-300 p-2">Nilai Produksi</th>
                    <th className="border border-gray-300 p-2">Biaya Produksi</th>
                    <th className="border border-gray-300 p-2">Surplus Usaha</th>
                    <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Nilai Produksi</th>
                    <th className="border border-gray-300 p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {usahaEntries.map((entry, index) => <tr key={entry.id}>
                      <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.uraianKegiatan} onChange={e => updateUsahaEntry(index, {
                      uraianKegiatan: e.target.value
                    })} placeholder="Uraian kegiatan usaha" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.kategoriLU} onChange={e => updateUsahaEntry(index, {
                      kategoriLU: e.target.value
                    })} placeholder="Kategori LU" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input value={entry.jenisPekerjaan} onChange={e => updateUsahaEntry(index, {
                      jenisPekerjaan: e.target.value
                    })} placeholder="Jenis pekerjaan" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={entry.nilaiProduksi ? formatNumber(entry.nilaiProduksi) : ''} onChange={e => updateUsahaEntry(index, {
                      nilaiProduksi: parseNumber(e.target.value)
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={entry.biayaProduksi ? formatNumber(entry.biayaProduksi) : ''} onChange={e => updateUsahaEntry(index, {
                      biayaProduksi: parseNumber(e.target.value)
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        Rp {formatNumber(entry.nilaiProduksi - entry.biayaProduksi)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right bg-amber-50">
                        <ImputasiTooltip 
                          value={entry.imputasiNilaiProduksi || 0}
                          originalValue={entry.nilaiProduksi || 0}
                          conversionText="(sama dengan Nilai Produksi)"
                          label="Imputasi Nilai Produksi"
                        >
                          Rp {formatNumber(entry.imputasiNilaiProduksi || 0)}
                        </ImputasiTooltip>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <Button size="sm" variant="destructive" onClick={() => removeUsahaEntry(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>)}
                  <tr className="bg-muted font-semibold">
                    <td className="border border-gray-300 p-2 text-center" colSpan={4}>JUMLAH</td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(usahaEntries.reduce((sum, entry) => sum + (entry.nilaiProduksi || 0), 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(usahaEntries.reduce((sum, entry) => sum + (entry.biayaProduksi || 0), 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(usahaEntries.reduce((sum, entry) => sum + (entry.nilaiProduksi - entry.biayaProduksi || 0), 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      Rp {formatNumber(usahaEntries.reduce((sum, entry) => sum + (entry.imputasiNilaiProduksi || 0), 0))}
                    </td>
                    <td className="border border-gray-300 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Button onClick={addUsahaEntry} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Baris
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BLOK VC - Pendapatan Produksi Sendiri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VC. PENDAPATAN DARI PRODUKSI RUMAH TANGGA YANG DIKONSUMSI SENDIRI SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-professional-table-header text-professional-table-header-foreground">
                  <th className="border border-gray-300 p-2">Rincian</th>
                  <th className="border border-gray-300 p-2">Nilai Produksi</th>
                  <th className="border border-gray-300 p-2">Biaya Produksi (Termasuk upah/gaji)</th>
                  <th className="border border-gray-300 p-2">Surplus Usaha/Mixed Income</th>
                  <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Nilai Produksi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Perkiraan Sewa Rumah Milik Sendiri</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={data.produksiSendiri?.perkiraanSewaRumah?.nilaiProduksi ? formatNumber(data.produksiSendiri.perkiraanSewaRumah.nilaiProduksi) : ''} onChange={e => updateWithImputasi({
                    produksiSendiri: {
                      ...data.produksiSendiri,
                      perkiraanSewaRumah: {
                        ...data.produksiSendiri?.perkiraanSewaRumah,
                        nilaiProduksi: parseNumber(e.target.value),
                        surplus: parseNumber(e.target.value) - (data.produksiSendiri?.perkiraanSewaRumah?.biayaProduksi || 0),
                        imputasiNilaiProduksi: data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0
                      }
                    }
                  })} placeholder="Rp 0" className="text-sm" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={data.produksiSendiri?.perkiraanSewaRumah?.biayaProduksi ? formatNumber(data.produksiSendiri.perkiraanSewaRumah.biayaProduksi) : ''} onChange={e => updateWithImputasi({
                    produksiSendiri: {
                      ...data.produksiSendiri,
                      perkiraanSewaRumah: {
                        ...data.produksiSendiri?.perkiraanSewaRumah,
                        biayaProduksi: parseNumber(e.target.value),
                        surplus: (data.produksiSendiri?.perkiraanSewaRumah?.nilaiProduksi || 0) - parseNumber(e.target.value),
                        imputasiNilaiProduksi: data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0
                      }
                    }
                  })} placeholder="Rp 0" className="text-sm" />
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(data.produksiSendiri?.perkiraanSewaRumah?.surplus || 0)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-amber-50">
                    <ImputasiTooltip 
                      value={data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0}
                      originalValue={data.produksiSendiri?.perkiraanSewaRumah?.nilaiProduksi || 0}
                      conversionText="(sama dengan Nilai Produksi)"
                      label="Imputasi Perkiraan Sewa Rumah"
                    >
                      Rp {formatNumber(data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0)}
                    </ImputasiTooltip>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Hasil Pertanian, Peternakan, Perikanan, Penggalian, Industri, dll</td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={data.produksiSendiri?.hasilPertanian?.nilaiProduksi ? formatNumber(data.produksiSendiri.hasilPertanian.nilaiProduksi) : ''} onChange={e => updateWithImputasi({
                    produksiSendiri: {
                      ...data.produksiSendiri,
                      hasilPertanian: {
                        ...data.produksiSendiri?.hasilPertanian,
                        nilaiProduksi: parseNumber(e.target.value),
                        surplus: parseNumber(e.target.value) - (data.produksiSendiri?.hasilPertanian?.biayaProduksi || 0),
                        imputasiNilaiProduksi: data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0
                      }
                    }
                  })} placeholder="Rp 0" className="text-sm" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input type="text" value={data.produksiSendiri?.hasilPertanian?.biayaProduksi ? formatNumber(data.produksiSendiri.hasilPertanian.biayaProduksi) : ''} onChange={e => updateWithImputasi({
                    produksiSendiri: {
                      ...data.produksiSendiri,
                      hasilPertanian: {
                        ...data.produksiSendiri?.hasilPertanian,
                        biayaProduksi: parseNumber(e.target.value),
                        surplus: (data.produksiSendiri?.hasilPertanian?.nilaiProduksi || 0) - parseNumber(e.target.value),
                        imputasiNilaiProduksi: data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0
                      }
                    }
                  })} placeholder="Rp 0" className="text-sm" />
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(data.produksiSendiri?.hasilPertanian?.surplus || 0)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-amber-50">
                    <ImputasiTooltip 
                      value={data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0}
                      formula={`Dihitung dari total konsumsi dengan kategori "Produksi Sendiri" dan detail "Berasal dari Produksi Sendiri" yang dikonversi ke setahun`}
                      label="Imputasi Hasil Pertanian"
                    >
                      Rp {formatNumber(data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0)}
                    </ImputasiTooltip>
                  </td>
                </tr>
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber((data.produksiSendiri?.perkiraanSewaRumah?.nilaiProduksi || 0) + (data.produksiSendiri?.hasilPertanian?.nilaiProduksi || 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber((data.produksiSendiri?.perkiraanSewaRumah?.biayaProduksi || 0) + (data.produksiSendiri?.hasilPertanian?.biayaProduksi || 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber((data.produksiSendiri?.perkiraanSewaRumah?.surplus || 0) + (data.produksiSendiri?.hasilPertanian?.surplus || 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-amber-50">
                    <ImputasiTooltip 
                      value={(data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0) + (data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0)}
                      label="Total Imputasi Produksi Sendiri"
                    >
                      Rp {formatNumber((data.produksiSendiri?.perkiraanSewaRumah?.imputasiNilaiProduksi || 0) + (data.produksiSendiri?.hasilPertanian?.imputasiNilaiProduksi || 0))}
                    </ImputasiTooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* BLOK VD - Pendapatan Kepemilikan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VD. PENDAPATAN KEPEMILIKAN SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-professional-table-header text-professional-table-header-foreground">
                  <th className="border border-gray-300 p-2">Rincian</th>
                  <th className="border border-gray-300 p-2">Diterima</th>
                  <th className="border border-gray-300 p-2">Dibayar</th>
                </tr>
              </thead>
              <tbody>
                {['sewaLahan', 'bagi_hasil', 'deviden', 'bunga'].map((item, index) => {
                const labels = ['Sewa Lahan', 'Keuntungan dari Usaha Rumah Tangga Lain (Bagi Hasil)', 'Keuntungan atas kepemilikan saham (Deviden)', 'Bunga (Simpanan, Pinjaman, dll)'];
                return <tr key={item}>
                      <td className="border border-gray-300 p-2 font-medium">
                        {index + 1}. {labels[index]}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan]?.diterima ? formatNumber(data.pendapatanKepemilikan[item as keyof typeof data.pendapatanKepemilikan].diterima) : ''} onChange={e => updateWithImputasi({
                      pendapatanKepemilikan: {
                        ...data.pendapatanKepemilikan,
                        [item]: {
                          ...(data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan] || {}),
                          diterima: parseNumber(e.target.value)
                        }
                      }
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input type="text" value={data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan]?.dibayar ? formatNumber(data.pendapatanKepemilikan[item as keyof typeof data.pendapatanKepemilikan].dibayar) : ''} onChange={e => updateWithImputasi({
                      pendapatanKepemilikan: {
                        ...data.pendapatanKepemilikan,
                        [item]: {
                          ...(data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan] || {}),
                          dibayar: parseNumber(e.target.value)
                        }
                      }
                    })} placeholder="Rp 0" className="text-sm" />
                      </td>
                    </tr>;
              })}
                <tr className="bg-muted font-semibold">
                  <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(['sewaLahan', 'bagi_hasil', 'deviden', 'bunga'].reduce((sum, item) => sum + (data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan]?.diterima || 0), 0))}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {formatNumber(['sewaLahan', 'bagi_hasil', 'deviden', 'bunga'].reduce((sum, item) => sum + (data.pendapatanKepemilikan?.[item as keyof typeof data.pendapatanKepemilikan]?.dibayar || 0), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* BLOK VE - Transfer Berjalan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VE. TRANSFER BERJALAN (SELAIN ASET) SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransferBerjalanEntry data={data} updateData={updateWithImputasi} formatNumber={formatNumber} parseNumber={parseNumber} />
        </CardContent>
      </Card>

      {/* BLOK VF - Transfer Modal/Aset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VF. TRANSFER MODAL/ASET SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransferModalEntry data={data} updateData={updateWithImputasi} formatNumber={formatNumber} parseNumber={parseNumber} />
        </CardContent>
      </Card>

      {/* BLOK VG - Penambahan dan Pengurangan Aset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            BLOK VG. PENAMBAHAN DAN PENGURANGAN ASET SELAMA SETAHUN TERAKHIR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsetPerubahanEntry data={data} updateData={updateWithImputasi} formatNumber={formatNumber} parseNumber={parseNumber} />
        </CardContent>
      </Card>
    </div>;
};