# Walkthrough - Configurable Class Duration for Keremt

I have implemented the ability for administrators to configure the daily teaching duration for the **KEREMT** class per academic year. This ensures that required teaching hours and performance reports are accurate based on varying schedules.

## Key Changes

### 1. Database Schema Evolution
Updated the `CourseClass` model in [schema.prisma](file:///C:/Dev/fh-abalat/prisma/schema.prisma) to include a `dailyDurationHours` field.
- **Default**: `2.0` hours.
- **Applied**: Pushed the schema changes to the live database using Prisma.

### 2. Intelligent Teaching Hour Calculations
Refactored the [TeachingHoursService](file:///C:/Dev/fh-abalat/src/services/teaching-hours.service.ts) to use the dynamic duration from the database.
- **Calculation**: For Keremt, it now calculates `dailyDurationHours * 6 days`.
- **Consistency**: All reports (Instructor Teaching Record, Dashboard) now reflect these custom durations automatically.

### 3. Academic Year Management UI
Updated the [AcademicYearList](file:///C:/Dev/fh-abalat/src/app/course/academic-years/components/AcademicYearList.tsx) component to allow session duration selection.
- **Selection Dropdown**: When the **Keremt** class is included in a year, a new dropdown appears.
- **Strict Options**: Administrators can select between:
    - `2.0 Hours (Standard)`
    - `2.5 Hours (1h 15m/course)`
    - `3.0 Hours (1h 30m/course)`
- **Visual Display**: The selected duration is now displayed next to the "Keremt" label in the academic year list for quick reference.

### 4. API Enhancements
Updated both **POST** and **PUT** routes for academic years:
- **POST**: Correctly assigns the selected duration when initializing new classes.
- **PUT**: Allows updating the duration for an existing Keremt class within an academic year.

## How to use
1. Go to the **Academic Years** page.
2. When creating a **New Year** or **Editing** an existing one, look for the "Level 1" group.
3. If "Keremt" is checked, use the **Keremt Session Duration** dropdown to set the hours.
4. Click **Save**—all calculations for that year will update immediately.

> [!TIP]
> Changing the Keremt duration will immediately update the "Required Hours" in the **Instructor Teaching Reports**, helping you see if teachers are ahead or behind schedule based on the new timing.
