// src/services/document.service.ts
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel, AlignmentType, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';

interface DocumentOptions {
  title: string;
  subtitle?: string;
  eventDate?: Date;
  totalMembers: number;
  eligibleMembers: Array<{ fullName: string | null }>;
  eventDescription?: string;
  eventLocation?: string;
}

interface MonthlyAttendanceOptions {
  months: { month: string; year: number }[];
  data: {
    fullName: string | null;
    monthlyAttendances: Record<string, number>;
    total: number;
  }[];
  attendanceType?: string;
}

export class DocumentService {
  static async generateMonthlyAttendanceDOCX(options: MonthlyAttendanceOptions): Promise<Buffer> {
    const { months, data, attendanceType } = options;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 500,
              bottom: 500,
              left: 500,
              right: 500,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'Monthly Attendance Report',
                size: 32,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
          }),

          // Details
          new Paragraph({
            children: [
              new TextRun({
                text: `Attendance Type: ${attendanceType === 'ALL' ? 'All Types' : attendanceType}`,
                size: 18,
              }),
            ],
            spacing: { before: 0, after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                size: 18,
              }),
            ],
            spacing: { before: 0, after: 150 },
          }),

          // Table
          new Table({
            rows: [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'No.', bold: true, size: 18 })] })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true, size: 18 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  ...months.map(m => new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: `${m.month} ${m.year}`, bold: true, size: 18 })],
                      alignment: AlignmentType.CENTER,
                    })],
                    width: { size: 60 / months.length, type: WidthType.PERCENTAGE },
                  })),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Data Rows
              ...data.map((member, index) => new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${index + 1}`, size: 16 })], alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: member.fullName || 'Unknown', size: 16 })] })],
                  }),
                  ...months.map(month => {
                    const monthKey = `${month.month} ${month.year}`;
                    const count = member.monthlyAttendances[monthKey] || 0;
                    return new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${count}`, size: 16 })], alignment: AlignmentType.CENTER })],
                    });
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${member.total}`, size: 16, bold: true })], alignment: AlignmentType.CENTER })],
                  }),
                ],
              })),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  static async generateDOCX(options: DocumentOptions): Promise<Buffer> {
    const { title, subtitle, eventDate, totalMembers, eligibleMembers, eventDescription, eventLocation } = options;

    // Split members into two columns
    const membersPerColumn = Math.ceil(eligibleMembers.length / 2);
    const column1 = eligibleMembers.slice(0, membersPerColumn);
    const column2 = eligibleMembers.slice(membersPerColumn);

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 500,
              bottom: 500,
              left: 500,
              right: 500,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                size: 32,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
          }),
          
          // Event Details
          new Paragraph({
            children: [
              new TextRun({
                text: `Event: ${title}`,
                size: 20,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 50 },
          }),
          
          ...(subtitle ? [new Paragraph({
            children: [
              new TextRun({
                text: subtitle,
                size: 18,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 50 },
          })] : []),
          
          ...(eventDescription ? [new Paragraph({
            children: [
              new TextRun({
                text: `Description: ${eventDescription}`,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 50 },
          })] : []),
          
          ...(eventLocation ? [new Paragraph({
            children: [
              new TextRun({
                text: `Location: ${eventLocation}`,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 50 },
          })] : []),
          
          ...(eventDate ? [new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${eventDate.toLocaleDateString()} | Time: ${eventDate.toLocaleTimeString()}`,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
          })] : []),
          
          // Summary
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Members: ${totalMembers}`,
                size: 18,
                bold: true,
              }),
              new TextRun({
                text: ` | Eligible: ${eligibleMembers.length}`,
                size: 18,
                bold: true,
                color: '2e7d32',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 150 },
          }),
          
          // Two-column table
          new Table({
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: 'ተ.ቁ', bold: true, size: 18 })]
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: 'ሙሉ ስም', bold: true, size: 18 })]
                    })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: 'ተ.ቁ', bold: true, size: 18 })]
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: 'ሙሉ ስም', bold: true, size: 18 })]
                    })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                  }),
                ],
              }),
              // Data rows - two columns side by side
              ...Array.from({ length: Math.max(column1.length, column2.length) }, (_, index) => {
                const member1 = column1[index];
                const member2 = column2[index];
                
                return new TableRow({
                  children: [
                    // Column 1 - Number
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({
                          text: member1 ? `${index + 1}` : '',
                          size: 16,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                      },
                    }),
                    // Column 1 - Name
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({
                          text: member1 ? member1.fullName || 'Unnamed' : '',
                          size: 16,
                        })],
                      })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                      },
                    }),
                    // Column 2 - Number
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({
                          text: member2 ? `${index + 1 + membersPerColumn}` : '',
                          size: 16,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                      },
                    }),
                    // Column 2 - Name
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({
                          text: member2 ? member2.fullName || 'Unnamed' : '',
                          size: 16,
                        })],
                      })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                      },
                    }),
                  ],
                });
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          
          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleString()}`,
                size: 14,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 100, after: 0 },
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  static async generatePDF(options: DocumentOptions): Promise<Buffer> {
    const { title, subtitle, eventDate, totalMembers, eligibleMembers, eventDescription, eventLocation } = options;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // ---- Load Amharic Font ----
        let fontLoaded = false;
        try {
          const fontPaths = [
            path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansEthiopic-VariableFont_wdth,wght.ttf'),
            path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansEthiopic-Regular.ttf'),
          ];

          let fontPath = null;
          for (const p of fontPaths) {
            if (fs.existsSync(p)) {
              fontPath = p;
              break;
            }
          }

          if (fontPath) {
            const fontData = fs.readFileSync(fontPath);
            const base64Font = fontData.toString('base64');
            const fontName = path.basename(fontPath, '.ttf');
            // @ts-ignore
            doc.addFileToVFS(fontName + '.ttf', base64Font);
            // @ts-ignore
            doc.addFont(fontName + '.ttf', 'NotoSansEthiopic', 'normal');
            fontLoaded = true;
            console.log('✅ Amharic font loaded from:', fontPath);
          }
        } catch (error) {
          console.warn('⚠️ Could not load Amharic font:', error);
        }

        let yPosition = 10;

        // ---- Title ----
        doc.setFontSize(16);
        doc.setFont(fontLoaded ? 'NotoSansEthiopic' : 'helvetica', 'bold');
        doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;

        // ---- Event Details ----
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Event: ${title}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;

        if (subtitle) {
          doc.setFontSize(10);
          doc.setFont(fontLoaded ? 'NotoSansEthiopic' : 'helvetica', 'normal');
          doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 6;
        }

        if (eventDescription) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Description: ${eventDescription}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 5;
        }

        if (eventLocation) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Location: ${eventLocation}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 5;
        }

        if (eventDate) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Date: ${eventDate.toLocaleDateString()} | Time: ${eventDate.toLocaleTimeString()}`,
            pageWidth / 2,
            yPosition,
            { align: 'center' }
          );
          yPosition += 6;
        }

        // ---- Summary ----
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Members: ${totalMembers}`, 15, yPosition);
        doc.setTextColor(46, 125, 50);
        doc.text(`Eligible: ${eligibleMembers.length}`, 85, yPosition);
        doc.setTextColor(0);
        yPosition += 5;

        // ---- Split members into two columns ----
        const membersPerColumn = Math.ceil(eligibleMembers.length / 2);
        const column1 = eligibleMembers.slice(0, membersPerColumn);
        const column2 = eligibleMembers.slice(membersPerColumn);

        // ---- Two-Column Table ----
        const tableData = [];
        const maxRows = Math.max(column1.length, column2.length);
        
        for (let i = 0; i < maxRows; i++) {
          const member1 = column1[i];
          const member2 = column2[i];
          tableData.push([
            member1 ? `${i + 1}` : '',
            member1 ? member1.fullName || 'Unnamed' : '',
            member2 ? `${i + 1 + membersPerColumn}` : '',
            member2 ? member2.fullName || 'Unnamed' : '',
          ]);
        }

        autoTable(doc, {
          startY: yPosition + 2,
          head: [['ተ.ቁ', 'ሙሉ ስም', 'ተ.ቁ', 'ሙሉ ስም']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            font: 'helvetica',
            halign: 'center',
            fontSize: 8,
            cellPadding: 1.5,
          },
          bodyStyles: {
            fontSize: 8,
            font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica',
            halign: 'left',
            cellPadding: 1.5,
          },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center' },
            1: { cellWidth: 70, halign: 'left' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 70, halign: 'left' },
          },
          margin: { left: 10, right: 10 },
          didDrawPage: function() {
            const pageCount = (doc as any).internal.getNumberOfPages();
            const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
          }
        });

        // ---- Footer ----
        const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 30;
        doc.setFontSize(7);
        doc.setTextColor(102, 102, 102);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, finalY + 8, { align: 'right' });

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