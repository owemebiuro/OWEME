"use client";

import type { TooltipContentProps } from "recharts";

export const CHART_COLORS = {
  ember: "#1b6fd4",
  embert: "rgba(27,111,212,.18)",
  embert2: "rgba(27,111,212,0)",
  sage: "#1e8a6e",
  emlo: "#1259a8",
  grid: "rgba(60,60,67,.06)",
  axis: "rgba(13,17,23,.36)",
};

type GlassTooltipProps = Partial<TooltipContentProps<number | string, string>> & {
  valueFormatter?: (value: number | string, name: string) => string;
};

export function GlassTooltip({
  active,
  payload = [],
  label,
  valueFormatter,
}: GlassTooltipProps) {
  if (!active || !payload.length) {
    return null;
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,.95)",
        backdropFilter: "blur(16px)",
        border: ".5px solid rgba(255,255,255,.7)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(13,17,23,.4)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      {payload.map((entry) => {
        const name = String(entry.name ?? "");
        const rawValue = entry.value ?? "";
        const value =
          typeof rawValue === "number" || typeof rawValue === "string"
            ? valueFormatter?.(rawValue, name) ?? String(rawValue)
            : String(rawValue);

        return (
          <div
            key={`${name}-${value}`}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: entry.color ?? "#1b6fd4",
            }}
          >
            {name}: {value}
          </div>
        );
      })}
    </div>
  );
}
