"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { computeSankeyLayout, type SankeyItem } from "@/lib/sankey";

const VIEW_W = 720;
const VIEW_H = 260;
const PAD_LEFT = 118;
const PAD_RIGHT = 152;
// Above this height labels show permanently; smaller nodes reveal theirs when
// their band (ribbon) or node is hovered, avoiding overlapping text.
const MIN_LABEL_H = 12;

interface SankeyFlowProps {
  income: SankeyItem[];
  expense: SankeyItem[];
  savings: SankeyItem[];
  formatCurrency: (amount: number) => string;
}

/** Money-flow diagram: income → pool → expenses + savings.
 *
 *  Ribbons/nodes are SVG (stretched to the box); labels are HTML overlaid on
 *  top so their font + size match the rest of the UI exactly. */
export function SankeyFlow({ income, expense, savings, formatCurrency }: SankeyFlowProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, links } = useMemo(
    () =>
      computeSankeyLayout({
        income,
        expense,
        savings,
        width: VIEW_W,
        height: VIEW_H,
        padLeft: PAD_LEFT,
        padRight: PAD_RIGHT,
      }),
    [income, expense, savings]
  );

  const enter = (id: string) => () => setHovered(id);
  const leave = (id: string) => () => setHovered((cur) => (cur === id ? null : cur));

  const labelNodes = nodes.filter(
    (n) => n.side !== "pool" && (n.h >= MIN_LABEL_H || n.id === hovered)
  );

  return (
    <div className="relative w-full" style={{ height: VIEW_H }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {links.map((link) => (
          <path
            key={link.id}
            d={link.d}
            fill={link.color}
            className="cursor-pointer transition-opacity"
            opacity={hovered ? (link.nodeId === hovered ? 0.5 : 0.16) : 0.32}
            onMouseEnter={enter(link.nodeId)}
            onMouseLeave={leave(link.nodeId)}
          />
        ))}
        {nodes.map((node) => (
          <rect
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.w}
            height={Math.max(node.h, 1)}
            rx={2}
            fill={node.color}
            opacity={node.side === "pool" ? 0.25 : 0.95}
            className={node.side === "pool" ? undefined : "cursor-pointer"}
            onMouseEnter={node.side === "pool" ? undefined : enter(node.id)}
            onMouseLeave={node.side === "pool" ? undefined : leave(node.id)}
          />
        ))}
      </svg>

      {/* HTML labels — pointer-events-none so the SVG bands stay hoverable. */}
      <div className="pointer-events-none absolute inset-0">
        {labelNodes.map((node) => {
          const isLeft = node.side === "income";
          const top = `${((node.y + node.h / 2) / VIEW_H) * 100}%`;
          const style: CSSProperties = isLeft
            ? { right: `${(1 - node.x / VIEW_W) * 100}%`, top, transform: "translateY(-50%)" }
            : { left: `${((node.x + node.w) / VIEW_W) * 100}%`, top, transform: "translateY(-50%)" };
          return (
            <div
              key={node.id}
              style={style}
              className="absolute flex items-center gap-1.5 whitespace-nowrap px-1.5"
            >
              <span className="text-[11px] font-medium text-foreground">{node.label}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {formatCurrency(node.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
