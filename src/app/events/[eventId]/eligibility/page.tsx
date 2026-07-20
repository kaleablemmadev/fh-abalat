// /events/[eventId]/eligibility/page.tsx
import prisma from "@/src/lib/prisma";
import EligibilityReportClient from "./components/EligibilityReportClient.ts";
import { notFound } from "next/navigation";

export default async function EligibilityPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eligibilityRule: {
        include: {
          rules: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const { EligibilityService } = await import("@/src/services/eligibility.service");
  const report = await EligibilityService.checkEventEligibility(eventId);

  return (
    <div className="space-y-6 animate-fade-in">
      <EligibilityReportClient
        eventId={eventId}
        initialReport={report}
        eventTitle={event.title}
        eventDate={event.date}
      />
    </div>
  );
}