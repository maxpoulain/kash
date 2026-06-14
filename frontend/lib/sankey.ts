// Pure geometry for the Analyse page money-flow diagram (Sankey-style).
//
// Income sources flow into a central pool, which flows out into expense
// categories plus one or more savings nodes (named wealth destinations and the
// leftover that stayed liquid — see 00058 T5a). Each side is scaled
// independently to fill the available height, so the diagram stays legible
// whether the month is in surplus or deficit.

export interface SankeyItem {
  id: string;
  label: string;
  amount: number;
  color: string;
}

export interface SankeyInput {
  income: SankeyItem[];
  expense: SankeyItem[];
  /** Savings outflow nodes (named wealth destinations + any leftover that stayed
   *  liquid). Already labelled/coloured by the caller; empty in a deficit month. */
  savings: SankeyItem[];
  width: number;
  height: number;
  nodeWidth?: number;
  poolWidth?: number;
  gap?: number;
  /** Horizontal gutters reserved for text labels. */
  padLeft?: number;
  padRight?: number;
}

export type NodeSide = "income" | "pool" | "expense" | "savings";

export interface LaidNode {
  id: string;
  label: string;
  amount: number;
  color: string;
  side: NodeSide;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LaidLink {
  id: string;
  /** Id of the node this ribbon carries the value of (for hover). */
  nodeId: string;
  color: string;
  /** Filled SVG path describing the ribbon. */
  d: string;
}

export interface SankeyLayout {
  nodes: LaidNode[];
  links: LaidLink[];
}

function ribbon(x0: number, y0t: number, y0b: number, x1: number, y1t: number, y1b: number): string {
  const xc = (x0 + x1) / 2;
  return (
    `M${x0},${y0t} C${xc},${y0t} ${xc},${y1t} ${x1},${y1t} ` +
    `L${x1},${y1b} C${xc},${y1b} ${xc},${y0b} ${x0},${y0b} Z`
  );
}

interface Band {
  item: SankeyItem;
  y0: number;
  y1: number;
}

/** Stack items vertically, scaled so they fill `height` with `gap` between them. */
function stack(items: SankeyItem[], height: number, gap: number): Band[] {
  const total = items.reduce((sum, it) => sum + it.amount, 0);
  if (total <= 0) return [];
  const usable = Math.max(height - gap * (items.length - 1), 0);
  const scale = usable / total;
  const bands: Band[] = [];
  let y = 0;
  for (const item of items) {
    const h = item.amount * scale;
    bands.push({ item, y0: y, y1: y + h });
    y += h + gap;
  }
  return bands;
}

export function computeSankeyLayout(input: SankeyInput): SankeyLayout {
  const {
    income,
    expense,
    savings,
    width,
    height,
    nodeWidth = 12,
    poolWidth = 16,
    gap = 6,
    padLeft = 0,
    padRight = 0,
  } = input;

  const savingsIds = new Set(savings.map((item) => item.id));
  const rightItems: SankeyItem[] = [...expense, ...savings.filter((item) => item.amount > 0)];

  const leftBands = stack(income, height, gap);
  const rightBands = stack(rightItems, height, gap);
  // Pool-edge bands have no gaps, so each side's ribbons fully cover the pool.
  const poolLeftBands = stack(income, height, 0);
  const poolRightBands = stack(rightItems, height, 0);

  const poolX = (padLeft + (width - padRight)) / 2 - poolWidth / 2;
  const leftRight = padLeft + nodeWidth; // right edge of income column
  const rightLeft = width - padRight - nodeWidth; // left edge of expense column

  const nodes: LaidNode[] = [];
  const links: LaidLink[] = [];

  leftBands.forEach((band, i) => {
    nodes.push({
      ...band.item,
      side: "income",
      x: padLeft,
      y: band.y0,
      w: nodeWidth,
      h: band.y1 - band.y0,
    });
    const pool = poolLeftBands[i];
    links.push({
      id: `in-${band.item.id}`,
      nodeId: band.item.id,
      color: band.item.color,
      d: ribbon(leftRight, band.y0, band.y1, poolX, pool.y0, pool.y1),
    });
  });

  if (income.length > 0) {
    nodes.push({
      id: "pool",
      label: "pool",
      amount: 0,
      color: "var(--ink-3)",
      side: "pool",
      x: poolX,
      y: 0,
      w: poolWidth,
      h: height,
    });
  }

  rightBands.forEach((band, i) => {
    nodes.push({
      ...band.item,
      side: savingsIds.has(band.item.id) ? "savings" : "expense",
      x: rightLeft,
      y: band.y0,
      w: nodeWidth,
      h: band.y1 - band.y0,
    });
    const pool = poolRightBands[i];
    links.push({
      id: `out-${band.item.id}`,
      nodeId: band.item.id,
      color: band.item.color,
      d: ribbon(poolX + poolWidth, pool.y0, pool.y1, rightLeft, band.y0, band.y1),
    });
  });

  return { nodes, links };
}
