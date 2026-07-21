// src/lib/ethiopiancal.ts
export interface EthDate {
  year: number;
  month: number;
  day: number;
}

export interface EthDateWords {
  year: number;
  month: string;
  day: number;
}

export interface GregorianDate {
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
};

export const ethMonthNamesEnglish: Record<number, string> = {
  1: 'Meskerem',
  2: 'Tikimt',
  3: 'Hidar',
  4: 'Tahsas',
  5: 'Tir',
  6: 'Yekatit',
  7: 'Megabit',
  8: 'Miyazya',
  9: 'Ginbot',
  10: 'Sene',
  11: 'Hamle',
  12: 'Nehase',
  13: 'Pagume',
};

// ---------- Gregorian helpers ----------
function isGregorianLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  if (year % 400 !== 0) return false;
  return true;
}

const GREG_MONTH_DAYS = [
  0, 31, 28, 31, 30, 31, 30,
  31, 31, 30, 31, 30, 31,
];

function getGregorianMonthDays(year: number, month: number): number {
  if (month === 2 && isGregorianLeapYear(year)) {
    return 29;
  }
  return GREG_MONTH_DAYS[month];
}

function gregorianToAbsoluteDays(date: GregorianDate): number {
  let { year, month, day } = date;
  let y = year - 1;
  const daysFromYears =
    y * 365 +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400);

  let daysFromMonths = 0;
  for (let m = 1; m < month; m++) {
    daysFromMonths += getGregorianMonthDays(year, m);
  }

  return daysFromYears + daysFromMonths + day - 1;
}

// ---------- Ethiopian helpers ----------
function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 0;
}

const ETH_MONTH_DAYS = [
  0, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30,
];

export function getEthiopianMonthDaysCount(year: number, month: number): number {
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return ETH_MONTH_DAYS[month];
}

// Reference: Gregorian 2014-09-11 = Ethiopian 2006-01-01 (Meskerem 1, 2006)
// Reference: Gregorian 2024-07-20 = Ethiopian 2016-11-12 (Hamle 12, 2016)
function absoluteDaysToEthiopian(absDays: number): EthDate {
  const refGreg: GregorianDate = { year: 2014, month: 9, day: 11 };
  const refEth: EthDate = { year: 2006, month: 1, day: 1 };
  const refAbs = gregorianToAbsoluteDays(refGreg);

  let diffDays = absDays - refAbs;

  let year = refEth.year;
  let month = refEth.month;
  let day = refEth.day;

  // Move forward based on difference
  if (diffDays >= 0) {
    while (diffDays > 0) {
      const daysInMonth = getEthiopianMonthDaysCount(year, month);
      if (diffDays >= daysInMonth) {
        diffDays -= daysInMonth;
        if (month === 13) {
          month = 1;
          year++;
        } else {
          month++;
        }
      } else {
        day = 1 + diffDays;
        diffDays = 0;
      }
    }
  } else {
    // Move backward
    while (diffDays < 0) {
      if (day > 1) {
        const daysToSubtract = Math.min(Math.abs(diffDays), day - 1);
        day -= daysToSubtract;
        diffDays += daysToSubtract;
      } else {
        if (month === 1) {
          month = 13;
          year--;
        } else {
          month--;
        }
        const daysInPrevMonth = getEthiopianMonthDaysCount(year, month);
        const daysToSubtract = Math.min(Math.abs(diffDays), daysInPrevMonth);
        day = daysInPrevMonth - daysToSubtract + 1;
        diffDays += daysToSubtract;
      }
    }
  }

  return { year, month, day };
}

// Convert Ethiopian date to Gregorian
export function ethiopianToGregorianDate(ethDate: EthDate): GregorianDate {
  const refGreg: GregorianDate = { year: 2014, month: 9, day: 11 };
  const refEth: EthDate = { year: 2006, month: 1, day: 1 };
  const refAbs = gregorianToAbsoluteDays(refGreg);

  // Calculate days from reference Ethiopian date to target
  let days = 0;
  let tempYear = refEth.year;
  let tempMonth = refEth.month;
  let tempDay = refEth.day;

  // Move forward to target date
  while (
    tempYear < ethDate.year ||
    (tempYear === ethDate.year && tempMonth < ethDate.month) ||
    (tempYear === ethDate.year && tempMonth === ethDate.month && tempDay < ethDate.day)
  ) {
    days++;
    tempDay++;
    const daysInMonth = getEthiopianMonthDaysCount(tempYear, tempMonth);
    if (tempDay > daysInMonth) {
      tempDay = 1;
      tempMonth++;
      if (tempMonth > 13) {
        tempMonth = 1;
        tempYear++;
      }
    }
  }

  const absDays = refAbs + days;

  // Convert absolute days back to Gregorian
  let year = 1;
  let month = 1;
  let day = 1;
  let remaining = absDays;

  // Find year
  while (remaining >= (isGregorianLeapYear(year) ? 366 : 365)) {
    remaining -= isGregorianLeapYear(year) ? 366 : 365;
    year++;
  }

  // Find month
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = getGregorianMonthDays(year, m);
    if (remaining < daysInMonth) {
      month = m;
      day = remaining + 1;
      break;
    }
    remaining -= daysInMonth;
  }

  return { year, month, day };
}

