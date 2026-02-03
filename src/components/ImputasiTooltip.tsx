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
  return (
    <span
      className={`cursor-help inline-block pointer-events-auto ${className}`}
      title={formula || (value !== undefined ? `Nilai: ${value}` : '')}
      data-tooltip={formula || (value !== undefined ? `Nilai: ${value}` : '')}
      style={{
        textDecoration: 'underline dotted',
        textDecorationColor: 'rgb(107, 114, 128)',
        textUnderlineOffset: '2px'
      }}
    >
      {children || value}
    </span>
  );
};

