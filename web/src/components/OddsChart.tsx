"use client";
import { Flag } from "@/components/Flag";

// Polymarket-style odds chart: one line per option showing its implied probability (% of the
// pool) over time, reconstructed from the market's stake history. Pure inline SVG (no deps).
type Point = { t: number; pcts: number[] };

// Short axis label, e.g. "Jul 12, 9:04 PM".
function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function OddsChart({ series, labels, sashes = [], colors }: { series: Point[]; labels: string[]; sashes?: (string | null | undefined)[]; colors: string[] }) {
  const W = 520, H = 180, PAD_L = 30, PAD_B = 18, PAD_T = 8, PAD_R = 8;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  if (!series || series.length < 2) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-dashed border-[#e7e2d3] text-xs text-[#9a968b]">
        The odds chart appears once there are a few predictions.
      </div>
    );
  }

  const n = labels.length;
  const xAt = (i: number) => PAD_L + (series.length === 1 ? 0 : (i / (series.length - 1)) * plotW);
  const yAt = (pct: number) => PAD_T + (1 - pct / 100) * plotH;

  const last = series[series.length - 1].pcts;
  const visibleOptions = Array.from({ length: n }, (_, index) => index)
    .filter((index) => (last[index] ?? 0) > 0)
    .sort((a, b) => (last[b] ?? 0) - (last[a] ?? 0))
    .slice(0, 8);
  const paths = visibleOptions.map((opt) => ({ opt, d:
    series.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.pcts[opt] ?? 0).toFixed(1)}`).join(" ")
  }));
  const hiddenActive = Math.max(0, Array.from({ length: n }, (_, index) => index).filter((index) => (last[index] ?? 0) > 0).length - visibleOptions.length);
  const inactive = Math.max(0, n - visibleOptions.length - hiddenActive);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Odds over time">
        {/* horizontal gridlines at 0/25/50/75/100% */}
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yAt(g)} y2={yAt(g)} stroke="currentColor" className="text-[#eee6d3]" strokeWidth={1} />
            <text x={PAD_L - 5} y={yAt(g) + 3} textAnchor="end" className="fill-[#9a968b]" fontSize={9}>{g}</text>
          </g>
        ))}
        {paths.map(({ d, opt }) => (
          <path key={opt} d={d} fill="none" stroke={colors[opt % colors.length]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      <div className="mt-0.5 flex justify-between px-[30px] text-[10px] text-[#9a968b]">
        <span>{fmtTime(series[0].t)}</span>
        <span>{fmtTime(series[series.length - 1].t)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#7a7768]" aria-label="Active outcomes">
        {visibleOptions.map((i) => (
          <span key={i} className="flex items-center gap-1 rounded-full border border-[#eee6d3] bg-white px-2 py-1" title={`${labels[i]} ${last[i] ?? 0}%`} aria-label={`${labels[i]} ${last[i] ?? 0}%`}>
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
            {sashes[i] ? <Flag sash={sashes[i]} className="!h-3 !w-4" /> : <span className="max-w-24 truncate">{labels[i]}</span>}
            <b className="tabular-nums">{last[i] ?? 0}%</b>
          </span>
        ))}
        {hiddenActive > 0 && <span className="rounded-full bg-[#f1eee4] px-2 py-1">+{hiddenActive} active</span>}
        {inactive > 0 && <span className="rounded-full bg-[#f1eee4] px-2 py-1">{inactive} awaiting a prediction</span>}
      </div>
    </div>
  );
}
