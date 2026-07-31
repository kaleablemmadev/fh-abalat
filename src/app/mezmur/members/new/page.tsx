import prisma from "@/src/lib/prisma";
import MezmurEnrollmentForm from "./components/MezmurEnrollmentForm";

export default async function NewMezmurEnrollmentPage() {
  const students = await prisma.user.findMany({
    where: {
      type: "MEMBER",
      isActive: true
    },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true }
  });

  return (
    <div className="py-8">
      <MezmurEnrollmentForm students={students} />
    </div>
  );
}
