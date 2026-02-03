import { Input } from "@/components/ui/input";
import { SurveyData } from "@/types/survey";
import { ImputasiTooltip } from "@/components/ImputasiTooltip";

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

  // Get formula for imputasi
  const getImputasiFormula = (label: string, fieldName: string, value: number): string => {
    if (value === 0) return '';
    if (fieldName === 'imputasiPenamabahanPemberian') {
      return `Sama dengan nilai "Pemberian" pada ${label}`;
    }
    if (fieldName === 'imputasiPenguranganPemberianKepada') {
      return `Sama dengan nilai "Pemberian Kepada" pada ${label}`;
    }
    return `Nilai: Rp ${formatNumber(value)}`;
  };

  // Check if item should show imputasi
  const shouldShowImputasiAsetTetap = (itemKey: string) => {
    return ['bangunanBukan', 'kendaraan', 'mesinPeralatan', 'tanamanHewan'].includes(itemKey);
  };

  const shouldShowImputasiOther = (itemKey: string) => {
    return ['bangunanTinggal', 'lahanBarang'].includes(itemKey);
  };

  return (
    <div className="overflow-x-auto">
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
          {asetTetapUsahaItems.map(item => {
            const imputasiPenambahan = getAsetTetapUsahaValue(item.key, 'imputasiPenamabahanPemberian');
            const imputasiPengurangan = getAsetTetapUsahaValue(item.key, 'imputasiPenguranganPemberianKepada');
            const pemberianValue = getAsetTetapUsahaValue(item.key, 'pemberian');
            const pemberianKepadaValue = getAsetTetapUsahaValue(item.key, 'pemberianKepada');
            
            return (
              <tr key={item.key}>
                <td className="border border-gray-300 p-2 pl-6">{item.label}</td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getAsetTetapUsahaValue(item.key, 'pembelian') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pembelian')) : ''} 
                    onChange={e => updateAsetTetapUsaha(item.key, 'pembelian', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getAsetTetapUsahaValue(item.key, 'pemberian') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pemberian')) : ''} 
                    onChange={e => updateAsetTetapUsaha(item.key, 'pemberian', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
                  {shouldShowImputasiAsetTetap(item.key) ? (
                    <ImputasiTooltip 
                      value={imputasiPenambahan}
                      originalValue={pemberianValue}
                      conversionText="(sama dengan Pemberian)"
                      label={`Imputasi Penambahan - ${item.label}`}
                    >
                      {formatNumber(imputasiPenambahan)}
                    </ImputasiTooltip>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getAsetTetapUsahaValue(item.key, 'pembuatanSendiri') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pembuatanSendiri')) : ''} 
                    onChange={e => updateAsetTetapUsaha(item.key, 'pembuatanSendiri', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs">
                  {formatNumber(getAsetTetapUsahaValue(item.key, 'pembelian') + getAsetTetapUsahaValue(item.key, 'pemberian') + getAsetTetapUsahaValue(item.key, 'pembuatanSendiri'))}
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getAsetTetapUsahaValue(item.key, 'penjualan') ? formatNumber(getAsetTetapUsahaValue(item.key, 'penjualan')) : ''} 
                    onChange={e => updateAsetTetapUsaha(item.key, 'penjualan', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getAsetTetapUsahaValue(item.key, 'pemberianKepada') ? formatNumber(getAsetTetapUsahaValue(item.key, 'pemberianKepada')) : ''} 
                    onChange={e => updateAsetTetapUsaha(item.key, 'pemberianKepada', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
                  {shouldShowImputasiAsetTetap(item.key) ? (
                    <ImputasiTooltip 
                      value={imputasiPengurangan}
                      originalValue={pemberianKepadaValue}
                      conversionText="(sama dengan Pemberian Kepada)"
                      label={`Imputasi Pengurangan - ${item.label}`}
                    >
                      {formatNumber(imputasiPengurangan)}
                    </ImputasiTooltip>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs">
                  {formatNumber(getAsetTetapUsahaValue(item.key, 'penjualan') + getAsetTetapUsahaValue(item.key, 'pemberianKepada'))}
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                  {formatNumber(getAsetTetapUsahaValue(item.key, 'netto'))}
                </td>
              </tr>
            );
          })}
          
          {/* Other asset categories */}
          {otherAssetItems.map(item => {
            const imputasiPenambahan = getOtherAsetValue(item.key, 'imputasiPenamabahanPemberian');
            const imputasiPengurangan = getOtherAsetValue(item.key, 'imputasiPenguranganPemberianKepada');
            const pemberianValue = getOtherAsetValue(item.key, 'pemberian');
            const pemberianKepadaValue = getOtherAsetValue(item.key, 'pemberianKepada');
            
            return (
              <tr key={item.key}>
                <td className="border border-gray-300 p-2 font-medium">{item.label}</td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getOtherAsetValue(item.key, 'pembelian') ? formatNumber(getOtherAsetValue(item.key, 'pembelian')) : ''} 
                    onChange={e => updateOtherAset(item.key, 'pembelian', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getOtherAsetValue(item.key, 'pemberian') ? formatNumber(getOtherAsetValue(item.key, 'pemberian')) : ''} 
                    onChange={e => updateOtherAset(item.key, 'pemberian', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
                  {shouldShowImputasiOther(item.key) ? (
                    <ImputasiTooltip 
                      value={imputasiPenambahan}
                      originalValue={pemberianValue}
                      conversionText="(sama dengan Pemberian)"
                      label={`Imputasi Penambahan - ${item.label}`}
                    >
                      {formatNumber(imputasiPenambahan)}
                    </ImputasiTooltip>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getOtherAsetValue(item.key, 'pembuatanSendiri') ? formatNumber(getOtherAsetValue(item.key, 'pembuatanSendiri')) : ''} 
                    onChange={e => updateOtherAset(item.key, 'pembuatanSendiri', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs">
                  {formatNumber(getOtherAsetValue(item.key, 'pembelian') + getOtherAsetValue(item.key, 'pemberian') + getOtherAsetValue(item.key, 'pembuatanSendiri'))}
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getOtherAsetValue(item.key, 'penjualan') ? formatNumber(getOtherAsetValue(item.key, 'penjualan')) : ''} 
                    onChange={e => updateOtherAset(item.key, 'penjualan', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    type="text" 
                    value={getOtherAsetValue(item.key, 'pemberianKepada') ? formatNumber(getOtherAsetValue(item.key, 'pemberianKepada')) : ''} 
                    onChange={e => updateOtherAset(item.key, 'pemberianKepada', parseNumber(e.target.value))} 
                    placeholder="0" 
                    className="text-xs h-8" 
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
                  {shouldShowImputasiOther(item.key) ? (
                    <ImputasiTooltip 
                      value={imputasiPengurangan}
                      originalValue={pemberianKepadaValue}
                      conversionText="(sama dengan Pemberian Kepada)"
                      label={`Imputasi Pengurangan - ${item.label}`}
                    >
                      {formatNumber(imputasiPengurangan)}
                    </ImputasiTooltip>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs">
                  {formatNumber(getOtherAsetValue(item.key, 'penjualan') + getOtherAsetValue(item.key, 'pemberianKepada'))}
                </td>
                <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                  {formatNumber(getOtherAsetValue(item.key, 'netto'))}
                </td>
              </tr>
            );
          })}
          
          {/* Grand Total Row */}
          <tr className="bg-muted font-semibold">
            <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'pembelian'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'pembelian'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'pemberian'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'pemberian'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
              <ImputasiTooltip 
                value={
                  asetTetapUsahaItems.filter(i => shouldShowImputasiAsetTetap(i.key)).reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'imputasiPenamabahanPemberian'), 0) +
                  otherAssetItems.filter(i => shouldShowImputasiOther(i.key)).reduce((sum, item) => sum + getOtherAsetValue(item.key, 'imputasiPenamabahanPemberian'), 0)
                }
                label="Total Imputasi Penambahan Pemberian"
              >
                {formatNumber(
                  asetTetapUsahaItems.filter(i => shouldShowImputasiAsetTetap(i.key)).reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'imputasiPenamabahanPemberian'), 0) +
                  otherAssetItems.filter(i => shouldShowImputasiOther(i.key)).reduce((sum, item) => sum + getOtherAsetValue(item.key, 'imputasiPenamabahanPemberian'), 0)
                )}
              </ImputasiTooltip>
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'pembuatanSendiri'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'pembuatanSendiri'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'pembelian') + getAsetTetapUsahaValue(item.key, 'pemberian') + getAsetTetapUsahaValue(item.key, 'pembuatanSendiri'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'pembelian') + getOtherAsetValue(item.key, 'pemberian') + getOtherAsetValue(item.key, 'pembuatanSendiri'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'penjualan'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'penjualan'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'pemberianKepada'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'pemberianKepada'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs bg-amber-50">
              <ImputasiTooltip 
                value={
                  asetTetapUsahaItems.filter(i => shouldShowImputasiAsetTetap(i.key)).reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'imputasiPenguranganPemberianKepada'), 0) +
                  otherAssetItems.filter(i => shouldShowImputasiOther(i.key)).reduce((sum, item) => sum + getOtherAsetValue(item.key, 'imputasiPenguranganPemberianKepada'), 0)
                }
                label="Total Imputasi Pengurangan Pemberian"
              >
                {formatNumber(
                  asetTetapUsahaItems.filter(i => shouldShowImputasiAsetTetap(i.key)).reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'imputasiPenguranganPemberianKepada'), 0) +
                  otherAssetItems.filter(i => shouldShowImputasiOther(i.key)).reduce((sum, item) => sum + getOtherAsetValue(item.key, 'imputasiPenguranganPemberianKepada'), 0)
                )}
              </ImputasiTooltip>
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'penjualan') + getAsetTetapUsahaValue(item.key, 'pemberianKepada'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'penjualan') + getOtherAsetValue(item.key, 'pemberianKepada'), 0)
              )}
            </td>
            <td className="border border-gray-300 p-1 text-right text-xs">
              {formatNumber(
                asetTetapUsahaItems.reduce((sum, item) => sum + getAsetTetapUsahaValue(item.key, 'netto'), 0) +
                otherAssetItems.reduce((sum, item) => sum + getOtherAsetValue(item.key, 'netto'), 0)
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
