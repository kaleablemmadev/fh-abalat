/* /src/lib/ethiopiancal.ts */
export interface EthDate {
  year: number;
  month: number;
  day: number;
}

export interface EthDateWords {
    year: number;
    month: string;
    day: number
}

interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export const ethMonthNames: Record<number, string> = {
  1: 'መስከረም',
  2: 'ጥቅምት',
  3: 'ኅዳር',
  4: 'ታኅሣሥ',
  5: 'ጥር',
  6: 'የካቲት',
  7: 'መጋቢት',
  8: 'ሚያዚያ',
  9: 'ግንቦት',
  10: 'ሰኔ',
  11: 'ሐምሌ',
  12: 'ነሐሴ',
  13: 'ጳጉሜ',
}

// ---------- Gregorian helpers ----------

function isGregorianLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  if (year % 400 !== 0) return false;
  return true;
}

const GREG_MONTH_DAYS = [
  0, // unused, 1-based
  31, 28, 31, 30, 31, 30,
  31, 31, 30, 31, 30, 31,
];

function getGregorianMonthDays(year: number, month: number): number {
  if (month === 2 && isGregorianLeapYear(year)) {
    return 29;
  }
  return GREG_MONTH_DAYS[month];
}

// Absolute days from a fixed epoch (0001-01-01 Gregorian)
function gregorianToAbsoluteDays(date: GregorianDate): number {
  let { year, month, day } = date;

  // Days from complete years before this year
  let y = year - 1;
  const daysFromYears =
    y * 365 +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400);

  // Days from complete months in current year
  let daysFromMonths = 0;
  for (let m = 1; m < month; m++) {
    daysFromMonths += getGregorianMonthDays(year, m);
  }

  return daysFromYears + daysFromMonths + day - 1;
}

// ---------- Ethiopian helpers ----------

// Ethiopian leap year: every 4 years without the 100/400 rules
function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 0;
}

const ETH_MONTH_DAYS = [
  0, // unused, 1-based
  30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, // 13 months (last is Pagume)
];

function getEthiopianMonthDays(year: number, month: number): number {
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return ETH_MONTH_DAYS[month];
}

function absoluteDaysToEthiopian(absDays: number): EthDate {
  // Ethiopian epoch relative to Gregorian:
  // We'll derive by aligning a known date pair.
  // Known: Gregorian 2000-01-01 ≈ Ethiopian 1992-04-22 (approx).
  // Instead of hard-coding complex epoch math, we can use a simpler approach:
  // Use a reference absolute day for a known Ethiopian date and offset from there.

  // Reference: Gregorian 2000-01-01 -> Ethiopian 1992-04-22
  const refGreg: GregorianDate = { year: 2000, month: 1, day: 1 };
  const refEth: EthDate = { year: 1992, month: 4, day: 22 };

  const refAbs = gregorianToAbsoluteDays(refGreg);

  // Convert reference Ethiopian date to absolute days by brute-forward from an approximated start.
  // Simpler: compute absolute days for refEth by iterating from a safe low year upward.
  // But that's inefficient. Instead, we can treat refAbs as the "anchor" and compute all Ethiopian
  // dates by counting from refEth forward/backward using Ethiopian calendar rules.

  // We'll implement a direct conversion by counting days from refEth.
  let remainingDays = absDays - refAbs + 1; // can be negative

  // Start from reference Ethiopian date
  let year = refEth.year;
  let month = refEth.month;
  let day = refEth.day;

  if (remainingDays >= 0) {
    // Move forward
    // First, complete current day
    while (remainingDays > 0) {
      const daysInCurrentMonth = getEthiopianMonthDays(year, month);
      const daysLeftInMonth = daysInCurrentMonth - day;

      if (remainingDays <= daysLeftInMonth) {
        day += remainingDays;
        remainingDays = 0;
      } else {
        remainingDays -= daysLeftInMonth + 1; // +1 to move to next day after month end
        day = 1;
        if (month === 13) {
          month = 1;
          year++;
        } else {
          month++;
        }
      }
    }
  } else {
    // Move backward
    while (remainingDays < 0) {
      if (day > 1) {
        day--;
        remainingDays++;
      } else {
        // go to previous month
        if (month === 1) {
          month = 13;
          year--;
        } else {
          month--;
        }
        const daysInPrevMonth = getEthiopianMonthDays(year, month);
        day = daysInPrevMonth;
        remainingDays++;
      }
    }
  }

  return { year, month, day };
}

// ---------- Main conversion ----------

export function gregorianToEthiopianDate(gregorianDate: GregorianDate): EthDate {
  const absDays = gregorianToAbsoluteDays(gregorianDate);
  return absoluteDaysToEthiopian(absDays);
}

// --- Get month name ---
function getEthiopianMonthName(month: number): string {
    if(month < 1 || month > 13) {
        throw new Error(`Invalid Ethiopian month: ${month}`);
    }
    return ethMonthNames[month];
}

// ---------- To words ----------
export function ethiopianDateToWords(gregorianDate: GregorianDate): EthDateWords {
    const ethDate = gregorianToEthiopianDate({ year: gregorianDate.year, month: gregorianDate.month, day: gregorianDate.day });
    getEthiopianMonthName(ethDate.month)

    const ethMonthName = ethMonthNames[ethDate.month];
    const ethDateWithWords = { year: ethDate.year, month: ethMonthName, day: ethDate.day };
    return ethDateWithWords;
}

const today = new Date();
const todayDate = today.toISOString().split('T')[0];

export const ethTodayDate: EthDateWords = ethiopianDateToWords({
    year: Number(todayDate.split("-")[0]),
    month: Number(todayDate.split("-")[1]),
    day: Number(todayDate.split("-")[2]),
})