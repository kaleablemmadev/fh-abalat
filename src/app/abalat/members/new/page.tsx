// /abalat/members/new/page.tsx
'use client'
import MemberForm from '../components/MemberForm';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

import { useSearchParams } from 'next/navigation';

export default function NewMember() {    
    const searchParams = useSearchParams();
    const recommendationId = searchParams.get('recommendationId');
    const studentId = searchParams.get('studentId');

    return (
        <div className="space-y-4 animate-fade-in">
            <Breadcrumb
                items={[
                    { label: 'Members', href: '/abalat/members' },
                    { label: recommendationId ? 'Complete Registration' : 'Add Member' },
                ]}
            />
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    {recommendationId ? 'Complete Abalat Registration' : 'Add Member'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {recommendationId ? 'Add regular membership details for this course student.' : 'Register a new member in the directory.'}
                </p>
            </div>
            <MemberForm recommendationId={recommendationId} studentId={studentId} />
        </div>
    )
}