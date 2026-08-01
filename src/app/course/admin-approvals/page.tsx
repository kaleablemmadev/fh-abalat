// /course/admin-approvals/page.tsx
import prisma from '@/src/lib/prisma';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import ApprovalsClient from '@/src/components/admin/ApprovalsClient';

export default async function CourseAdminApprovalsPage() {
  const pendingRegistrations = await prisma.adminRegistration.findMany({
    where: {
      mode: 'COURSE',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/course' },
          { label: 'አድሚን መቀበያ' },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Course Admin Registration Approvals
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Review and manage requests for administrative access to the Course module.
          </p>
        </div>

        <ApprovalsClient initialRegistrations={pendingRegistrations} mode="course" />
      </div>
    </div>
  );
}
