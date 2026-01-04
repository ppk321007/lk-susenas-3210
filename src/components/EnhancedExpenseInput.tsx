import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { FoodExpense, JENIS_PEMBELIAN, JENIS_PEMBERIAN, JENIS_PRODUKSI_SENDIRI, ExpenseEntry } from "@/types/survey";
import { IncompleteEntry, isEntryIncomplete } from "@/utils/validationUtils";

interface EnhancedExpenseInputProps {
  label: string;
  value: FoodExpense & { entries?: ExpenseEntry[] };
  onChange: (value: FoodExpense & { entries?: ExpenseEntry[] }) => void;
  useNewCategories?: boolean; // Flag to use new categories for page 3
  itemKey?: string; // Item key for validation
  incompleteEntries?: IncompleteEntry[]; // List of incomplete entries for validation
}

export const EnhancedExpenseInput = ({ 
  label, 
  value, 
  onChange, 
  useNewCategories = false, 
  itemKey = '', 
  incompleteEntries = [] 
}: EnhancedExpenseInputProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  const parseNumber = (str: string) => {
    return parseInt(str.replace(/\D/g, '')) || 0;
  };

  const entries = value.entries || [];

  const addEntry = () => {
    const newEntries = [...entries, { 
      nilai: 0, 
      kategori: 'Pembelian' as const, 
      jenisDetail: '' 
    }];
    updateEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    updateEntries(newEntries);
  };

  const updateEntry = (index: number, field: keyof ExpenseEntry, newValue: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: newValue };
    updateEntries(newEntries);
  };

  const updateEntries = (newEntries: ExpenseEntry[]) => {
    const totalPembelian = newEntries
      .filter(e => e.kategori === 'Pembelian')
      .reduce((sum, e) => sum + e.nilai, 0);
    
    const totalProduksi = newEntries
      .filter(e => e.kategori === (useNewCategories ? 'Pemberian' : 'Produksi Sendiri/Pemberian'))
      .reduce((sum, e) => sum + e.nilai, 0);

    onChange({
      ...value,
      entries: newEntries,
      pembelian: totalPembelian,
      produksiSendiri: totalProduksi
    });
  };

  const totalAmount = entries.reduce((sum, entry) => sum + entry.nilai, 0);
  
  // Check if this item has any incomplete entries
  const hasIncompleteEntries = incompleteEntries.some(incomplete => incomplete.itemKey === itemKey);
  
  // Get incomplete entries for this specific item
  const itemIncompleteEntries = incompleteEntries.filter(incomplete => incomplete.itemKey === itemKey);

  return (
    <div className={`border rounded-lg p-4 space-y-4 bg-card ${hasIncompleteEntries ? 'border-yellow-300 bg-yellow-50/50' : ''}`}>
      <div className="flex items-start justify-between">
        <h4 className={`font-medium text-sm flex-1 pr-2 ${hasIncompleteEntries ? 'text-yellow-800' : ''}`}>{label}</h4>
        <div className="text-xs text-muted-foreground flex-shrink-0">
          Total: Rp {formatNumber(totalAmount)}
        </div>
      </div>
      
      {/* Show warning for incomplete entries */}
      {hasIncompleteEntries && (
        <Alert variant="warning" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Data Belum Lengkap:</strong>
            <ul className="mt-1 ml-4 list-disc text-xs">
              {itemIncompleteEntries.map((incomplete, idx) => (
                <li key={idx}>
                  Entry {incomplete.entryIndex + 1}: {incomplete.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const entryIsIncomplete = isEntryIncomplete(entry, itemKey, index, incompleteEntries);
          return (
          <div key={index} className={`grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr_auto] gap-3 p-3 border rounded ${entryIsIncomplete ? 'bg-yellow-100 border-yellow-300' : 'bg-muted/30'}`}>
            <div className="space-y-1">
              <Label className="text-xs">Nilai</Label>
              <Input
                type="text"
                value={entry.nilai ? formatNumber(entry.nilai) : ''}
                onChange={(e) => updateEntry(index, 'nilai', parseNumber(e.target.value))}
                placeholder="Rp 0"
                className="text-sm h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Kategori</Label>
              <Select
                value={entry.kategori}
                onValueChange={(val) => updateEntry(index, 'kategori', val)}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pembelian">Pembelian</SelectItem>
                  <SelectItem value={useNewCategories ? "Pemberian" : "Produksi Sendiri/Pemberian"}>
                    {useNewCategories ? "Pemberian" : "Produksi Sendiri/Pemberian"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className={`text-xs ${entryIsIncomplete ? 'text-yellow-800 font-medium' : ''}`}>
                Detail {entryIsIncomplete && <span className="text-yellow-600">*</span>}
              </Label>
              {entry.kategori === 'Pembelian' ? (
                <Select
                  value={entry.jenisDetail}
                  onValueChange={(val) => updateEntry(index, 'jenisDetail', val)}
                >
                  <SelectTrigger className={`text-xs h-8 ${entryIsIncomplete ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                    <SelectValue placeholder="Pilih jenis pembelian" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_PEMBELIAN.map((jenis) => (
                      <SelectItem key={jenis} value={jenis} className="text-xs">
                        {jenis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={entry.jenisDetail}
                  onValueChange={(val) => updateEntry(index, 'jenisDetail', val)}
                >
                  <SelectTrigger className={`text-xs h-8 ${entryIsIncomplete ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                    <SelectValue placeholder={useNewCategories ? "Pilih jenis pemberian" : "Pilih asal produksi"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(useNewCategories ? JENIS_PEMBERIAN : JENIS_PRODUKSI_SENDIRI).map((jenis) => (
                      <SelectItem key={jenis} value={jenis} className="text-xs">
                        {jenis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeEntry(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={addEntry}
          className="w-full h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Tambah Entry
        </Button>
      </div>
    </div>
  );
};