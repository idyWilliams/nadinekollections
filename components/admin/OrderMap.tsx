"use client";

import { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// GeoJSON for Nigeria (Simplified)
// In a real app, you'd fetch this or import a local JSON file.
// For this demo, I'll use a public URL for Nigeria's TopoJSON or a placeholder if offline.
// Since I can't guarantee external access, I will use a simplified approach or a direct URL if permitted.
// Using a reliable public URL for Nigeria GeoJSON.
const GEO_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json";

interface OrderMapProps {
  data: { state: string; value: number }[];
}

export function OrderMap({ data }: OrderMapProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  const colorScale = scaleLinear<string>()
    .domain([0, maxValue || 1])
    .range(["#f0fdf4", "#15803d"]); // Light green to dark green (primary color)

  const dataMap = useMemo(() => {
    const map = new Map();
    data.forEach((d) => {
      // Normalize state names for matching (e.g., "Lagos State" -> "Lagos")
      const normalizedName = d.state.replace(/ state/i, "").trim().toLowerCase();
      map.set(normalizedName, d.value);
    });
    return map;
  }, [data]);

  return (
    <div className="w-full h-[400px] bg-blue-50/30 rounded-xl overflow-hidden relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 3000,
          center: [8.6753, 9.0820] // Center of Nigeria
        }}
        className="w-full h-full"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: unknown[] }) =>
            geographies.map((geo: unknown) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const stateName = (geo as any).properties.NAME_1 || (geo as any).properties.name; // Adjust based on TopoJSON structure
              const normalizedStateName = stateName?.toLowerCase();
              const value = dataMap.get(normalizedStateName) || 0;

              return (
                <Geography
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={(geo as any).rsmKey}
                  geography={geo}
                  fill={value > 0 ? colorScale(value) : "#e5e7eb"}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#FCD34D", outline: "none", cursor: "pointer" }, // Gold hover
                    pressed: { outline: "none" },
                  }}
                >
                  <title>{`${stateName}: ${value} Orders`}</title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm text-xs">
        <div className="font-semibold mb-2">Order Density</div>
        <div className="flex items-center gap-2">
          <span>Low</span>
          <div className="w-20 h-2 bg-gradient-to-r from-[#f0fdf4] to-[#15803d] rounded-full" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
