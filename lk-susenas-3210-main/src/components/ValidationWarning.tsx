import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ValidationWarningProps {
  warnings: string[];
}

export const ValidationWarning = ({ warnings }: ValidationWarningProps) => {
  if (warnings.length === 0) return null;

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong className="text-professional-navy">Peringatan:</strong>
        <ul className="mt-2 ml-4 list-disc">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};