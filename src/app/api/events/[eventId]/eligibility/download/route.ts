// src/app/api/events/[eventId]/eligibility/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EligibilityService } from "@/src/services/eligibility.service";
import { DocumentService } from "@/src/services/document.service";
import prisma from "@/src/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { format = 'pdf' } = await request.json();

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const report = await EligibilityService.checkEventEligibility(eventId);

    if (report.eligibleMembers.length === 0) {
      return NextResponse.json(
        { error: "No eligible members found to export" },
        { status: 400 }
      );
    }

    const docBuffer = await DocumentService.generateDocument(
      {
        title: event.title,
        subtitle: 'Eligible Members List',
        eventDate: event.date,
        totalMembers: report.totalMembers,
        eligibleMembers: report.eligibleMembers,
        eventDescription: event.description || undefined,
        eventLocation: event.location || undefined,
      },
      format as 'pdf' | 'docx'
    );

    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    const sanitizedTitle = event.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const filename = sanitizedTitle ? `eligible-members-${sanitizedTitle}.${format}` : `eligible-members-${eventId}.${format}`;

    return new NextResponse(docBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download report" },
      { status: 500 }
    );
  }
}