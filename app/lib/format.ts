/* ===================== */
/* Formatting & Dates */
/* Transaction dates are calendar days stored as "YYYY-MM-DD". They are never
   converted through UTC (toISOString), which used to shift days by one
   depending on the user's time zone.
*/
/* ===================== */

export const CURRENCY = "USD";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthYearFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export const formatMoney = (value: number) => money.format(value);
export const formatCompactMoney = (value: number) => compactMoney.format(value);
export const formatPercent = (value: number) => percent.format(value);

/** Local calendar day → "YYYY-MM-DD". */
export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const todayKey = () => toDateKey(new Date());

/** "YYYY-MM-DD" → Date at local midnight (never UTC). */
export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromDateKey(value);
  return toDateKey(date) === value;
}

export const formatDay = (key: string) => (isDateKey(key) ? dayFormat.format(fromDateKey(key)) : key);

/** "YYYY-MM" month key for grouping. */
export const monthKey = (key: string) => key.slice(0, 7);

export const formatMonthShort = (month: string) => monthFormat.format(fromDateKey(`${month}-01`));
export const formatMonthLong = (month: string) => monthYearFormat.format(fromDateKey(`${month}-01`));

export function shiftMonth(month: string, delta: number) {
  const date = fromDateKey(`${month}-01`);
  date.setMonth(date.getMonth() + delta);
  return monthKey(toDateKey(date));
}

/** Turns network failures into something a person can act on. */
export function friendlyError(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  if (/failed to fetch|network|load failed|fetch failed/i.test(message)) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return message;
}
