import { ExampleNote } from "@/components/ExampleNote";

export function TrendChart() {
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
      </svg>
      <ExampleNote>
        A tendência real chega com o motor de conciliação (plano futuro) — este gráfico é ilustrativo.
      </ExampleNote>
    </div>
  );
}
