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
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/course' },
          { label: 'Admin Approvals' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Course Admin Registration Approvals
        </h1>

        <ApprovalsClient initialRegistrations={pendingRegistrations} mode="course" />
      </div>
    </div>
  );
}
