// src/services/document.service.ts
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel, AlignmentType, WidthType } from 'docx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface DocumentOptions {
  title: string;
  subtitle?: string;
  eventDate?: Date;
  totalMembers: number;
  eligibleMembers: Array<{ fullName: string | null }>;
}

export class DocumentService {
  static async generateDOCX(options: DocumentOptions): Promise<Buffer> {
    const { title, subtitle, eventDate, totalMembers, eligibleMembers } = options;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          ...(subtitle ? [new Paragraph({
            text: subtitle,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })] : []),
          ...(eventDate ? [new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${eventDate.toLocaleDateString()}`,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          })] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Members: ${totalMembers}`,
                size: 24,
                bold: true,
              }),
              new TextRun({
                text: ` | Eligible: ${eligibleMembers.length}`,
                size: 24,
                bold: true,
                color: '2e7d32',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Eligible Members List',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: 'No.', bold: true })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Full Name', bold: true })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Status', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
                tableHeader: true,
              }),
              ...eligibleMembers.map((member, index) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: `${index + 1}` })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: member.fullName || 'Unnamed' })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        text: '✓ Eligible',
                      })],
                    }),
                  ],
                })
              ),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleString()}`,
                size: 20,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  static async generatePDF(options: DocumentOptions): Promise<Buffer> {
    const { title, subtitle, eventDate, totalMembers, eligibleMembers } = options;

    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, 20, { align: 'center' });
        
        let yPosition = 30;
        if (subtitle) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'normal');
          doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 10;
        }
        
        if (eventDate) {
          doc.setFontSize(12);
          doc.text(`Date: ${eventDate.toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 10;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Members: ${totalMembers}`, 20, yPosition);
        doc.setTextColor(46, 125, 50);
        doc.text(`Eligible: ${eligibleMembers.length}`, 120, yPosition);
        doc.setTextColor(0);
        
        yPosition += 15;
        
        const tableData = eligibleMembers.map((member, index) => [
          `${index + 1}`,
          member.fullName || 'Unnamed',
          '✓ Eligible'
        ]);

        (doc as any).autoTable({
          startY: yPosition,
          head: [['No.', 'Full Name', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 120 },
            2: { cellWidth: 40 }
          },
          didDrawPage: function(data: any) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
          }
        });

        const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 20, finalY + 20, { align: 'right' });

        const pdfBuffer = doc.output('arraybuffer');
        resolve(Buffer.from(pdfBuffer));
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateDocument(
    options: DocumentOptions,
    format: 'docx' | 'pdf' = 'pdf'
  ): Promise<Buffer> {
    if (format === 'docx') {
      return this.generateDOCX(options);
    } else {
      return this.generatePDF(options);
    }
  }
}