import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FoodExpense, JENIS_PEMBELIAN, JENIS_PRODUKSI_SENDIRI } from "@/types/survey";

interface ExpenseInputProps {
  label: string;
  value: FoodExpense;
  onChange: (value: FoodExpense) => void;
}

export const ExpenseInput = ({ label, value, onChange }: ExpenseInputProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  const parseNumber = (str: string) => {
    return parseInt(str.replace(/\D/g, '')) || 0;
  };

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm truncate flex-1">{label}</h4>
        <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
          Total: Rp {formatNumber(value.pembelian + value.produksiSendiri)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Pembelian (Tunai/Bon)</Label>
          <Input
            type="text"
            value={value.pembelian ? formatNumber(value.pembelian) : ''}
            onChange={(e) => {
              const numValue = parseNumber(e.target.value);
              onChange({ ...value, pembelian: numValue });
            }}
            placeholder="Rp 0"
            className="text-sm h-8"
          />
          {value.pembelian > 0 && (
            <Select
              value={value.jenisPembelian || ''}
              onValueChange={(val) => onChange({ ...value, jenisPembelian: val })}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Jenis pembelian" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_PEMBELIAN.map((jenis) => (
                  <SelectItem key={jenis} value={jenis} className="text-xs">
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Produksi sendiri, pemberian, dsb</Label>
          <Input
            type="text"
            value={value.produksiSendiri ? formatNumber(value.produksiSendiri) : ''}
            onChange={(e) => {
              const numValue = parseNumber(e.target.value);
              onChange({ ...value, produksiSendiri: numValue });
            }}
            placeholder="Rp 0"
            className="text-sm h-8"
          />
          {value.produksiSendiri > 0 && (
            <Select
              value={value.jenisProduksiSendiri || ''}
              onValueChange={(val) => onChange({ ...value, jenisProduksiSendiri: val })}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Jenis produksi sendiri" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_PRODUKSI_SENDIRI.map((jenis) => (
                  <SelectItem key={jenis} value={jenis} className="text-xs">
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};