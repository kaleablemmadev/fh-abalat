import fs from 'fs';
import path from 'path';

interface StudentData {
  fullName: string;
  grandfatherName?: string;
  studentId: string;
}

interface StudentPDFOptions {
  academicYear: string;
  courseClass: string;
  students: StudentData[];
}

export class StudentPDFService {
  static async generateStudentIDPDF(options: StudentPDFOptions): Promise<Buffer> {
    const { academicYear, courseClass, students } = options;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansEthiopic-VariableFont_wdth,wght.ttf');
        let fontLoaded = false;

        // Load Amharic font
        if (fs.existsSync(fontPath)) {
          const fontData = fs.readFileSync(fontPath);
          doc.addFileToVFS('NotoSansEthiopic.ttf', fontData.toString('base64'));
          doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
          doc.setFont('NotoSansEthiopic');
          fontLoaded = true;
        } else {
          console.warn('Amharic font not found at:', fontPath);
        }

        // Title
        doc.setFontSize(20);
        doc.setFont(fontLoaded ? 'NotoSansEthiopic' : 'helvetica');
        doc.text('የተማሪዎች መለያ መለያዎች', 105, 20, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.text(`አመት: ${academicYear}`, 105, 30, { align: 'center' });
        doc.text(`ክፍል: ${courseClass}`, 105, 37, { align: 'center' });
        doc.text(`የወጣበት ቀን: ${new Date().toLocaleDateString('am-ET')}`, 105, 44, { align: 'center' });

        // Table headers
        const head = [
          ['ተ.ቁ.', 'ሙሉ ስም', 'የአባት ስም', 'የተማሪ መለያ']
        ];

        // Table body
        const body = students.map((student, index) => [
          index + 1,
          student.fullName,
          student.grandfatherName || '-',
          student.studentId
        ]);

        // Generate table
        autoTable(doc, {
          startY: 55,
          head,
          body,
          styles: { 
            font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica', 
            fontSize: 10,
            cellPadding: 3
          },
          headStyles: { 
            fillColor: [21, 101, 192], 
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // No.
            1: { cellWidth: 50 }, // Full Name
            2: { cellWidth: 40 }, // Grandfather Name
            3: { cellWidth: 40, halign: 'center' }, // Student ID
          },
          theme: 'grid',
          margin: { top: 55, left: 15, right: 15 }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont(fontLoaded ? 'NotoSansEthiopic' : 'helvetica');
          doc.text(
            `ገጽ ${i} ከ ${pageCount} | ጠቅላለል ወጪ: ${new Date().toLocaleDateString('am-ET')}`,
            105,
            290,
            { align: 'center' }
          );
        }

        resolve(Buffer.from(doc.output('arraybuffer')));
      } catch (err) {
        reject(err);
      }
    });
  }

  static downloadStudentIDPDF(options: StudentPDFOptions, filename?: string) {
    this.generateStudentIDPDF(options)
      .then((buffer) => {
        const blob = new Blob([buffer as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `student_ids_${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Failed to generate PDF:', err);
        alert('Failed to generate PDF');
      });
  }
}
