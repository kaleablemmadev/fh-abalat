// /api/events/[eventId]/eligibility/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EligibilityService } from "@/src/services/eligibility.service";
import { DocumentService } from "@/src/services/document.service.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { format = 'pdf' } = await request.json();

    const report = await EligibilityService.checkEventEligibility(eventId);

    const docBuffer = await DocumentService.generateDocument(
      {
        title: report.eventTitle,
        subtitle: 'Eligible Members List',
        eventDate: report.eventDate,
        totalMembers: report.totalMembers,
        eligibleMembers: report.eligibleMembers,
      },
      format as 'pdf' | 'docx'
    );

    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    const filename = `eligible-members-${report.eventTitle.replace(/\s+/g, '-').toLowerCase()}.${format}`;

    return new NextResponse(docBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download report" },
      { status: 500 }
    );
  }
}