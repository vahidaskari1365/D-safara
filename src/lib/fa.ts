// Persian digit & formatting utilities for D.Safara

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert any latin digits inside a string/number to Persian digits */
export function toFa(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format a number with thousand separators then to Persian digits */
export function faNum(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return toFa("۰");
  return toFa(
    n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}

/** Format price in Toman */
export function faToman(n: number | null | undefined): string {
  return `${faNum(n)} تومان`;
}

/** Short compact number (e.g. 12.5K / 3.2M) in Persian */
export function faCompact(n: number | null | undefined): string {
  if (n == null) return toFa(0);
  if (Math.abs(n) >= 1_000_000) return `${faNum(n / 1_000_000, 1)} میلیون`;
  if (Math.abs(n) >= 1000) return `${faNum(n / 1000, 1)} هزار`;
  return faNum(n);
}

/** percent in Persian */
export function faPercent(n: number | null | undefined, digits = 0): string {
  return `${faNum(n ?? 0, digits)}٪`;
}

const FA_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Gregorian -> Jalali conversion (algorithmic, no deps) */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/** Format a Date/ISO string to Persian date like "۱۴ آبان ۱۴۰۳" */
export function faDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${toFa(jd)} ${FA_MONTHS[jm - 1]} ${toFa(jy)}`;
}

/** Format with weekday + time like "شنبه ۱۴ آبان، ساعت ۱۸:۳۰" */
export function faDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${faDate(d)} • ${toFa(`${h}:${m}`)}`;
}

/** time-only */
export function faTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return toFa(`${h}:${m}`);
}

/** relative time in Persian */
export function faAgo(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "لحظاتی پیش";
  if (diff < 3600) return `${toFa(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toFa(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 2592000) return `${toFa(Math.floor(diff / 86400))} روز پیش`;
  return faDate(d);
}

/** Jalali month names for charts/calendars */
export { FA_MONTHS };

/** Persian weekday names (index 0 = Saturday) */
export const FA_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export function faWeekday(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  // JS: 0=Sunday ... 6=Saturday -> Persian index: Saturday=0
  return FA_WEEKDAYS[(d.getDay() + 1) % 7];
}

export const faStatusMap: Record<string, string> = {
  ACTIVE: "فعال",
  INACTIVE: "غیرفعال",
  PENDING: "در انتظار",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  REFUNDED: "بازپرداخت شده",
  COMPLETED: "تکمیل شده",
  IN_PROGRESS: "در جریان",
  OPEN: "باز",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
  CANCELLED: "لغو شده",
  SCHEDULED: "زمان‌بندی شده",
  ACCEPTED: "تایید شده",
  REJECTED: "رد شده",
  SUBMITTED: "ارسال شده",
  GRADED: "نمره داده شده",
  WIN: "سود",
  LOSS: "ضرر",
  BREAKEVEN: "سربه‌سر",
};

export function faStatus(s: string | null | undefined): string {
  if (!s) return "—";
  return faStatusMap[s] ?? s;
}
