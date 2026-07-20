// /members/new/page.tsx
'use client'
import MemberForm from '../components/MemberForm';

export default function NewMember() {    
    return (
        <div className="space-y-4 animate-fade-in">
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