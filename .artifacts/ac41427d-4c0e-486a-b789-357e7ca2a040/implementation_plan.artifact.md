# Course, Academic Year & Amharic Font Enhancements

This plan addresses the requirement to assign instructors per academic year and ensures all downloaded files (CSV, PDF, DOCX) correctly display Amharic characters.

## User Review Required

> [!IMPORTANT]
> - **Instructor Assignments**: Course instructors will now be assigned per Academic Year. This means the same course can have different teachers in different years.
> - **Amharic Font Support**: All downloads will use "Noto Sans Ethiopic" to ensure Ge'ez characters are rendered correctly.
> - **CSV Downloads**: CSV files will now include a UTF-8 BOM (Byte Order Mark) to ensure Excel opens them with correct Amharic character encoding.

## Proposed Changes

### 1. Per-Year Instructor Assignments

#### [MODIFY] [Academic Year API](file:///C:/Dev/fh-abalat/src/app/api/course/academic-years/route.ts)
- Update `POST` handler to initialize `CourseYear` records with the course's default instructor.

#### [NEW] [Faculty Management UI](file:///C:/Dev/fh-abalat/src/app/course/academic-years/%5Bid%5D/faculty/page.tsx)
- Create a dashboard for admins to swap instructors for specific courses within an academic year.

#### [MODIFY] [Display Logic]
- Update Student Dashboard, Course Details, and Grading views to prioritize the instructor assigned to the specific academic year term.

---

### 2. Amharic Font Support for Downloads

#### [MODIFY] [Document Service](file:///C:/Dev/fh-abalat/src/services/document.service.ts)
- Update `generatePDF` to consistently apply the loaded Amharic font to all text blocks.
- Update `generateDOCX` to specify the font family in `TextRun` and `Table` styles.

#### [MODIFY] [Member Export API](file:///C:/Dev/fh-abalat/src/app/api/course/members/export/route.ts)
- Prepend the UTF-8 BOM (`\uFEFF`) to the CSV output.

#### [MODIFY] [Registration PDF (Client)](file:///C:/Dev/fh-abalat/src/app/register/page.tsx)
- Move font files to `public/fonts/` to make them accessible to the client.
- Update `downloadPDF` to fetch and embed the font before generating the document.

## Verification Plan

### Manual Verification
- **Faculty**: Change an instructor for a 2017 course and verify that the 2016 record for the same course remains unchanged.
- **Font (CSV)**: Export members and open in Excel. Verify Amharic names are readable.
- **Font (PDF)**: Download a registration slip. Verify Amharic text is rendered (not boxes).
- **Font (DOCX)**: Download an attendance report. Verify Amharic text is rendered correctly in Word.
