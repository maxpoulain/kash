export type Month = string;

export function currentMonth(): Month {
  return new Date().toISOString().slice(0, 7);
}

export function prevMonth(month: Month): Month {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(month: Month): Month {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: Month, locale: string = "fr-FR"): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString(locale, { month: "long", year: "numeric" });
}

export function isCurrentMonth(month: Month): boolean {
  return month === currentMonth();
}

export function getMonthDays(month: Month): {
  currentDay: number;
  totalDays: number;
  daysLeft: number;
} {
  const [year, m] = month.split("-").map(Number);
  const totalDays = new Date(year, m, 0).getDate();
  const now = new Date();
  const isCurrent = now.getFullYear() === year && now.getMonth() + 1 === m;
  const currentDay = isCurrent ? now.getDate() : totalDays;
  const daysLeft = Math.max(totalDays - currentDay, 0);
  return { currentDay, totalDays, daysLeft };
}
