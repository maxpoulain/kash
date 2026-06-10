"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export interface BreakdownItem {
  id: string;
  label: string;
  amount: number;
  color: string;
}

interface CategoryBreakdownProps {
  title: string;
  items: BreakdownItem[];
  total: number;
  emptyLabel: string;
  formatCurrency: (amount: number) => string;
}

const CIRC = 2 * Math.PI * 40;

/** A donut + legend (with bars) of category contributions, matching the
 *  design-system insights/stats mockups. */
export function CategoryBreakdown({
  title,
  items,
  total,
  emptyLabel,
  formatCurrency,
}: CategoryBreakdownProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (items.length === 0 || total <= 0) {
    return (
      <Card className="gap-3 p-5">
        <div className="font-display text-lg font-semibold">{title}</div>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </Card>
    );
  }

  const enter = (id: string) => () => setHovered(id);
  const leave = (id: string) => () => setHovered((cur) => (cur === id ? null : cur));
  const dimmed = (id: string) => hovered !== null && hovered !== id;

  // Precompute each donut segment's dash + offset without mutation during render.
  const seg = (amount: number) => (amount / total) * CIRC;
  const segments = items.map((item, i) => ({
    item,
    length: seg(item.amount),
    dashOffset: -items.slice(0, i).reduce((sum, it) => sum + seg(it.amount), 0),
  }));

  return (
    <Card className="gap-4 p-5">
      <div className="font-display text-lg font-semibold">{title}</div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <svg width="150" height="150" viewBox="0 0 100 100" className="shrink-0">
          {segments.map(({ item, length, dashOffset }) => (
            <circle
              key={item.id}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={item.color}
              strokeWidth={hovered === item.id ? 16 : 14}
              strokeDasharray={`${length} ${CIRC - length}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="cursor-pointer transition-opacity"
              opacity={dimmed(item.id) ? 0.25 : 1}
              onMouseEnter={enter(item.id)}
              onMouseLeave={leave(item.id)}
            />
          ))}
          <text
            x="50"
            y="47"
            textAnchor="middle"
            fontSize="7"
            fontFamily="var(--font-mono)"
            fill="var(--ink-3)"
            letterSpacing="0.1em"
          >
            TOTAL
          </text>
          <text
            x="50"
            y="60"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-display)"
            fill="var(--ink)"
          >
            {formatCurrency(total)}
          </text>
        </svg>

        <div className="flex w-full flex-1 flex-col gap-2.5">
          {items.map((item) => {
            const pct = Math.round((item.amount / total) * 100);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-1 transition-opacity"
                style={{ opacity: dimmed(item.id) ? 0.4 : 1 }}
              >
                <div className="flex items-center gap-2 text-[13px]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: item.color }}
                  />
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span>
                  <span className="w-9 text-right font-mono text-[11px] text-muted-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="ml-[18px] h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
