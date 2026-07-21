# Implementation Plan - Add DOCX Download for Monthly Attendance Report

The goal is to add an option to download the Monthly Attendance Report as a `.docx` file, in addition to the existing PDF option.

## Proposed Changes

### [Document Service]

#### [MODIFY] [document.service.ts](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/services/document.service.ts)

- Add a new interface `MonthlyAttendanceOptions` to represent the data needed for the monthly report.
- Add a new static method `generateMonthlyAttendanceDOCX(options: MonthlyAttendanceOptions): Promise<Buffer>` to generate the DOCX file with a table structure matching the report.

### [API Routes]

#### [MODIFY] [monthly-attendance download route](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/api/reports/monthly-attendance/download/route.ts)

- Update the POST handler to accept a `format` parameter (defaulting to `pdf`).
- If `format` is `docx`, call `DocumentService.generateMonthlyAttendanceDOCX`.
- Set the appropriate `Content-Type` and file extension for the response.

### [Monthly Attendance Page]

#### [MODIFY] [monthly-attendance page](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/reports/monthly-attendance/page.tsx)

- Refactor `downloadPDF` to a generic `downloadReport(format: 'pdf' | 'docx')` function.
- Add a "Download DOCX" button next to the "Download PDF" button.

## Verification Plan

### Manual Verification
- Generate a monthly attendance report.
- Click "Download PDF" and verify the PDF is correct.
- Click "Download DOCX" and verify the DOCX file opens correctly in Word/Google Docs and contains the expected data in a table format.
