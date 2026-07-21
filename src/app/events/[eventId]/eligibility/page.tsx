// src/app/events/[eventId]/eligibility/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EligibilityReportClient from "./components/EligibilityReportClient";

export default async function EligibilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ ruleId?: string }>;
}) {
  const { eventId } = await params;
  const { ruleId } = await searchParams;

  // Fetch the event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    notFound();
  }

  // Fetch all eligibility rules
  const allRules = await prisma.eligibilityRule.findMany({
    include: {
      criteria: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Determine which rule to use:
  // 1. If ruleId is provided in URL, use that
  // 2. Otherwise use the event's current rule
  // 3. Otherwise use the first rule or null
  let selectedRuleId = ruleId || event.eligibilityRuleId;
  
  // If selectedRuleId is provided but doesn't exist, use null
  if (selectedRuleId) {
    const ruleExists = allRules.some(r => r.id === selectedRuleId);
    if (!ruleExists) {
      selectedRuleId = null;
    }
  }

  // If no rule selected and there are rules available, use the first one
  if (!selectedRuleId && allRules.length > 0) {
    selectedRuleId = allRules[0].id;
  }

  // Get the selected rule
  const selectedRule = allRules.find(r => r.id === selectedRuleId) || null;

  // Generate report based on selected rule
  const { EligibilityService } = await import("@/src/services/eligibility.service");
  
  let report;
  if (selectedRule) {
    // Create a temporary event with the selected rule for eligibility check
    const tempEvent = {
      ...event,
      eligibilityRule: selectedRule,
    };
    report = await EligibilityService.checkEventEligibilityWithRule(eventId, selectedRule);
  } else {
    // No rule selected - empty report
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
        initialReport={report}
        eventTitle={event.title}
        eventDate={event.date}
        allRules={allRules}
        selectedRuleId={selectedRuleId}
      />
    </div>
  );
}