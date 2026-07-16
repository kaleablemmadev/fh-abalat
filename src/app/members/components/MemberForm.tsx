'use client'

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-2xl">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {isEditMode ? 'Edit Member' : 'New Member'}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {isEditMode ? 'Update the details for this member.' : 'Enter the personal details to register a new member.'}
                </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Personal Details</h3>
                
                <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        ሙሉ ስም (Full Name)
                    </label>
                    <input 
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="ሙሉ ስም"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="gender" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            ፆታ (Gender)
                        </label>
                        <select 
                            value={gender} 
                            id="gender" 
                            onChange={(e) => setGender(e.target.value as genderType)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none"
                        >
                            {genderOptions.map((option) => (
                                <option key={option} value={option}>{option === 'MALE' ? 'ወንድ (Male)' : 'ሴት (Female)'}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="age" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm font-medium animate-slide-in">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                <Link 
                    href="/members"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                    {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Member'}
                </button>
            </div>
        </form>
    )
}