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
        return <p className="text-center mt-5">Loading member data…</p>;
    }

    if (error) {
        return <p className="text-center mt-5 text-destructive">{error}</p>;
    }

    if (!member) {
        return <p className="text-center mt-5">Member not found.</p>;
    }

    return (
        <div className="space-y-6 animate-fade-in p-4 sm:p-6 md:p-8">
            <MemberForm 
                memberId={`${id}`}
                initialData={member}
            />
        </div>
    );
}