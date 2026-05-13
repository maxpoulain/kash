import type { NetWorthHistoryPoint } from "@/types/api";

interface Props {
  points: NetWorthHistoryPoint[];
  width?: number;
  height?: number;
}

export function NetWorthSparkline({ points, width = 320, height = 60 }: Props) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * w;
    const y = pad + (1 - (p.total - min) / range) * h;
    return `${x},${y}`;
  });

  const d = `M${coords.join(" L")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}
