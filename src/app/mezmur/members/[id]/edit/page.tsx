import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import SingerEditForm from "./components/SingerEditForm";

export default async function MezmurSingerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      mezmurEnrollments: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!member) notFound();

  const initialData = {
    fullName: member.fullName || "",
    phoneNumber: member.phoneNumber || "",
    address: member.address || "",
    age: member.age || 0,
    enrollment: member.mezmurEnrollments[0] ? {
        id: member.mezmurEnrollments[0].id,
        groupType: member.mezmurEnrollments[0].groupType,
        status: member.mezmurEnrollments[0].status,
        enrolledDate: member.mezmurEnrollments[0].enrolledDate
    } : undefined
  };

  return (
    <div>
      <SingerEditForm memberId={id} initialData={initialData as any} />
    </div>
  );
}
