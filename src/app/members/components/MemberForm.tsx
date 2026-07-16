'use client'

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
    genderTypeValues,
    type genderType,
    type memberType
} from '../constants/membersEnum';

interface Member {
  id: string;
  fullName: string;
  gender: genderType;
  age: number;
  memberType: memberType;
}

interface MemberDraft {
  fullName: string;
  gender: genderType;
  age: number;
}

interface MemberFormProps {
    initialData?: MemberDraft;
    memberId?: string;
};

/** Shared input/select className + inline style base */
const fieldBase = {
  className: "h-9 w-full rounded border px-3 text-sm transition-all duration-150 appearance-none",
  style: {
    background: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  },
};

export default function MemberForm({ initialData, memberId }: MemberFormProps ) {
    const router = useRouter();
    const isEditMode = Boolean(memberId);

    // Member Form Contents
    const [fullName, setFullName] = useState(initialData?.fullName ?? '');
    const [gender, setGender] = useState<genderType>(initialData?.gender ?? genderTypeValues[0]);
    const [age, setAge] = useState<number | ''>(initialData?.age ?? '');
    const genderOptions = genderTypeValues;
    
    // Error Handling
    const [error, setError] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFullName(initialData.fullName);
            setGender(initialData.gender);
            setAge(initialData.age);
        }
    }, [initialData]);
    
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError('');
        setIsSaving(true);

        try {
            const payloadAge = age === '' ? 0 : age;
            const url = isEditMode ? `/api/members/${memberId}` : '/api/members';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, gender, age: payloadAge }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to save member');
            }

            const savedMember = await res.json();
            router.push(isEditMode ? `/members/${savedMember.id}` : '/members');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save member');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-sm">
            {/* ── Form title ───────────────────────────────────────────── */}
            <div className="space-y-0.5">
                <h2 className="text-lg font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    {isEditMode ? 'Edit Member' : 'New Member'}
                </h2>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {isEditMode
                        ? 'Update the details for this member.'
                        : 'Enter personal details to register a new member.'}
                </p>
            </div>

            {/* ── Personal Details section ─────────────────────────────── */}
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

                {/* Full name */}
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

                {/* Gender — single column */}
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
                        {genderOptions.map((option) => (
                            <option key={option} value={option}>
                                {option === 'MALE' ? 'ወንድ (Male)' : 'ሴት (Female)'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Age — single column */}
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
                            const value = Number(e.target.value)
                            setAge(isNaN(value) || value < 0 ? 0 :
                            value > 150 ? 150 :
                            value)
                        }}
                        placeholder="ዕድሜ"
                        {...fieldBase}
                        required
                    />
                </div>
            </div>

            {/* Error message */}
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

            {/* ── Actions ─────────────────────────────────────────────── */}
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
                    onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 38%)'; }}
                    onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 32%)'; }}
                >
                    {isSaving && <Loader2 size={13} className="animate-spin" />}
                    {isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Member'}
                </button>
            </div>
        </form>
    )
}