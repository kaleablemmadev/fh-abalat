'use client'
import { useState, useEffect } from "react";
import MemberForm from "../../components/MemberForm";
import { useParams } from "next/navigation";
import { type genderType } from "../../constants/membersEnum";


interface MemberDraft {
  fullName: string;
  gender: genderType;
  age: number;
}

export default function UpdateMember() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [member, setMember] = useState<MemberDraft | null>(null);

    const params = useParams();
    const id = params.id;

    useEffect(() => {
        async function fetchMember() {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/members/${id}`);

                if (!res.ok) {
                    throw new Error("Failed to load, try again");
                }

                const data: MemberDraft = await res.json();
                setMember(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load member info");
                setMember(null);
            } finally {
                setIsLoading(false);
            }
        }

        if (id) {
            fetchMember();
        } else {
            setIsLoading(false);
            setError("Member ID is missing.");
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div>
                    <div className="skeleton h-5 w-32 rounded mb-1.5" style={{ background: 'hsl(var(--border))' }} />
                    <div className="skeleton h-3 w-48 rounded" style={{ background: 'hsl(var(--border))' }} />
                </div>
                <div
                    className="rounded-lg p-4 space-y-4"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="skeleton h-2.5 w-24 rounded" style={{ background: 'hsl(var(--border))' }} />
                            <div className="skeleton h-9 w-full rounded" style={{ background: 'hsl(var(--border))' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="rounded p-4 text-sm font-medium animate-fade-in"
                style={{
                    background: 'hsl(0 40% 10%)',
                    border: '1px solid hsl(0 40% 22%)',
                    color: 'hsl(0 55% 62%)',
                }}
            >
                {error}
            </div>
        );
    }

    if (!member) {
        return (
            <div
                className="rounded p-6 text-center text-sm animate-fade-in"
                style={{
                    border: '1px dashed hsl(var(--border))',
                    color: 'hsl(var(--muted-foreground))',
                }}
            >
                Member not found.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    Edit Member
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Update the details for this member record.
                </p>
            </div>
            <MemberForm 
                memberId={`${id}`}
                initialData={member}
            />
        </div>
    );
}