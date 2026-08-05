"use client";

import { useState, useEffect } from "react";
import { ethMonthNames, getEthiopianMonthDaysCount, parseEthiopianDateString, ethiopianDateWordsToISO, ethDateWordsToNumeric } from "@/src/lib/ethiopiancal";

interface EthiopianDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function EthiopianDatePicker({ value, onChange, label, required }: EthiopianDatePickerProps) {
  const ethDate = parseEthiopianDateString(value);
  const numericDate = ethDateWordsToNumeric(ethDate);

  const [day, setDay] = useState(numericDate.day);
  const [month, setMonth] = useState(numericDate.month);
  const [year, setYear] = useState(numericDate.year);

  // Sync state with value prop
  useEffect(() => {
    const parsed = parseEthiopianDateString(value);
    const num = ethDateWordsToNumeric(parsed);
    setDay(num.day);
    setMonth(num.month);
    setYear(num.year);
  }, [value]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    updateValue(newYear, month, day);
  };

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    // Adjust day if it exceeds the new month's day count
    const maxDays = getEthiopianMonthDaysCount(year, newMonth);
    const adjustedDay = day > maxDays ? maxDays : day;
    if (day !== adjustedDay) setDay(adjustedDay);
    updateValue(year, newMonth, adjustedDay);
  };

  const handleDayChange = (newDay: number) => {
    setDay(newDay);
    updateValue(year, month, newDay);
  };

  const updateValue = (y: number, m: number, d: number) => {
    const iso = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    onChange(iso);
  };

  const daysInMonth = getEthiopianMonthDaysCount(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 20 }, (_, i) => (year - 10) + i); // Show 10 years before and after current

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {label} {required && "*"}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {/* Month Select */}
        <select
          value={month}
          onChange={(e) => handleMonthChange(parseInt(e.target.value))}
          className="h-9 rounded border px-2 text-xs transition-all duration-150"
          style={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {Object.entries(ethMonthNames).map(([num, name]) => (
            <option key={num} value={num}>{name}</option>
          ))}
        </select>

        {/* Day Select */}
        <select
          value={day}
          onChange={(e) => handleDayChange(parseInt(e.target.value))}
          className="h-9 rounded border px-2 text-xs transition-all duration-150"
          style={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {days.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Year Select */}
        <select
          value={year}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          className="h-9 rounded border px-2 text-xs transition-all duration-150"
          style={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
