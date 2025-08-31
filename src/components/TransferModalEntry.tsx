import { Input } from "@/components/ui/input";
import { SurveyData } from "@/types/survey";

interface TransferModalEntryProps {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  formatNumber: (num: number) => string;
  parseNumber: (str: string) => number;
}

export const TransferModalEntry = ({ data, updateData, formatNumber, parseNumber }: TransferModalEntryProps) => {
  const transferTypes = [
    { key: 'pemerintah', label: 'Pemerintah' },
    { key: 'badanUsaha', label: 'Badan Usaha' },
    { key: 'rumahTangga', label: 'Rumah Tangga' },
    { key: 'lembagaNirlaba', label: 'Lembaga Nirlaba' },
    { key: 'luarNegeri', label: 'Luar Negeri' }
  ];

  const asetTypes = [
    { key: 'bangunanTinggal', label: 'Bangunan Tinggal' },
    { key: 'bangunanBukan', label: 'Bangunan Bukan Tinggal' },
    { key: 'alatProduksi', label: 'Alat Produksi' },
    { key: 'tanamanHewan', label: 'Tanaman/Hewan' },
    { key: 'kendaraan', label: 'Kendaraan' },
    { key: 'lahan', label: 'Lahan/Barang Berharga' }
  ];

  const updateTransferModal = (entity: string, direction: 'diterima' | 'dibayar', asetType: string, value: number) => {
    updateData({
      transferModal: {
        ...data.transferModal,
        [entity]: {
          ...data.transferModal?.[entity as keyof typeof data.transferModal],
          [direction]: {
            ...data.transferModal?.[entity as keyof typeof data.transferModal]?.[direction],
            [asetType]: value
          }
        }
      }
    });
  };

  const getValue = (entity: string, direction: 'diterima' | 'dibayar', asetType: string): number => {
    return data.transferModal?.[entity as keyof typeof data.transferModal]?.[direction]?.[asetType as any] || 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-professional-table-header text-professional-table-header-foreground">
            <th className="border border-gray-300 p-2">Rincian</th>
            <th className="border border-gray-300 p-2" colSpan={6}>Transfer Diterima (dari)</th>
            <th className="border border-gray-300 p-2" colSpan={6}>Transfer Dibayar (kepada)</th>
          </tr>
          <tr className="bg-muted text-xs">
            <th className="border border-gray-300 p-1"></th>
            {asetTypes.map(aset => (
              <th key={`diterima-${aset.key}`} className="border border-gray-300 p-1">{aset.label}</th>
            ))}
            {asetTypes.map(aset => (
              <th key={`dibayar-${aset.key}`} className="border border-gray-300 p-1">{aset.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transferTypes.map((transfer, index) => (
            <tr key={transfer.key}>
              <td className="border border-gray-300 p-2 font-medium">{index + 1}. {transfer.label}</td>
              {/* Transfer Diterima */}
              {asetTypes.map((aset) => (
                <td key={`diterima-${aset.key}`} className="border border-gray-300 p-1">
                  <Input
                    type="text"
                    value={getValue(transfer.key, 'diterima', aset.key) ? formatNumber(getValue(transfer.key, 'diterima', aset.key)) : ''}
                    onChange={(e) => updateTransferModal(transfer.key, 'diterima', aset.key, parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-xs h-8"
                  />
                </td>
              ))}
              {/* Transfer Dibayar */}
              {asetTypes.map((aset) => (
                <td key={`dibayar-${aset.key}`} className="border border-gray-300 p-1">
                  <Input
                    type="text"
                    value={getValue(transfer.key, 'dibayar', aset.key) ? formatNumber(getValue(transfer.key, 'dibayar', aset.key)) : ''}
                    onChange={(e) => updateTransferModal(transfer.key, 'dibayar', aset.key, parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-xs h-8"
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-muted font-semibold">
            <td className="border border-gray-300 p-2 text-center">JUMLAH</td>
            {/* Total Transfer Diterima */}
            {asetTypes.map((aset) => (
              <td key={`total-diterima-${aset.key}`} className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(transferTypes.reduce((sum, transfer) => 
                  sum + getValue(transfer.key, 'diterima', aset.key), 0))}
              </td>
            ))}
            {/* Total Transfer Dibayar */}
            {asetTypes.map((aset) => (
              <td key={`total-dibayar-${aset.key}`} className="border border-gray-300 p-1 text-right text-xs">
                {formatNumber(transferTypes.reduce((sum, transfer) => 
                  sum + getValue(transfer.key, 'dibayar', aset.key), 0))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};