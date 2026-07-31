// /abalat/admin-approvals/page.tsx
import prisma from '@/src/lib/prisma';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import ApprovalsClient from '@/src/components/admin/ApprovalsClient';

export default async function AbalatAdminApprovalsPage() {
  const pendingRegistrations = await prisma.adminRegistration.findMany({
    where: {
      mode: 'ABALAT',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/abalat' },
          { label: 'አድሚን መቀበያ' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የተመዘገቡ አድሚኖች መቀበያ
        </h1>

        <ApprovalsClient initialRegistrations={pendingRegistrations} mode="abalat" />
      </div>
    </div>
  );
}
