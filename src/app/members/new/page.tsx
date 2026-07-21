// /members/new/page.tsx
'use client'
import MemberForm from '../components/MemberForm';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function NewMember() {    
    return (
        <div className="space-y-4 animate-fade-in">
            <Breadcrumb
                items={[
                    { label: 'Members', href: '/members' },
                    { label: 'Add Member' },
                ]}
            />
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    Add Member
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Register a new member in the directory.
                </p>
            </div>
            <MemberForm />
        </div>
    )
}