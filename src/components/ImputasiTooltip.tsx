import React from 'react';

interface ImputasiTooltipProps {
  value: number;
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
      className={`cursor-help border-b border-dotted border-gray-400 ${className}`}
      title={formula || `Nilai: ${value}`}
      style={{ textDecoration: 'underline dotted' }}
    >
      {children || value}
    </span>
  );
};
