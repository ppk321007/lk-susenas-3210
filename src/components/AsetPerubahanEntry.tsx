import { Input } from "@/components/ui/input";
import { SurveyData } from "@/types/survey";
interface AsetPerubahanEntryProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  formatNumber: (num: number) => string;
  parseNumber: (str: string) => number;
}
export const AsetPerubahanEntry = ({
  data,
  updateData,
  formatNumber,
  parseNumber
}: AsetPerubahanEntryProps) => {
  const asetTetapUsahaItems = [{
    key: 'bangunanBukan',
    label: 'a. Bangunan Bukan Tempat Tinggal'
  }, {
    key: 'kendaraan',
    label: 'b. Kendaraan'
  }, {
    key: 'mesinPeralatan',
    label: 'c. Mesin, Perlengkapan dan Peralatan'
  }, {
    key: 'tanamanHewan',
    label: 'd. Tanaman dan Hewan Menghasilkan Berulang'
  }, {
    key: 'lainnya',
    label: 'e. Lainnya (Produk Kekayaan Intelektual)'
  }];
  const otherAssetItems = [{
    key: 'bangunanTinggal',
    label: '2. Bangunan Tempat Tinggal'
  }, {
    key: 'biayaPemindahan',
    label: '3. Biaya Pemindahan Kepemilikan Lahan/Tanah'
  }, {
    key: 'lahanBarang',
    label: '4. Lahan/Tanah dan Barang Berharga'
  }];
  const updateAsetTetapUsaha = (itemKey: string, field: string, value: number) => {
    const current = data.asetPerubahan?.asetTetapUsaha?.[itemKey as keyof typeof data.asetPerubahan.asetTetapUsaha] || {
      pembelian: 0,
      pemberian: 0,
      pembuatanSendiri: 0,
      penjualan: 0,
      pemberianKepada: 0,
      netto: 0,
      imputasiPenamabahanPemberian: 0,
      imputasiPenguranganPemberianKepada: 0
    };
    const updated = {
      ...current,
      [field]: value
    };
    const totalPenambahan = updated.pembelian + updated.pemberian + updated.pembuatanSendiri;
    const totalPengurangan = updated.penjualan + updated.pemberianKepada;
    updated.netto = totalPenambahan - totalPengurangan;
    updateData({
      asetPerubahan: {
        ...data.asetPerubahan,
        asetTetapUsaha: {
          ...data.asetPerubahan?.asetTetapUsaha,
          [itemKey]: updated
        }
      }
    });
  };
  const updateOtherAset = (itemKey: string, field: string, value: number) => {
    type OtherAsetKeys = 'bangunanTinggal' | 'biayaPemindahan' | 'lahanBarang';
    const current = data.asetPerubahan?.[itemKey as OtherAsetKeys] || {
      pembelian: 0,
      pemberian: 0,
      pembuatanSendiri: 0,
      penjualan: 0,
      pemberianKepada: 0,
      netto: 0,
      imputasiPenamabahanPemberian: 0,
      imputasiPenguranganPemberianKepada: 0
    };
    const updated = {
      ...current,
      [field]: value
    };
    const totalPenambahan = updated.pembelian + updated.pemberian + updated.pembuatanSendiri;
    const totalPengurangan = updated.penjualan + updated.pemberianKepada;
    updated.netto = totalPenambahan - totalPengurangan;
    updateData({
      asetPerubahan: {
        ...data.asetPerubahan,
        [itemKey]: updated
      }
    });
  };
  const getAsetTetapUsahaValue = (itemKey: string, field: string): number => {
    const item = data.asetPerubahan?.asetTetapUsaha?.[itemKey as keyof typeof data.asetPerubahan.asetTetapUsaha];
    return (item as any)?.[field] || 0;
  };
  const getOtherAsetValue = (itemKey: string, field: string): number => {
    type OtherAsetKeys = 'bangunanTinggal' | 'biayaPemindahan' | 'lahanBarang';
    const item = data.asetPerubahan?.[itemKey as OtherAsetKeys];
    return (item as any)?.[field] || 0;
  };
  return <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">Rincian</th>
            <th className="border border-gray-300 p-2" colSpan={5}>Penambahan</th>
            <th className="border border-gray-300 p-2" colSpan={4}>Pengurangan</th>
            <th className="border border-gray-300 p-2">Netto</th>
          </tr>
          <tr className="bg-muted text-xs">
            <th className="border border-gray-300 p-1"></th>
            <th className="border border-gray-300 p-1">Pembelian/Pembangunan</th>
            <th className="border border-gray-300 p-1">Pemberian</th>
            <th className="border border-gray-300 p-1 bg-amber-600">Imputasi Penambahan Pemberian</th>
            <th className="border border-gray-300 p-1">Pembuatan Sendiri</th>
            <th className="border border-gray-300 p-1">Total</th>
            <th className="border border-gray-300 p-1">Penjualan</th>
            <th className="border border-gray-300 p-1">Pemberian Kepada</th>
            <th className="border border-gray-300 p-1 bg-amber-600">Imputasi Pengurangan Pemberian Kepada</th>
            <th className="border border-gray-300 p-1">Total</th>
            <th className="border border-gray-300 p-1">(Kolom 2-3)</th>
          </tr>
        </thead>
        <tbody>
          {/* Aset Tetap Usaha */}
          <tr>
            <td className="border border-gray-300 p-2 font-medium" colSpan={11}>1. Aset tetap untuk Usaha Rumah Tangga</td>
          </tr>
          {asetTetapUsahaItems.map(item => <tr key={item.key}>
              <td className="border border-gray-300 p-2 pl-6">{item.label}</td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getAsetTetapUsahaValue(item.key, 'pembelian') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pembelian')) : ''} onChange={e => updateAsetTetapUsaha(item.key, 'pembelian', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getAsetTetapUsahaValue(item.key, 'pemberian') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pemberian')) : ''} onChange={e => updateAsetTetapUsaha(item.key, 'pemberian', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan'].includes(item.key) && getAsetTetapUsahaValue(item.key, 'imputasiPenamabahanPemberian') ? formatNumber(getAsetTetapUsahaValue(item.key, 'imputasiPenamabahanPemberian')) : '0'} readOnly disabled placeholder="0" className="text-xs h-8 bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getAsetTetapUsahaValue(item.key, 'pembuatanSendiri') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pembuatanSendiri')) : ''} onChange={e => updateAsetTetapUsaha(item.key, 'pembuatanSendiri', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(getAsetTetapUsahaValue(item.key, 'pembelian') + getAsetTetapUsahaValue(item.key, 'pemberian') + getAsetTetapUsahaValue(item.key, 'pembuatanSendiri'))}
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getAsetTetapUsahaValue(item.key, 'penjualan') ? formatNumber(getAsetTetapUsahaValue(item.key, 'penjualan')) : ''} onChange={e => updateAsetTetapUsaha(item.key, 'penjualan', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getAsetTetapUsahaValue(item.key, 'pemberianKepada') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pemberianKepada')) : ''} onChange={e => updateAsetTetapUsaha(item.key, 'pemberianKepada', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan'].includes(item.key) && getAsetTetapUsahaValue(item.key, 'imputasiPenguranganPemberianKepada') ? formatNumber(getAsetTetapUsahaValue(item.key, 'imputasiPenguranganPemberianKepada')) : '0'} readOnly disabled placeholder="0" className="text-xs h-8 bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(getAsetTetapUsahaValue(item.key, 'penjualan') + getAsetTetapUsahaValue(item.key, 'pemberianKepada'))}
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                {formatNumber(getAsetTetapUsahaValue(item.key, 'netto'))}
              </td>
            </tr>)}
          
          {/* Other asset categories */}
          {otherAssetItems.map(item => <tr key={item.key}>
              <td className="border border-gray-300 p-2 font-medium">{item.label}</td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getOtherAsetValue(item.key, 'pembelian') ? formatNumber(getOtherAsetValue(item.key, 'pembelian')) : ''} onChange={e => updateOtherAset(item.key, 'pembelian', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getOtherAsetValue(item.key, 'pemberian') ? formatNumber(getOtherAsetValue(item.key, 'pemberian')) : ''} onChange={e => updateOtherAset(item.key, 'pemberian', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={['bangunanTinggal', 'lahanBarang'].includes(item.key) && getOtherAsetValue(item.key, 'imputasiPenamabahanPemberian') ? formatNumber(getOtherAsetValue(item.key, 'imputasiPenamabahanPemberian')) : '0'} readOnly disabled placeholder="0" className="text-xs h-8 bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getOtherAsetValue(item.key, 'pembuatanSendiri') ? formatNumber(getOtherAsetValue(item.key, 'pembuatanSendiri')) : ''} onChange={e => updateOtherAset(item.key, 'pembuatanSendiri', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(getOtherAsetValue(item.key, 'pembelian') + getOtherAsetValue(item.key, 'pemberian') + getOtherAsetValue(item.key, 'pembuatanSendiri'))}
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getOtherAsetValue(item.key, 'penjualan') ? formatNumber(getOtherAsetValue(item.key, 'penjualan')) : ''} onChange={e => updateOtherAset(item.key, 'penjualan', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={getOtherAsetValue(item.key, 'pemberianKepada') ? formatNumber(getOtherAsetValue(item.key, 'pemberianKepada')) : ''} onChange={e => updateOtherAset(item.key, 'pemberianKepada', parseNumber(e.target.value))} placeholder="0" className="text-xs h-8" />
              </td>
              <td className="border border-gray-300 p-1">
                <Input type="text" value={['bangunanTinggal', 'lahanBarang'].includes(item.key) && getOtherAsetValue(item.key, 'imputasiPenguranganPemberianKepada') ? formatNumber(getOtherAsetValue(item.key, 'imputasiPenguranganPemberianKepada')) : '0'} readOnly disabled placeholder="0" className="text-xs h-8 bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(getOtherAsetValue(item.key, 'penjualan') + getOtherAsetValue(item.key, 'pemberianKepada'))}
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                {formatNumber(getOtherAsetValue(item.key, 'netto'))}
              </td>
            </tr>)}
          
          {/* Grand Total Row */}
          <tr className="bg-muted font-semibold">
            <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pembelian') : getAsetTetapUsahaValue(item.key, 'pembelian')), 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pemberian') : getAsetTetapUsahaValue(item.key, 'pemberian')), 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pembuatanSendiri') : getAsetTetapUsahaValue(item.key, 'pembuatanSendiri')), 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => {
              const pembelian = item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pembelian') : getAsetTetapUsahaValue(item.key, 'pembelian');
              const pemberian = item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pemberian') : getAsetTetapUsahaValue(item.key, 'pemberian');
              const pembuatan = item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pembuatanSendiri') : getAsetTetapUsahaValue(item.key, 'pembuatanSendiri');
              return sum + pembelian + pemberian + pembuatan;
            }, 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'penjualan') : getAsetTetapUsahaValue(item.key, 'penjualan')), 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pemberianKepada') : getAsetTetapUsahaValue(item.key, 'pemberianKepada')), 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => {
              const penjualan = item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'penjualan') : getAsetTetapUsahaValue(item.key, 'penjualan');
              const pemberian = item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'pemberianKepada') : getAsetTetapUsahaValue(item.key, 'pemberianKepada');
              return sum + penjualan + pemberian;
            }, 0))}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber([...asetTetapUsahaItems, ...otherAssetItems].reduce((sum, item) => sum + (item.key in otherAssetItems.map(i => i.key) ? getOtherAsetValue(item.key, 'netto') : getAsetTetapUsahaValue(item.key, 'netto')), 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>;
};