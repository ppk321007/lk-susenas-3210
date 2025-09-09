import { Input } from "@/components/ui/input";
import { SurveyData } from "@/types/survey";
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
  return <div className="overflow-x-auto">
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
          {transferTypes.map((transfer) => <tr key={transfer.key} className={transfer.isChild ? 'bg-gray-50' : ''}>
              <td className={`border border-gray-300 p-2 font-medium ${transfer.isChild ? 'pl-6' : ''}`}>{transfer.label}</td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <Input type="text" value={formatNumber(getPemerintahTotal('diterimaUang'))} readOnly disabled className="text-sm bg-gray-100 text-gray-600 font-semibold" />
                ) : (
                  <Input type="text" value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaUang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].diterimaUang) : ''} onChange={e => updateData({
                transferBerjalan: {
                  ...data.transferBerjalan,
                  [transfer.key]: {
                    ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                    diterimaUang: parseNumber(e.target.value)
                  }
                }
              })} placeholder="Rp 0" className="text-sm" />
                )}
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <Input type="text" value={formatNumber(getPemerintahTotal('diterimaBarang'))} readOnly disabled className="text-sm bg-gray-100 text-gray-600 font-semibold" />
                ) : (
                  <Input type="text" value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaBarang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].diterimaBarang) : ''} onChange={e => updateData({
                transferBerjalan: {
                  ...data.transferBerjalan,
                  [transfer.key]: {
                    ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                    diterimaBarang: parseNumber(e.target.value)
                  }
                }
              })} placeholder="Rp 0" className="text-sm" />
                )}
              </td>
              <td className="border border-gray-300 p-2">
                <Input type="text" value={(['pemerintah', 'pemerintahBantuan', 'rumahTanggaLain'].includes(transfer.key)) && (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan] as any)?.imputasiTransferDiterimaUang ? formatNumber((data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan] as any).imputasiTransferDiterimaUang) : '0'} readOnly disabled placeholder="Rp 0" className="text-sm bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-2">
                <Input type="text" value={(['pemerintah', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'].includes(transfer.key)) && (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan] as any)?.imputasiTransferDiterimaBarang ? formatNumber((data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan] as any).imputasiTransferDiterimaBarang) : '0'} readOnly disabled placeholder="Rp 0" className="text-sm bg-gray-100 text-foreground" />
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <Input type="text" value={formatNumber(getPemerintahTotal('dibayarUang'))} readOnly disabled className="text-sm bg-gray-100 text-gray-600 font-semibold" />
                ) : (
                  <Input type="text" value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarUang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].dibayarUang) : ''} onChange={e => updateData({
                transferBerjalan: {
                  ...data.transferBerjalan,
                  [transfer.key]: {
                    ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                    dibayarUang: parseNumber(e.target.value)
                  }
                }
              })} placeholder="Rp 0" className="text-sm" />
                )}
              </td>
              <td className="border border-gray-300 p-2">
                {transfer.isParent ? (
                  <Input type="text" value={formatNumber(getPemerintahTotal('dibayarBarang'))} readOnly disabled className="text-sm bg-gray-100 text-gray-600 font-semibold" />
                ) : (
                  <Input type="text" value={data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.dibayarBarang ? formatNumber(data.transferBerjalan[transfer.key as keyof typeof data.transferBerjalan].dibayarBarang) : ''} onChange={e => updateData({
                transferBerjalan: {
                  ...data.transferBerjalan,
                  [transfer.key]: {
                    ...data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan],
                    dibayarBarang: parseNumber(e.target.value)
                  }
                }
              })} placeholder="Rp 0" className="text-sm" />
                )}
              </td>
            </tr>)}
          <tr className="bg-muted font-semibold">
            <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaUang || 0), 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.filter(t => !t.isParent).reduce((sum, transfer) => sum + (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan]?.diterimaBarang || 0), 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(((data.transferBerjalan?.pemerintah as any)?.imputasiTransferDiterimaUang || 0) + ((data.transferBerjalan?.pemerintahBantuan as any)?.imputasiTransferDiterimaUang || 0) + ((data.transferBerjalan?.rumahTanggaLain as any)?.imputasiTransferDiterimaUang || 0))}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              Rp {formatNumber(transferTypes.reduce((sum, transfer) => sum + (['pemerintah', 'pemerintahBantuan', 'badanUsaha', 'rumahTanggaLain', 'lembagaNirlaba', 'luarNegeri'].includes(transfer.key) ? (data.transferBerjalan?.[transfer.key as keyof typeof data.transferBerjalan] as any)?.imputasiTransferDiterimaBarang || 0 : 0), 0))}
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
    </div>;
};