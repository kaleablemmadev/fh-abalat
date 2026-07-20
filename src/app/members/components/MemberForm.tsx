// /members/components/MemberForm.tsx
'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ethMonthNames, getEthiopianToday } from '@/src/lib/ethiopiancal';
import {
  genderTypeValues,
  type genderType,
  type memberType,
} from '../constants/membersEnum';

interface Member {
  id: string;
  fullName: string;
  gender: genderType;
  age: number;
  christianName: string;
  registerDateDay: number;
  registerDateMonth: string;
  registerDateYear: number;
  memberType: memberType;
}

interface MemberDraft {
  fullName: string;
  gender: genderType;
  age: number;
  christianName: string;
  registerDateDay: number;
  registerDateMonth: string;
  registerDateYear: number;
}

interface MemberFormProps {
  initialData?: MemberDraft;
  memberId?: string;
}

const fieldBase = {
  className:
    'h-9 w-full rounded border px-3 text-sm transition-all duration-150 appearance-none',
  style: {
    background: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  },
};

export default function MemberForm({ initialData, memberId }: MemberFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(memberId);
  const isInitialMount = useRef(true);

  // Get today's Ethiopian date for default registration date
  const today = getEthiopianToday();
  const todayMonthNumber = Object.keys(ethMonthNames).find(
    key => ethMonthNames[parseInt(key)] === today.month
  );

  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [gender, setGender] = useState<genderType>(
    initialData?.gender ?? genderTypeValues[0]
  );
  const [age, setAge] = useState<number | ''>(initialData?.age ?? '');
  const [christianName, setChristianName] = useState(
    initialData?.christianName ?? ''
  );
  const [registerDateDay, setRegisterDateDay] = useState<number | ''>(
    initialData?.registerDateDay ?? today.day
  );
  const [registerDateMonth, setRegisterDateMonth] = useState(
    initialData?.registerDateMonth ?? todayMonthNumber ?? '1'
  );
  const [registerDateYear, setRegisterDateYear] = useState<number | ''>(
    initialData?.registerDateYear ?? today.year
  );

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Use a ref to track if we've already initialized
  const initialized = useRef(false);

  // Only update state when initialData changes and it's not the first mount
  useEffect(() => {
    // Skip the first mount since we already set initial state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (initialData && !initialized.current) {
      initialized.current = true;
      setFullName(initialData.fullName);
      setGender(initialData.gender);
      setAge(initialData.age);
      setChristianName(initialData.christianName || '');
      setRegisterDateDay(initialData.registerDateDay);
      setRegisterDateMonth(initialData.registerDateMonth);
      setRegisterDateYear(initialData.registerDateYear);
    }
  }, [initialData]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setIsSaving(true);

    try {
      const url = isEditMode ? `/api/members/${memberId}` : '/api/members';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          gender,
          age: age === '' ? 0 : Number(age),
          christianName,
          registerDateDay: registerDateDay === '' ? null : Number(registerDateDay),
          registerDateMonth,
          registerDateYear: registerDateYear === '' ? null : Number(registerDateYear),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save member');
      }

      const savedMember: Member = await res.json();
      router.push(isEditMode ? `/members/${savedMember.id}` : '/members');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-sm">
      <div className="space-y-0.5">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {isEditMode ? 'Edit Member' : 'New Member'}
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {isEditMode
            ? 'Update the details for this member.'
            : 'Enter personal details to register a new member.'}
        </p>
      </div>

      <div
        className="rounded-lg p-4 space-y-4"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Personal Details
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-semibold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            ሙሉ ስም (Full Name)
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ሙሉ ስም"
            {...fieldBase}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="christianName"
            className="block text-xs font-semibold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            የክርስትና ስም (Christian Name)
          </label>
          <input
            id="christianName"
            value={christianName}
            onChange={(e) => setChristianName(e.target.value)}
            placeholder="ክርስትና ስም"
            {...fieldBase}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="gender"
            className="block text-xs font-semibold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            ፆታ (Gender)
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as genderType)}
            {...fieldBase}
          >
            {genderTypeValues.map((option) => (
              <option key={option} value={option}>
                {option === 'MALE' ? 'ወንድ (Male)' : 'ሴት (Female)'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="age"
            className="block text-xs font-semibold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            ዕድሜ (Age)
          </label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => {
              const raw = e.target.value;
              setAge(raw === '' ? '' : Math.max(0, Math.min(150, Number(raw))));
            }}
            placeholder="ዕድሜ"
            {...fieldBase}
            min={0}
            max={150}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="registerDate"
            className="block text-xs font-semibold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            የምዝገባ ቀን (Registration Date - Ethiopian Calendar)
          </label>

          <div className="grid grid-cols-3 gap-2">
            <input
              id="registerDateDay"
              type="number"
              value={registerDateDay}
              onChange={(e) => {
                const raw = e.target.value;
                setRegisterDateDay(
                  raw === '' ? '' : Math.max(1, Math.min(30, Number(raw)))
                );
              }}
              placeholder="ቀን"
              {...fieldBase}
              min={1}
              max={30}
              required
            />

            <select
              value={registerDateMonth}
              onChange={(e) => setRegisterDateMonth(e.target.value)}
              {...fieldBase}
              required
            >
              <option value="">ወር</option>
              {Object.entries(ethMonthNames).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            <input
              id="registerDateYear"
              type="number"
              value={registerDateYear}
              onChange={(e) => {
                const raw = e.target.value;
                setRegisterDateYear(raw === '' ? '' : Number(raw));
              }}
              placeholder="ዓመት"
              {...fieldBase}
              min={1800}
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded p-3 text-sm font-medium animate-slide-in"
          style={{
            background: 'hsl(0 40% 10%)',
            border: '1px solid hsl(0 40% 22%)',
            color: 'hsl(0 55% 62%)',
          }}
        >
          {error}
        </div>
      )}

      <div
        className="flex items-center justify-end gap-3 pt-2"
        style={{ borderTop: '1px solid hsl(var(--border))' }}
      >
        <Link
          href="/members"
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150"
          style={{
            background: 'transparent',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'hsl(160 70% 32%)',
            color: '#fff',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 38%)';
          }}
          onMouseLeave={(e) => {
            if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 32%)';
          }}
        >
          {isSaving && <Loader2 size={13} className="animate-spin" />}
          {isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Member'}
        </button>
      </div>
    </form>
  );
}