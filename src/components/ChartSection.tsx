import React from 'react';

type AreaData = { month: string; value: number }[];
type DonutData = { label: string; value: number; color: string }[];

interface ChartSectionProps {
  areaData: AreaData;
  donutData: DonutData;
  barData: { label: string; value: number }[];
}

export default function ChartSection({ barData }) {
  if (!barData || barData.length === 0) return null;
  const maxValue = Math.max(...barData.map(d => d.value), 1);
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex items-end justify-center gap-6 min-h-[180px] overflow-x-auto px-2">
        {barData.map((d, i) => (
          <div key={d.label} className="flex flex-col items-center min-w-[48px]">
            <div
              className="bg-gradient-to-t from-blue-400 to-cyan-300 rounded-t-xl transition-all duration-300"
              style={{ height: `${Math.max(20, (d.value / maxValue) * 120)}px`, width: 32 }}
            ></div>
            <div className="text-lg font-bold text-blue-700 mt-1">{d.value}</div>
            <div className="text-xs text-blue-400 mt-1 text-center break-words max-w-[60px]">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 