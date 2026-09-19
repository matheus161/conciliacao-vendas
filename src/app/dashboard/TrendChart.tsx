"use client";

import { useState } from "react";
import { ExampleNote } from "@/components/ExampleNote";

type Point = { month: string; x: number; y: number; value: string };

const POINTS: Point[] = [
  { month: "Mar", x: 60, y: 111, value: "93,1%" },
  { month: "Abr", x: 176, y: 98, value: "94,3%" },
  { month: "Mai", x: 292, y: 124, value: "91,8%" },
  { month: "Jun", x: 408, y: 72, value: "95,6%" },
  { month: "Jul", x: 524, y: 59, value: "96,4%" },
  { month: "Ago", x: 600, y: 33, value: "97,5%" },
];

const TOOLTIP_WIDTH = 74;
const TOOLTIP_HEIGHT = 40;

// Full-height hover bands (one per point, split at the midpoint between neighbors) instead of
// small circles on the dots themselves — a band is a much easier, more forgiving target than a
// 12px circle at a y-coordinate that varies a lot from point to point.
const CHART_LEFT = 40;
const CHART_RIGHT = 620;
const CHART_TOP = 14;
const CHART_BOTTOM = 156;

const BAND_EDGES = [
  CHART_LEFT,
  ...POINTS.slice(0, -1).map((p, i) => (p.x + POINTS[i + 1].x) / 2),
  CHART_RIGHT,
];

export function TrendChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered !== null ? POINTS[hovered] : null;
  const tooltipX = active
    ? Math.min(Math.max(active.x - TOOLTIP_WIDTH / 2, 6), 640 - TOOLTIP_WIDTH - 6)
    : 0;
  const tooltipY = active ? Math.max(active.y - TOOLTIP_HEIGHT - 12, 6) : 0;

  return (
    <div className="chart-panel">
      <span className="chart-tab">Últimos 6 meses</span>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch" />% conciliado
        </span>
      </div>
      <svg
        viewBox="0 0 640 190"
        width="100%"
        height="190"
        role="img"
        aria-label="Percentual conciliado de março a agosto, subindo de 93,1% para 97,5% (dado de exemplo)"
      >
        <line x1="40" y1="20" x2="40" y2="150" stroke="var(--rule)" strokeWidth="1" />
        <line x1="40" y1="150" x2="620" y2="150" stroke="var(--rule)" strokeWidth="1" />
        <text x="10" y="24" fontSize="11" fill="var(--ink-muted)">100%</text>
        <text x="10" y="88" fontSize="11" fill="var(--ink-muted)">95%</text>
        <text x="14" y="154" fontSize="11" fill="var(--ink-muted)">90%</text>
        <line x1="40" y1="20" x2="620" y2="20" stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="40" y1="85" x2="620" y2="85" stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
        <path
          d="M60,111 L176,98 L292,124 L408,72 L524,59 L600,33 L600,150 L60,150 Z"
          fill="var(--good)"
          opacity="0.10"
        />
        <path
          d="M60,111 L176,98 L292,124 L408,72 L524,59 L600,33"
          fill="none"
          stroke="var(--good)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="111" r="3.5" fill="var(--good)" />
        <circle cx="600" cy="33" r="4.5" fill="var(--good)" />
        <text x="52" y="128" fontSize="11.5" fill="var(--ink-muted)">Mar</text>
        <text x="168" y="128" fontSize="11.5" fill="var(--ink-muted)">Abr</text>
        <text x="284" y="140" fontSize="11.5" fill="var(--ink-muted)">Mai</text>
        <text x="400" y="128" fontSize="11.5" fill="var(--ink-muted)">Jun</text>
        <text x="516" y="128" fontSize="11.5" fill="var(--ink-muted)">Jul</text>
        <text x="574" y="128" fontSize="11.5" fill="var(--ink-muted)" fontWeight="700">Ago</text>
        <text x="560" y="24" fontSize="13" fill="var(--good)" fontWeight="700">97,5%</text>

        {active && (
          <rect
            x={BAND_EDGES[hovered as number]}
            y={CHART_TOP}
            width={BAND_EDGES[(hovered as number) + 1] - BAND_EDGES[hovered as number]}
            height={CHART_BOTTOM - CHART_TOP}
            fill="var(--ink)"
            opacity="0.04"
            pointerEvents="none"
          />
        )}

        {/* invisible full-height bands, one per point — a much easier hover target than the dots themselves */}
        {POINTS.map((p, i) => (
          <rect
            key={p.month}
            x={BAND_EDGES[i]}
            y={CHART_TOP}
            width={BAND_EDGES[i + 1] - BAND_EDGES[i]}
            height={CHART_BOTTOM - CHART_TOP}
            fill="transparent"
            pointerEvents="all"
            className="chart-hit"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {active && (
          <>
            <circle
              cx={active.x}
              cy={active.y}
              r="6"
              fill="var(--good)"
              stroke="var(--surface)"
              strokeWidth="2"
              pointerEvents="none"
            />
            <g className="chart-tooltip" pointerEvents="none">
              <rect x={tooltipX} y={tooltipY} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="7" />
              <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 17} textAnchor="middle" className="chart-tooltip-month">
                {active.month}
              </text>
              <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 32} textAnchor="middle" className="chart-tooltip-value">
                {active.value}
              </text>
            </g>
          </>
        )}
      </svg>
      <ExampleNote>
        A tendência real chega com o motor de conciliação (plano futuro) — este gráfico é ilustrativo.
      </ExampleNote>
    </div>
  );
}
