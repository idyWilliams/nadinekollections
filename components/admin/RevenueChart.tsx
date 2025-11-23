
"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: { date: string; value: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(" ");
  }, [data, maxValue]);

  return (
    <div className="w-full h-[300px] relative pt-6">
      {/* Y-Axis Labels */}
      <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-text-secondary">
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(maxValue / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart Area */}
      <div className="ml-12 h-full relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Grid Lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />

          {/* Area Fill */}
          <path
            d={`M0,100 ${points} 100,100 Z`}
            fill="url(#gradient)"
            className="opacity-20"
          />
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Line */}
          <polyline
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />

          {/* Points */}
          {data.map((d, i) => {
             const x = (i / (data.length - 1)) * 100;
             const y = 100 - (d.value / maxValue) * 100;
             return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="white"
                  stroke="var(--primary)"
                  strokeWidth="0.5"
                  className="hover:r-2 transition-all cursor-pointer"
                >
                  <title>{`${d.date}: ${formatCurrency(d.value)}`}</title>
                </circle>
             )
          })}
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          {data.map((d) => (
            <span key={d.date}>{d.date}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
