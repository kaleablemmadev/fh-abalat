// /mezmur/admin-approvals/page.tsx
import prisma from '@/src/lib/prisma';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import ApprovalsClient from '@/src/components/admin/ApprovalsClient';

export default async function MezmurAdminApprovalsPage() {
  const pendingRegistrations = await prisma.adminRegistration.findMany({
    where: {
      mode: 'MEZMUR',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/mezmur' },
          { label: 'Admin Approvals' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የመዝሙር አድሚን ምዝገባ መቀበያ
        </h1>

        <ApprovalsClient initialRegistrations={pendingRegistrations} mode="mezmur" />
      </div>
    </div>
  );
}
