
"use client";

import { useMemo } from "react";

interface CategoryPieChartProps {
  data: { name: string; value: number; color: string }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const segments = useMemo(() => {
    let currentAngle = 0;
    return data.map((d) => {
      const angle = (d.value / total) * 360;
      const x1 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
      const y1 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
      const x2 = 50 + 40 * Math.cos((Math.PI * (currentAngle + angle)) / 180);
      const y2 = 50 + 40 * Math.sin((Math.PI * (currentAngle + angle)) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(" ");

      currentAngle += angle;
      return { path: pathData, color: d.color, name: d.name, value: d.value };
    });
  }, [data, total]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-64 h-64 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {segments.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              className="hover:opacity-90 transition-opacity cursor-pointer"
            >
              <title>{`${s.name}: ${Math.round((s.value / total) * 100)}%`}</title>
            </path>
          ))}
          {/* Donut Hole */}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xs text-text-secondary">Total</div>
            <div className="text-lg font-bold">{total}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <div className="text-sm">
              <span className="font-medium text-text-primary">{d.name}</span>
              <span className="text-text-secondary ml-1">({Math.round((d.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
