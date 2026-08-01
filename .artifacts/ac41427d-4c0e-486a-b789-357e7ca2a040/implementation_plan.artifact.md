# Implementation Plan - Bulk Operations & Enhanced Audio Player

Improve Mezmur mode with bulk management capabilities and a robust third-party audio player to resolve playback issues.

## User Review Required

> [!IMPORTANT]
> - **New Audio Player**: I will install and integrate `react-h5-audio-player`. This is a professional-grade React component that handles cross-browser audio compatibility much better than the standard HTML5 tag.
> - **Bulk Upload**: You will be able to select and upload multiple files at once.
> - **Music Picker**: A new tool to select multiple existing songs and link them to categories or playlists in one click.

## Proposed Changes

### [Audio Playback]

#### [NPM] Install Package
- Install `react-h5-audio-player`.

#### [MODIFY] [MusicLibraryClient.tsx](file:///C:/Dev/fh-abalat/src/app/mezmur/music/components/MusicLibraryClient.tsx)
- Replace standard `<audio>` tags with the `AudioPlayer` component.
- Configure it to handle Supabase URLs correctly.

### [Bulk Operations]

#### [NEW] [Bulk Upload API](file:///C:/Dev/fh-abalat/src/app/api/mezmur/music/bulk-upload/route.ts)
- Support multiple file uploads in a single request.
- Batch database creation for files.

#### [NEW] [BulkMusicUploadModal](file:///C:/Dev/fh-abalat/src/app/mezmur/music/components/BulkMusicUploadModal.tsx)
- Allow selecting multiple files and setting common metadata (category, language) for the batch.

#### [NEW] [MusicPickerModal](file:///C:/Dev/fh-abalat/src/app/mezmur/music/components/MusicPickerModal.tsx)
- A searchable checklist for adding existing library songs to a category/playlist.

### [UI Cleanup]

#### [NEW] Category Detail Page
- Create `src/app/mezmur/music-categories/[id]/page.tsx` to manage a specific category's songs.

#### [MODIFY] Playlist and Category UIs
- Add **"Bulk Upload"** and **"Add from Library"** buttons to these pages.

## Verification Plan

### Manual Verification
1. Click play on any song and verify smooth playback with the new UI.
2. Perform a bulk upload of 5 files and verify they all appear.
3. Use the Music Picker to add 3 existing songs to a playlist and verify the update.
