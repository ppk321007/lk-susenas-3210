import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ImputasiTooltipProps {
  value?: number;
  formula?: string;
  children?: React.ReactNode;
  className?: string;
  /** Original value before conversion (e.g., weekly value) */
  originalValue?: number;
  /** Conversion multiplier description (e.g., "× 30/7 × 12") */
  conversionText?: string;
  /** Label for the calculation (e.g., "Beras", "Daging Ayam") */
  label?: string;
}

export const ImputasiTooltip: React.FC<ImputasiTooltipProps> = ({
  value,
  formula,
  children,
  className = '',
  originalValue,
  conversionText,
  label
}) => {
  const hasFormula = formula || (originalValue !== undefined && conversionText);
  
  // If no formula info, just render the content without tooltip
  if (!hasFormula) {
    return <span className={className}>{children || (value !== undefined ? value : '')}</span>;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className={`cursor-help inline-block pointer-events-auto ${className}`}
          style={{
            textDecoration: 'underline dotted rgb(107, 114, 128)',
            textDecorationThickness: '1px',
            textUnderlineOffset: '2px',
            cursor: 'help'
          }}
        >
          {children || (value !== undefined ? value : '')}
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto max-w-sm p-3 text-sm bg-popover border shadow-lg"
        side="top"
        align="center"
      >
        <div className="space-y-1">
          {label && (
            <div className="font-semibold text-foreground border-b pb-1 mb-2">
              Detail Perhitungan: {label}
            </div>
          )}
          {formula ? (
            <div className="text-muted-foreground whitespace-pre-wrap">{formula}</div>
          ) : originalValue !== undefined && conversionText ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-green-600 font-medium">
                Rp {formatNumber(originalValue)}
              </span>
              <span className="text-muted-foreground">{conversionText}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-primary font-semibold">
                Rp {formatNumber(value || 0)}
              </span>
            </div>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};


