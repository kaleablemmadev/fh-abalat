# Implementation Plan - Mezmur Lyrics Alignment and Zemachs

This plan addresses the requirement to remove manual alignment options for lyrics in Mezmur mode and implement a "multiple Zemach" structure with automatic alternating alignment.

## User Review Required

> [!NOTE]
> The "multiple Zemach" functionality and automatic alternating alignment are already partially implemented in the current codebase. This plan focuses on removing the remaining manual alignment options and ensuring consistency across all Mezmur-related views.

> [!IMPORTANT]
> I will hide the "Alignment" selector in all UI components but keep the `alignment` field in the database (defaulting to `LEFT`) to maintain backward compatibility and avoid breaking existing data.

## Proposed Changes

### UI Components

#### [MODIFY] [BulkMusicUploadModal.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/music/components/BulkMusicUploadModal.tsx)
- Remove the "Alignment" selector section from the form.
- Update `handleSubmit` to hardcode `alignment` to `"LEFT"`.

#### [MODIFY] [MusicLibraryClient.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/music/components/MusicLibraryClient.tsx)
- Ensure the "viewing lyrics" and "editing lyrics" modals do not mention manual alignment.
- Verify alternating alignment logic in both viewing and editing modes.

#### [MODIFY] [MusicUploadForm.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/music/upload/components/MusicUploadForm.tsx)
- Double-check that `alignment` is hidden and hardcoded to `LEFT`.
- (Optional) Improve the labeling of Zemachs to be more descriptive.

#### [MODIFY] [CategoryDetailsClient.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/music-categories/[id]/components/CategoryDetailsClient.tsx)
- Verify that lyrics display uses alternating alignment.

#### [MODIFY] [PlaylistDetailsClient.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/playlists/[id]/components/PlaylistDetailsClient.tsx)
- Verify that lyrics display uses alternating alignment.

#### [MODIFY] [MemberMezmurPlanClient.tsx](file:///C:/Dev/fh-abalat/src/app/member/mezmur-plan/components/MemberMezmurPlanClient.tsx)
- Verify that the member view for lyrics uses alternating alignment.

### API Routes

#### [MODIFY] [upload/route.ts](file:///C:/Dev/fh-abalat/src/app/api/mezmur/music/upload/route.ts)
- Update to default `alignment` to `"LEFT"` if not provided.

#### [MODIFY] [bulk-upload/route.ts](file:///C:/Dev/fh-abalat/src/app/api/mezmur/music/bulk-upload/route.ts)
- Update to default `alignment` to `"LEFT"` if not provided.

## Verification Plan

### Manual Verification
- **Bulk Upload**: Open the bulk upload modal and verify that the Alignment selector is no longer visible. Perform a bulk upload and verify it defaults to LEFT.
- **Lyrics View**: Open the lyrics for a song with multiple Zemachs and verify they alternate between left and right alignment.
- **Lyrics Edit**: Edit a song's lyrics, add a new Zemach, and verify it automatically shows the correct alignment label (e.g., "አዝማች 3 · ← ግራ").
- **Member View**: Log in as a member, go to the Mezmur Plan, and verify lyrics display correctly with alternating alignment.
