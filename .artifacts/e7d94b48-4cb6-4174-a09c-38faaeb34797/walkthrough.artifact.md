# Walkthrough - Membership Transition & Dual Role ID System

I have implemented the dual-identity system and membership transition workflow, allowing students to seamlessly progress from Course Students to Regular Members with distinct identifiers for each role.

## Key Deliverables

### 1. New Two-Part ID System
Updated all identification codes to the new **4+2 strict format**:
- **Abalat**: `FH-XXXX-YY` (e.g., `FH-0123-18`)
- **Course**: `FHC-XXXX-YY` (e.g., `FHC-5678-18`)
- The `YY` represents the **Ethiopian year of registration**, automatically derived from the student's creation date.

### 2. Redesigned Member Login
The login page at `/` has been completely overhauled:
- **Two-Part Input**: Separate boxes for the 4-digit code and 2-digit year.
- **Auto-Jump**: The cursor automatically jumps to the year box once 4 digits are typed.
- **Role Selection**: After entering the code, members can explicitly choose to log in as an **Abalat Member** or a **Course Student**, ensuring they see the correct dashboard.

### 3. Salsay Transition Workflow
Implemented an automated recommendation pipeline:
- **Eligibility Check**: Students in `SALSAY` or `RABEAY` classes who aren't yet Regular Members are automatically flagged.
- **Recommendation List**: Course admins can "Send Info to Abalat" with one click.
- **Abalat Registration**: Abalat admins have a dedicated **"Recommended Students"** dashboard to officially register these students into the regular membership database, assigning them their new `FH-` code while keeping their `FHC-` history intact.

### 4. Technical Foundations
- **Prisma Evolution**: Migrated the `memberType` field to a `memberTypes` array to support users holding multiple roles.
- **Data Migration**: Successfully converted all existing users to the new ID format and role structure using a custom migration script.
- **Strict Isolation**: Updated all modules (Abalat, Mezmur, Course) to filter members accurately based on their active roles.

## How to use
1. **Members**: Go to the login page, type your 4-digit code and 2-digit year, then select your role.
2. **Course Admins**: On a student's profile (Salsay level), look for the "Promotion Eligible" banner to send their file to Abalat.
3. **Abalat Admins**: Visit **"የተማሪዎች ጥቆማ"** (Recommendations) in the sidebar to register students sent from the Course module.

> [!IMPORTANT]
> All existing member IDs have been updated. Users must now use the `FH-XXXX-YY` format to log in.

> [!TIP]
> Students who pass `KEREMT` level are now automatically progressed to `KALEAY` for the following year.