// ---------- Main conversion functions ----------
export function gregorianToEthiopianDate(gregorianDate: GregorianDate): EthDate {
  const absDays = gregorianToAbsoluteDays(gregorianDate);
  return absoluteDaysToEthiopian(absDays);
}

export function getEthiopianMonthName(month: number, language: 'amharic' | 'english' = 'amharic'): string {
  if (month < 1 || month > 13) {
    throw new Error(`Invalid Ethiopian month: ${month}`);
  }
  return language === 'amharic' ? ethMonthNames[month] : ethMonthNamesEnglish[month];
}

export function ethiopianDateToWords(gregorianDate: GregorianDate): EthDateWords {
  const ethDate = gregorianToEthiopianDate({
    year: gregorianDate.year,
    month: gregorianDate.month,
    day: gregorianDate.day,
  });

  const ethMonthName = ethMonthNames[ethDate.month];
  return {
    year: ethDate.year,
    month: ethMonthName,
    day: ethDate.day,
  };
}

export function dateToEthiopian(date: Date): EthDateWords {
  return ethiopianDateToWords({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function ethiopianDateToDate(ethDate: EthDateWords): Date {
  // Find the month number from the name
  let monthNumber = 1;
  for (const [key, value] of Object.entries(ethMonthNames)) {
    if (value === ethDate.month) {
      monthNumber = parseInt(key);
      break;
    }
  }

  const gregDate = ethiopianToGregorianDate({
    year: ethDate.year,
    month: monthNumber,
    day: ethDate.day,
  });
  return new Date(gregDate.year, gregDate.month - 1, gregDate.day);
}

export function formatEthiopianDate(date: Date | EthDateWords, format: 'short' | 'long' = 'long'): string {
  let ethDate: EthDateWords;

  if (date instanceof Date) {
    ethDate = dateToEthiopian(date);
  } else {
    ethDate = date;
  }

  if (format === 'short') {
    return `${ethDate.month} ${ethDate.day}, ${ethDate.year}`;
  }

  return `${ethDate.month} ${ethDate.day}፣ ${ethDate.year} ዓ.ም.`;
}

export function getEthiopianToday(): EthDateWords {
  const today = new Date();
  return ethiopianDateToWords({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
}

// Helper to check if a date is a chore day
export function isChoreDay(ethDate: EthDateWords): boolean {
  const choreDays = [1, 12, 21, 23, 24];
  return choreDays.includes(ethDate.day);
}

// Helper to get all chore days in a month
export function getChoreDaysInMonth(ethYear: number, ethMonth: number): EthDateWords[] {
  const daysInMonth = getEthiopianMonthDaysCount(ethYear, ethMonth);
  const choreDays: EthDateWords[] = [];
  const choreDayNumbers = [1, 12, 21, 23, 24];
  const monthName = ethMonthNames[ethMonth];

  for (let day = 1; day <= daysInMonth; day++) {
    if (choreDayNumbers.includes(day)) {
      choreDays.push({
        year: ethYear,
        month: monthName,
        day: day,
      });
    }
  }

  return choreDays;
}

// Helper to get all Sundays in an Ethiopian month
export function getSundaysInMonth(ethYear: number, ethMonth: number): EthDateWords[] {
  const daysInMonth = getEthiopianMonthDaysCount(ethYear, ethMonth);
  const sundays: EthDateWords[] = [];
  const monthName = ethMonthNames[ethMonth];

  for (let day = 1; day <= daysInMonth; day++) {
    try {
      const ethDay = { year: ethYear, month: monthName, day };
      const gregDate = ethiopianDateToDate(ethDay);
      if (gregDate.getDay() === 0) {
        // Sunday
        sundays.push({
          year: ethYear,
          month: monthName,
          day: day,
        });
      }
    } catch {
      continue;
    }
  }

  return sundays;
}

export const ethTodayDate = getEthiopianToday();