// /mezmur/events/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ethMonthNames, getEthiopianToday, ethiopianToGregorianDate } from '@/src/lib/ethiopiancal';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface FormData {
  title: string;
  description: string;
  location: string;
  ethiopianYear: string;
  ethiopianMonth: string;
  ethiopianDay: string;
  hour: string;
  minute: string;
  isRecurring: boolean;
  targetMemberTypes: string[];
  eligibilityRuleId: string;
}

interface EligibilityRule {
  id: string;
  name: string;
}

const memberTypeOptions = [
  { value: 'REGULAR_MEMBER', label: 'ወጣት አባል' },
  { value: 'COURSE_STUDENT', label: 'ኮርሰኛ አባል' },
  { value: 'YOUTH_STUDENT', label: 'ማዕከላዊ አባል' },
];

export default function NewMezmurEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const today = getEthiopianToday();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    ethiopianYear: String(today.year),
    ethiopianMonth: '1',
    ethiopianDay: '1',
    hour: '10',
    minute: '00',
    isRecurring: false,
    targetMemberTypes: [],
    eligibilityRuleId: '',
  });

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch('/api/abalat/eligibility-rules');
        if (res.ok) {
          const data = await res.json();
          setRules(data);
        }
      } catch (err) {
        console.error('Failed to fetch rules:', err);
      }
    }
    fetchRules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const monthNumber = parseInt(formData.ethiopianMonth);
      const day = parseInt(formData.ethiopianDay);
      const year = parseInt(formData.ethiopianYear);
      const hour = parseInt(formData.hour) || 0;
      const minute = parseInt(formData.minute) || 0;

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (year < 1900 || year > 2100) {
        throw new Error('Please enter a valid Ethiopian year (1900-2100)');
      }

      if (day < 1 || day > 30) {
        throw new Error('Please enter a valid day (1-30)');
      }

      if (monthNumber < 1 || monthNumber > 13) {
        throw new Error('Please select a valid month');
      }

      // Convert Ethiopian date to Gregorian
      const gregorianDateObj = ethiopianToGregorianDate({
        year: year,
        month: monthNumber,
        day: day,
      });

      if (!gregorianDateObj || !gregorianDateObj.year) {
        throw new Error('Failed to convert Ethiopian date to Gregorian');
      }

      const gregorianDate = new Date(
        gregorianDateObj.year,
        gregorianDateObj.month - 1,
        gregorianDateObj.day,
        hour,
        minute
      );

      if (isNaN(gregorianDate.getTime())) {
        throw new Error('Invalid date created from Ethiopian date conversion');
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        date: gregorianDate.toISOString(),
        location: formData.location || undefined,
        ethiopianYear: year,
        ethiopianMonth: monthNumber,
        ethiopianDay: day,
        isRecurring: formData.isRecurring,
        recurringMonth: formData.isRecurring ? monthNumber : null,
        recurringDay: formData.isRecurring ? day : null,
        eligibilityRuleId: formData.eligibilityRuleId || undefined,
        targetMemberTypes: formData.targetMemberTypes.length > 0 ? formData.targetMemberTypes : undefined,
      };

      const response = await fetch('/api/mezmur/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      router.push('/mezmur/events');
      router.refresh();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'በዓላት', href: '/mezmur/events' },
          { label: 'ዐዲስ በዓል' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          ዐዲስ የመዝሙር በዓል መዝግብ
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          የመዝሙር አገልግሎት የሚገለገልበት ዐዲስ በዓልን መዝግብ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="rounded-lg p-6 space-y-4"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የበዓል መጠሪያ *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              required
              placeholder="ምሳሌ... የመዝሙር በዓል፣ ..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              ገለፃ (የበዓል ማብራሪያ)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              rows={3}
              placeholder="የበዓል ማብራሪያ..."
            />
          </div>

          {/* Ethiopian Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የበዓል ቀን *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={formData.ethiopianMonth}
                onChange={(e) => setFormData({ ...formData, ethiopianMonth: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                required
              >
                {Object.entries(ethMonthNames).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={formData.ethiopianDay}
                onChange={(e) => setFormData({ ...formData, ethiopianDay: e.target.value })}
                min="1"
                max="30"
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                required
                placeholder="ቀን"
              />
              <input
                type="number"
                value={formData.ethiopianYear}
                onChange={(e) => setFormData({ ...formData, ethiopianYear: e.target.value })}
                min="1900"
                max="2100"
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                required
                placeholder="ዓመት"
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              ሰዓት
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                min="0"
                max="23"
                className="rounded border px-3 py-2 text-sm flex-1"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                placeholder="ሰዓት (0-23)"
              />
              <input
                type="number"
                value={formData.minute}
                onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                min="0"
                max="59"
                className="rounded border px-3 py-2 text-sm flex-1"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                placeholder="ደቂቃ (0-59)"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              ቦታ
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              placeholder="የበዓሉ ቦታ..."
            />
          </div>

          {/* Recurring */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                የሚደገመ በዓል
              </span>
            </label>
            {formData.isRecurring && (
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                ይህ በዓል በየዓመቱ በዚህ ቀን ይደገማል
              </p>
            )}
          </div>

          {/* Eligibility Rule */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የማሟላት መስፈርት
            </label>
            <select
              value={formData.eligibilityRuleId}
              onChange={(e) => setFormData({ ...formData, eligibilityRuleId: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="">መስፈርት የለም</option>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Member Types */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የሚተገበሩ አባላት
            </label>
            <div className="space-y-2">
              {memberTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.targetMemberTypes.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          targetMemberTypes: [...formData.targetMemberTypes, option.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          targetMemberTypes: formData.targetMemberTypes.filter((t) => t !== option.value),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            className="rounded p-3 text-sm font-medium"
            style={{
              background: 'hsl(0 40% 10%)',
              border: '1px solid hsl(0 40% 22%)',
              color: 'hsl(0 55% 62%)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href="/mezmur/events"
            className="rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            ተው
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 flex items-center gap-2"
            style={{
              background: 'hsl(25 70% 32%)',
              color: '#fff',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                በማስቀመጥ ላይ...
              </>
            ) : (
              'በዓል መዝግብ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
