# Year-Specific Instructor Management & Amharic Font Walkthrough

I have implemented a major structural update to handle per-year instructor assignments and ensured that all system downloads fully support Amharic characters.

## Key Accomplishments

### 1. Per-Year Instructor Assignments
- **Decoupled Faculty**: Instructors are no longer globally fixed to a course. They can now be assigned to specific courses for each and every academic year.
- **Auto-Initialization**: When a new academic year is created, the system automatically initializes it with the course's default instructor to save time.
- **Faculty Management Tool**: Added a new **[Manage Year Faculty](file:///C:/Dev/fh-abalat/src/app/course/academic-years/%5Bid%5D/faculty/page.tsx)** page for each academic year. Admins can now bulk-swap instructors for any course term.
- **Smart Prioritization**: Student dashboards, course details, and grading grids now prioritize the instructor assigned for that specific year, falling back to the primary instructor if none is set.

### 2. Comprehensive Amharic Font Support
- **Universal Rendering**: All system-generated downloads (CSV, PDF, DOCX) now use the "Noto Sans Ethiopic" font to ensure Ge'ez characters appear perfectly.
- **Excel Compatibility**: Added a UTF-8 BOM to CSV exports, ensuring that Excel opens them with the correct encoding for Amharic names.
- **Client-Side PDF Support**: The student registration info sheet now embeds the Amharic font dynamically in the browser, ensuring a professional and readable printout.

### 3. Grading & GPA Enhancements
- **GPA Protection**: The student dashboard now calculates averages based only on courses marked as "Grading Complete".
- **In-Progress Indicators**: Added visual "In Progress" badges to student dashboards for courses that haven't been finalized by admins.

## Technical Highlights
- **Schema Evolution**: Added `instructorId` to the `CourseYear` model to support the many-to-many relationship between years and instructors.
- **Font Distribution**: Centralized font assets in `public/fonts/` for reliable client-side fetching during PDF generation.
- **Service Optimization**: Updated the `DocumentService` to handle multi-column reports with consistent font styling.

## How to Test
1. **Manage Faculty**: Go to Academic Years. Click the "Manage Faculty" icon on any year card. Swap an instructor and save.
2. **Student View**: Log in as a student enrolled in that year. Verify the updated instructor appears in the course list.
3. **Exports**: Export the student list to CSV. Open it in Excel and verify Amharic names are readable.
4. **Registration**: Complete a new registration and download the PDF. Verify the Amharic header and text render correctly.
