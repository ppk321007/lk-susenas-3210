import React from 'react';

interface ImputasiTooltipProps {
  value?: number;
  formula?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ImputasiTooltip: React.FC<ImputasiTooltipProps> = ({
  value,
  formula,
  children,
  className = ''
}) => {
  const tooltipText = formula || (value !== undefined ? `Nilai: ${value}` : '');
  
  return (
    <span
      className={`cursor-help inline-block pointer-events-auto ${className}`}
      title={tooltipText}
      data-tooltip={tooltipText}
      style={{
        textDecoration: 'underline dotted rgb(107, 114, 128)',
        textDecorationThickness: '1px',
        textUnderlineOffset: '2px',
        cursor: 'help'
      }}
    >
      {children || (value !== undefined ? value : '')}
    </span>
  );
};


