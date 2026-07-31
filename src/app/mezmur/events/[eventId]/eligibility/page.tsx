import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EligibilityReportClient from "@/src/app/abalat/events/[eventId]/eligibility/components/EligibilityReportClient";
import { EligibilityService } from "@/src/services/eligibility.service";

export default async function MezmurEventEligibilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ ruleId?: string }>;
}) {
  const { eventId } = await params;
  const { ruleId } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) notFound();

  const allRules = await prisma.eligibilityRule.findMany({
    include: { criteria: true },
    orderBy: { name: "asc" },
  });

  let selectedRuleId = ruleId || event.eligibilityRuleId;
  if (selectedRuleId && !allRules.some(r => r.id === selectedRuleId)) {
    selectedRuleId = null;
  }
  if (!selectedRuleId && allRules.length > 0) {
    selectedRuleId = allRules[0].id;
  }

  const selectedRule = allRules.find(r => r.id === selectedRuleId) || null;

  let report;
  if (selectedRule) {
    report = await EligibilityService.checkEventEligibilityWithRule(eventId, selectedRule);
  } else {
    report = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      totalMembers: 0,
      eligibleMembers: [],
      ineligibleMembers: [],
      eligibilityRule: {
        name: 'No Rule Selected',
        description: 'Please select an eligibility rule to view the report',
        criteria: [],
      },
    };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EligibilityReportClient
        eventId={eventId}
        initialReport={report as any}
        eventTitle={event.title}
        eventDate={event.date}
        allRules={allRules as any}
        selectedRuleId={selectedRuleId}
      />
    </div>
  );
}
