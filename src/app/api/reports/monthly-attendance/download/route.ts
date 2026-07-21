// src/app/api/reports/monthly-attendance/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MonthSelection {
  month: string;
  year: number;
}

interface MemberAttendanceData {
  id: string;
  fullName: string | null;
  monthlyAttendances: Record<string, number>;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { months, data, attendanceType }: { months: MonthSelection[]; data: MemberAttendanceData[]; attendanceType?: string } = body;

    if (!months || months.length === 0 || !data) {
      return NextResponse.json(
        { error: 'Invalid report data' },
        { status: 400 }
      );
    }

    // Create PDF document
    const doc = new jsPDF();

    // Load and add Noto Sans Ethiopic font
    const fontPath = join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansEthiopic-VariableFont_wdth,wght.ttf');
    const fontBuffer = readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString('base64');
    
    doc.addFileToVFS('NotoSansEthiopic.ttf', fontBase64);
    doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
    doc.setFont('NotoSansEthiopic');
    
    // Add title
    doc.setFontSize(16);
    doc.text('Monthly Attendance Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Attendance Type: ${attendanceType === 'ALL' ? 'All Types' : attendanceType}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);

    // Prepare table data
    const headers = ['No.', 'Name', ...months.map(m => `${m.month} ${m.year}`), 'Total'];
    
    const rows = data.map((member, index) => {
      const row = [
        index + 1,
        member.fullName || 'Unknown',
        ...months.map(month => member.monthlyAttendances[`${month.month} ${month.year}`] || 0),
        member.total,
      ];
      return row;
    });

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'NotoSansEthiopic',
      },
      headStyles: {
        fillColor: [22, 78, 99], // Dark teal color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        font: 'NotoSansEthiopic',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // No.
        1: { cellWidth: 50 }, // Name
      },
    });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
