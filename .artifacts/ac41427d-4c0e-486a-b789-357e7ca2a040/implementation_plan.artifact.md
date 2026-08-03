# Implementation Plan - Fix Mezmur Events Counting and Display

This plan addresses the requirement to distinguish between attendance sessions and actual events in Mezmur mode. Customly created events should be counted and displayed, while attendance sessions should be excluded from the "Events" sections.

## User Review Required

> [!IMPORTANT]
> I will be changing the filters for events in the Mezmur dashboard and schedule. This means "Regular", "Beginners", and "Continuous" study sessions will no longer appear in the "Events" count or list. They will only be accessible via the "Attendance" section.

## Proposed Changes

### Mezmur Dashboard & Schedule

#### [MODIFY] [page.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/page.tsx)
- Update `eventCount` query to filter by `eventType: "MEZMUR_EVENT"` instead of attendance session types.
- Ensure only active events are counted.

#### [MODIFY] [page.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/schedule/page.tsx)
- Update `events` query to filter by `eventType: "MEZMUR_EVENT"`.

#### [MODIFY] [MezmurEventList.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/schedule/components/MezmurEventList.tsx)
- Add `MEZMUR_EVENT` to `typeLabels` and `typeColors`.
- This ensures that actual events are displayed correctly with their proper labels.

## Verification Plan

### Manual Verification
- **Mezmur Dashboard**: Verify the "Events" count reflects only `MEZMUR_EVENT` records.
- **Mezmur Schedule**: Verify that only actual events are listed, and attendance sessions (Regular, etc.) are excluded.
- **Event Creation**: Create a new event and verify it appears in the schedule but not in the attendance sessions list.
