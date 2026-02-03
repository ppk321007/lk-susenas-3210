import { Input } from "@/components/ui/input";
import { SurveyData } from "@/types/survey";
import { ImputasiTooltip } from "@/components/ImputasiTooltip";

interface TransferBerjalanEntryProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  formatNumber: (num: number) => string;
  parseNumber: (str: string) => number;
}

export const TransferBerjalanEntry = ({
  data,
  updateData,
  formatNumber,
  parseNumber
}: TransferBerjalanEntryProps) => {
  const transferTypes = [{
    key: 'pemerintah',
    label: '1. Pemerintah (Rincian a+b)',
    isParent: true
  }, {
    key: 'pemerintahUangPensiun',
    label: 'a. Uang Pensiun',
    isChild: true,
    parentKey: 'pemerintah'
  }, {
    key: 'pemerintahBantuan',
    label: 'b. Bantuan Pemerintah (BPJS PBI, BLT, PKH, BOS, dll.), Pembayaran Zakat ke BAZNAS',
    isChild: true,
    parentKey: 'pemerintah'
  }, {
    key: 'badanUsaha',
    label: '2. Badan Usaha (Uang Pensiun, Asuransi, dll)'
  }, {
    key: 'rumahTanggaLain',
    label: '3. Rumah Tangga Lain (Kiriman, kondangan, dll)'
  }, {
    key: 'lembagaNirlaba',
    label: '4. Lembaga Nirlaba (Zakat, infaq, dll)'
  }, {
    key: 'luarNegeri',
    label: '5. Luar Negeri (Kiriman TKI, LSM, dll)'
  }];

  // Calculate parent row totals
  const getPemerintahTotal = (field: 'diterimaUang' | 'diterimaBarang' | 'dibayarUang' | 'dibayarBarang') => {
    const uangPensiun = data.transferBerjalan?.pemerintahUangPensiun?.[field] || 0;
    const bantuan = data.transferBerjalan?.pemerintahBantuan?.[field] || 0;
    return uangPensiun + bantuan;
  };

  const buildPemerintahCombinedFormula = (mode: 'uang' | 'barang') => {
    const parts: string[] = [];
    const pb = data.transferBerjalan?.pemerintahBantuan as any;
    const pp = data.transferBerjalan?.pemerintahUangPensiun as any;

    if (mode === 'uang') {
      const b1 = pb?.imputasiTransferDiterimaUangBreakdown || [];
      const b2 = pp?.imputasiTransferDiterimaUangBreakdown || [];
      if (b1.length || b2.length) {
        parts.push('Rincian Pemerintah (Uang):');
        [...b1, ...b2].forEach((item: any) => parts.push(`- ${item.formula}`));
      }
    } else {
      const b1 = pb?.imputasiTransferDiterimaBarangBreakdown || [];
      // pemerintahUangPensiun unlikely has barang breakdown, include if present
      const b2 = pp?.imputasiTransferDiterimaBarangBreakdown || [];
      if (b1.length || b2.length) {
        parts.push('Rincian Pemerintah (Barang):');
        [...b1, ...b2].forEach((item: any) => parts.push(`- ${item.formula}`));
      }
    }

    return parts.join('\n');
  };

  // Get imputasi value for a transfer type
  const getImputasiUang = (key: string): number => {
    return (data.transferBerjalan?.[key as keyof typeof data.transferBerjalan] as any)?.imputasiTransferDiterimaUang || 0;
  };

  const getImputasiBarang = (key: string): number => {
    return (data.transferBerjalan?.[key as keyof typeof data.transferBerjalan] as any)?.imputasiTransferDiterimaBarang || 0;
  };

  // Get formula for imputasi based on source
  const getImputasiUangFormula = (key: string): string => {
    const value = getImputasiUang(key);
    if (value === 0) return '';
    if (key === 'pemerintahBantuan') {
      const breakdown = (data.transferBerjalan?.pemerintahBantuan as any)?.imputasiTransferDiterimaUangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Pemerintah secara Gratis"`;
    }
    if (key === 'rumahTanggaLain') {
      const breakdown = (data.transferBerjalan?.rumahTanggaLain as any)?.imputasiTransferDiterimaUangBreakdown || (data.transferBerjalan?.rumahTanggaLain as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Rumah Tangga Lain"`;
    }
    if (key === 'pemerintah') {
      // combine pemerintahBantuan and pemerintahUangPensiun breakdowns
      const b1 = (data.transferBerjalan?.pemerintahBantuan as any)?.imputasiTransferDiterimaUangBreakdown || [];
      const b2 = (data.transferBerjalan?.pemerintahUangPensiun as any)?.imputasiTransferDiterimaUangBreakdown || [];
      const combined = [...b1, ...b2];
      if (combined.length > 0) return combined.map((b: any) => b.formula).join('\n');
    }
    return `Nilai imputasi: Rp ${formatNumber(value)}`;
  };

  const getImputasiBarangFormula = (key: string): string => {
    const value = getImputasiBarang(key);
    if (value === 0) return '';
    if (key === 'pemerintahBantuan') {
      const breakdown = (data.transferBerjalan?.pemerintahBantuan as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Pemerintah secara Gratis" (Barang)`;
    }
    if (key === 'badanUsaha') {
      const breakdown = (data.transferBerjalan?.badanUsaha as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi kesehatan (Rumah Sakit, Puskesmas, dll.) dengan kategori "Pemberian dari Pemerintah secara Gratis"`;
    }
    if (key === 'rumahTanggaLain') {
      const breakdown = (data.transferBerjalan?.rumahTanggaLain as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Rumah Tangga Lain" (Barang)`;
    }
    if (key === 'lembagaNirlaba') {
      const breakdown = (data.transferBerjalan?.lembagaNirlaba as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Lembaga Nirlaba"`;
    }
    if (key === 'luarNegeri') {
      const breakdown = (data.transferBerjalan?.luarNegeri as any)?.imputasiTransferDiterimaBarangBreakdown;
      if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown.map((b: any) => b.formula).join('\n');
      return `Dari konsumsi dengan kategori "Pemberian dari Luar Negeri"`;
    }
    return `Nilai imputasi: Rp ${formatNumber(value)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">Rincian</th>
            <th className="border border-gray-300 p-2" colSpan={4}>Transfer Diterima (dari)</th>
            <th className="border border-gray-300 p-2" colSpan={2}>Transfer Dibayar (kepada)</th>
          </tr>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2"></th>
            <th className="border border-gray-300 p-2">Uang</th>
            <th className="border border-gray-300 p-2">Barang</th>
            <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Transfer Diterima (dari) Uang</th>
            <th className="border border-gray-300 p-2 bg-amber-600">Imputasi Transfer Diterima (dari) Barang</th>
            <th className="border border-gray-300 p-2">Uang</th>
            <th className="border border-gray-300 p-2">Barang</th>
          </tr>
        </thead>
        <tbody>
          {transferTypes.map((transfer) => (
            <tr key={transfer.key} className={transfer.isChild ? 'bg-gray-50' : ''}>
              <td className={`border border-gray-300 p-2 font-medium ${transfer.isChild ? 'pl-6' : ''}`}>{transfer.label}</td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <ImputasiTooltip
                    value={getPemerintahTotal('diterimaUang')}
                    formula={buildPemerintahCombinedFormula('uang')}
                    label={`Pemerintah - Rincian Uang`}
                  >
                    <span className="text-sm font-semibold">Rp {formatNumber(getPemerintahTotal('diterimaUang'))}</span>
                  </ImputasiTooltip>
                ) : (
                  <Input 
                    type="text" 
                    value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaUang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].diterimaUang) : ''} 
                    onChange={e => updateData({
                      transferBerjalan: {
                        ...data.transferBerjalan,
                        [transfer.key]: {
                          ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                          diterimaUang: parseNumber(e.target.value)
                        }
                      }
                    })} 
                    placeholder="Rp 0" 
                    className="text-sm" 
                  />
                )}
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <ImputasiTooltip
                    value={getPemerintahTotal('diterimaBarang')}
                    formula={buildPemerintahCombinedFormula('barang')}
                    label={`Pemerintah - Rincian Barang`}
                  >
                    <span className="text-sm font-semibold">Rp {formatNumber(getPemerintahTotal('diterimaBarang'))}</span>
                  </ImputasiTooltip>
                ) : (
                  <Input 
                    type="text" 
                    value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaBarang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].diterimaBarang) : ''} 
                    onChange={e => updateData({
                      transferBerjalan: {
                        ...data.transferBerjalan,
                        [transfer.key]: {
                          ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                          diterimaBarang: parseNumber(e.target.value)
                        }
                      }
                    })} 
                    placeholder="Rp 0" 
                    className="text-sm" 
                  />
                )}
              </td>
              <td className="border border-gray-300 p-2 text-right bg-amber-50">
                {['pemerintah', 'pemerintahBantuan', 'rumahTanggaLain'].includes(transfer.key) ? (
                  <ImputasiTooltip 
                    value={getImputasiUang(transfer.key)}
                    formula={getImputasiUangFormula(transfer.key)}
                    label={`Imputasi Transfer Uang - ${transfer.label}`}
                  >
                    Rp {formatNumber(getImputasiUang(transfer.key))}
                  </ImputasiTooltip>
                ) : (
                  <span>Rp 0</span>
                )}
              </td>
              <td className="border border-gray-300 p-2 text-right bg-amber-50">
                {['pemerintah', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'].includes(transfer.key) ? (
                  <ImputasiTooltip 
                    value={getImputasiBarang(transfer.key)}
                    formula={getImputasiBarangFormula(transfer.key)}
                    label={`Imputasi Transfer Barang - ${transfer.label}`}
                  >
                    Rp {formatNumber(getImputasiBarang(transfer.key))}
                  </ImputasiTooltip>
                ) : (
                  <span>Rp 0</span>
                )}
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <span className="text-sm font-semibold">Rp {formatNumber(getPemerintahTotal('dibayarUang'))}</span>
                ) : (
                  <Input 
                    type="text" 
                    value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarUang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].dibayarUang) : ''} 
                    onChange={e => updateData({
                      transferBerjalan: {
                        ...data.transferBerjalan,
                        [transfer.key]: {
                          ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                          dibayarUang: parseNumber(e.target.value)
                        }
                      }
                    })} 
                    placeholder="Rp 0" 
                    className="text-sm" 
                  />
                )}
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <span className="text-sm font-semibold">Rp {formatNumber(getPemerintahTotal('dibayarBarang'))}</span>
                ) : (
                  <Input 
                    type="text" 
                    value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarBarang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].dibayarBarang) : ''} 
                    onChange={e => updateData({
                      transferBerjalan: {
                        ...data.transferBerjalan,
                        [transfer.key]: {
                          ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                          dibayarBarang: parseNumber(e.target.value)
                        }
                      }
                    })} 
                    placeholder="Rp 0" 
                    className="text-sm" 
                  />
                )}
              </td>
            </tr>
          ))}
          <tr className="bg-muted font-semibold">
            <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaUang || 0), 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaBarang || 0), 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right bg-amber-50">
              <ImputasiTooltip 
                value={getImputasiUang('pemerintah') + getImputasiUang('pemerintahBantuan') + getImputasiUang('rumahTanggaLain')}
                formula="Jumlah imputasi transfer uang dari Pemerintah + Rumah Tangga Lain"
                label="Total Imputasi Transfer Uang"
              >
                Rp {formatNumber(getImputasiUang('pemerintah') + getImputasiUang('pemerintahBantuan') + getImputasiUang('rumahTanggaLain'))}
              </ImputasiTooltip>
            </td>
            <td className="border border-gray-300 p-2 text-right bg-amber-50">
              <ImputasiTooltip 
                value={transferTypes.reduce((sum, transfer) => sum + (['pemerintah', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'].includes(transfer.key) ? getImputasiBarang(transfer.key) : 0), 0)}
                formula="Jumlah imputasi transfer barang dari semua sumber"
                label="Total Imputasi Transfer Barang"
              >
                Rp {formatNumber(transferTypes.reduce((sum, transfer) => sum + (['pemerintah', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'].includes(transfer.key) ? getImputasiBarang(transfer.key) : 0), 0))}
              </ImputasiTooltip>
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarUang || 0), 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarBarang || 0), 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
