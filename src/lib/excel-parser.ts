import * as XLSX from 'xlsx';

// Amharic class name mapping to English class types
const amharicClassMapping: Record<string, string> = {
  'ቀዳማይ': 'KEDAMAY',
  'ካልዓይ': 'KALEAY',
  'ሣልሳይ': 'SALSAY',
  'ራብዓይ': 'RABEAY',
  'ክረምት ቀዳማይ': 'KEREMT',
  // English variations
  'KEDAMAY': 'KEDAMAY',
  'KALEAY': 'KALEAY',
  'SALSAY': 'SALSAY',
  'RABEAY': 'RABEAY',
  'KEREMT': 'KEREMT',
};

export interface ParsedStudent {
  fullName: string;
  grandfatherName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  phoneNumber: string;
  classType: string;
  errors?: string[];
}

/**
 * Format phone number by adding '0' prefix if it starts with '9'
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digit characters
  if (cleaned.startsWith('9')) {
    return '0' + cleaned;
  }
  return cleaned;
}

/**
 * Map Amharic class name to English class type
 */
export function mapClassName(className: string): string {
  const normalized = className.trim().toUpperCase();
  // Try exact match first
  if (amharicClassMapping[normalized]) {
    return amharicClassMapping[normalized];
  }
  // Try case-insensitive match
  const key = Object.keys(amharicClassMapping).find(
    k => k.toLowerCase() === normalized.toLowerCase()
  );
  return key ? amharicClassMapping[key] : className;
}

/**
 * Parse Excel file and extract student data
 */
export async function parseExcelFile(file: File): Promise<ParsedStudent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        // Skip header row and parse data
        const students: ParsedStudent[] = [];
        
        // Expected columns: No., Full Name, Grandfather Name, Gender, Age, Phone No., Class
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 7) continue;
          
          const errors: string[] = [];
          
          // Extract data (assuming column order: No., Full Name, Grandfather Name, Gender, Age, Phone No., Class)
          const fullName = String(row[1] || '').trim();
          const grandfatherName = String(row[2] || '').trim();
          const gender = String(row[3] || '').trim();
          const age = row[4];
          const phone = String(row[5] || '').trim();
          const className = String(row[6] || '').trim();
          
          // Validate required fields
          if (!fullName) errors.push('Full name is required');
          if (!age) errors.push('Age is required');
          if (!className) errors.push('Class is required');
          
          // Normalize gender
          let normalizedGender: 'MALE' | 'FEMALE' = 'MALE';
          const genderLower = gender.toLowerCase();
          if (genderLower.includes('female') || genderLower.includes('ሴት') || genderLower === 'f') {
            normalizedGender = 'FEMALE';
          } else if (genderLower.includes('male') || genderLower.includes('ወንድ') || genderLower === 'm') {
            normalizedGender = 'MALE';
          } else {
            errors.push('Invalid gender value');
          }
          
          // Map class name
          const classType = mapClassName(className);
          if (!classType || !Object.values(amharicClassMapping).includes(classType)) {
            errors.push(`Invalid class: ${className}`);
          }
          
          // Format phone number
          const formattedPhone = formatPhoneNumber(phone);
          
          students.push({
            fullName,
            grandfatherName,
            gender: normalizedGender,
            age: parseInt(String(age)) || 0,
            phoneNumber: formattedPhone,
            classType,
            errors: errors.length > 0 ? errors : undefined,
          });
        }
        
        resolve(students);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Generate Excel template with sample data
 */
export function generateExcelTemplate(): Blob {
  const templateData = [
    ['No.', 'Full Name', 'Grandfather Name', 'Gender', 'Age', 'Phone No.', 'Class'],
    [1, 'Abraham Tesfaye', 'Tesfaye', 'Male', 20, '0911123456', 'ቀዳማይ'],
    [2, 'Sara Mengistu', 'Mengistu', 'Female', 21, '0911223456', 'ካልዓይ'],
    [3, 'Yosef Kassa', 'Kassa', 'Male', 22, '0911323456', 'ሣልሳይ'],
    [4, 'Hana Bekele', 'Bekele', 'Female', 20, '0911423456', 'ራብዓይ'],
    [5, 'Dawit Abera', 'Abera', 'Male', 23, '0911523456', 'ክረምት ቀዳማይ'],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download Excel template
 */
export function downloadExcelTemplate() {
  const blob = generateExcelTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_import_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
