# Task: PDF Reporting System Implementation

- [x] Implement `ReportService` for PDF generation (`src/services/report.service.ts`)
    - [x] Add Global Ranking logic
    - [x] Implement `generateMarksByCoursePDF`
    - [x] Implement `generateMarksByStudentPDF`
    - [x] Implement `generateAttendanceReportPDF`
    - [x] Implement `generateInstructorReportPDF`
- [x] Create API Endpoints (`src/app/api/course/reports/route.ts`)
    - [x] Handle all report types via query parameters
- [x] Implement UI for Reports Center (`src/app/course/reports/page.tsx`)
    - [x] Add categorization cards
    - [x] Implement multi-select for students
    - [x] Add loading and success states
- [x] Update Navigation (`src/app/course/layout.tsx`)
- [/] Verification
    - [ ] Test Amharic character rendering
    - [ ] Verify Global Ranking accuracy
    - [ ] Verify Instructor hours comparison logic
