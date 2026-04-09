# Grahamly Dashboard - Digital Handover Log

> [!IMPORTANT]
> **MANDATORY RULE FOR AI AGENTS**: Any change made to the codebase MUST be instantly recorded in this `HANDOVER.md` file. This is the source of truth for all architectural and feature updates.

## 🎯 Project State
The Grahamly Dashboard has been fully migrated from LocalStorage to a **Supabase Cloud Backend**. All core features are synchronized, persistent, and verified with a production build. OneSignal push notifications are now fully operational in both development and production environments.

## 🏗 Technical Architecture

### 1. Data Layer: Supabase
- **Real-time Sync**: Uses `@supabase/supabase-js` and React Query (`@tanstack/react-query`) for optimistic updates and automatic invalidation.
- **Tables**:
  - `tenants`: Framework settings (North Star, milestones, colors).
  - `users`: Presence and profile data.
  - `tasks` & `projects`: Kanban logic.
  - `custom_widgets`: User-defined dashboard metrics.
  - `eod_reports`: Daily accountability logs.
- **Initialization**: See `setup_supabase.sql` for the full schema.

### 2. State Management: Zustand
- `workspaceStore.ts`: Tracks `tenantId`, `currentTenant`, and global stats.
- `onesignal_id` (Users): Stores the notification subscription ID for targeted pings.

### 5. PWA & Push Notifications (Fixed & Configured)
- **PWA Status**: Fully functional via `vite-plugin-pwa`. The app is installable on Android/iOS/Desktop.
- **Push Notification Status**: **FIXED**. Device enrollment and trigger mechanisms are active.
- **Key Fixes**: 
  - **PWA Dev Mode**: Enabled `devOptions` in `vite.config.ts` to ensure `sw.js` is served during development.
  - **Service Worker Sync**: OneSignal now uses `sw.js`, which imports the OneSignal SDK, ensuring a single, unified worker registration.
  - **User Mapping**: Implemented `OneSignal.login(user.id)` and `OneSignal.logout()` in auth flows to enable targeted notifications via `external_id`.
  - **Edge Function Robustness**: Improved the `send-notification` function with better error reporting and support for both `include_player_ids` and `include_subscription_ids`.

### 4. Social Layer (Fixed)
- **Tracked Likes**: Replaced simple counters with a `liked_by` array, enabling multi-user toggle (like/unlike) functionality.
- **Full Commenting**: Implemented a real-time comment system stored in the `social_posts` table (JSONB), with interactive UI for viewing and posting.

### 3. Project Management (New)
- **Edit/Delete**: Project cards now support hover-triggered actions to change names/descriptions or permanently remove projects (and their tasks).
- **Cascade Deletion**: Store logic ensures that deleting a project also cleans up its associated tasks from the local state.

## 🚀 Recent Accomplishments
- **Dashboard Data Fixes**: Resolved bugs in `useWidgetData.ts` affecting Supabase count retrieval and time label calculations for live charts.
- **TypeScript Store Fixes**: Added `taskVelocityData` and synchronized state updates to the Zustand workspace store, resolving compilation errors across multiple components.
- **Kanban Board Reliability**: Enhanced the `ProjectBoard` drag-and-drop feature by adopting pointer-based collision detection and optimizing touch sensor constraints, ensuring seamless transitions across mobile and desktop.
- **Edge Function & TypeScript Harmony**: Excluded Deno-based Supabase functions from the main `tsconfig.json` and added `@ts-nocheck` to silence environment-specific compiler errors.
- **Schema Completion**: Patched `setup_supabase.sql` to explicitly include the `completed_at` timestamp in the `tasks` table, fixing a schema cache error when moving tasks to "Done".
- **Sidebar Cleanup**: Stripped the right-pointing chevron arrows from the `Sidebar` items for a cleaner, label-centric aesthetic.
- **OneSignal Restoration**: Successfully debugged and restored the push notification system, including service worker registration and edge function payload mapping.
- **Total Synchronization**: Connected every dashboard card, persona panel, and War Room feed to live Supabase data.
- **EOD & North Star Fixes**: Resolved critical schema mismatches (missing `date` and `north_star_chart_data` columns) via SQL migration.
- **Mobile Documents UI Refactor**: Successfully refactored the `Documents` page to use a responsive card-based layout on mobile devices.
- **Mobile Polish**: Added the theme toggle to the mobile menu for full accessibility.
- **Edge Function Modernization**: Migrated the `send-notification` function to use `Deno.serve` and restructured it to `supabase/functions/send-notification/index.ts`. Optimized for OneSignal's newest subscription API.
- **ESM & Windows Fixes**: Resolved the `ERR_INVALID_URL_SCHEME` in `server.ts` by correctly defining `__dirname` for ESM on Windows.
- **Sticky Timeframe**: Persisted the Task Velocity timeframe (Weekly/Monthly) in the `workspaceStore` to ensure it remains active after a page refresh.
- **User Guide Integration**: Added a floating, glassmorphic "User Guide" link to the login screen. Transitions from a local asset to a permanent **Supabase Storage** URL for reliable global access on the live site.

## 🔮 Future Roadmap (Next Steps)
- **RLS Enablement**: Enable Supabase Row Level Security once user authentication (Auth) is fully integrated.
- **Document Migration**: Migrate to Cloudflare R2 (10GB Free) once Supabase Storage limits are reached. See `document_migration_plan.md`.
- **Task Analytics**: The `completed_at` column in `tasks` is ready for advanced velocity chart implementation.
- **Collaboration**: Real-time presence and typing indicators in the War Room.

- **Mobile Usability Overhaul**: Fully refactored the navigation for mobile devices. Added the "Projects" module to both the bottom navigation bar and the hamburger menu.
- **Touch-Optimized Kanban**: Integrated `TouchSensor` with a 250ms hold-to-drag delay and implemented permanently visible drag handles for mobile, ensuring the project board is fully functional on touch devices.

- **Manual Panel Persistence**: Disconnected the "Build Status" (Side Panel) and "Status Snapshot" cards from dynamic task counts. They now display and store purely manual labels and values in Supabase.
- **Enhanced Modal Logic**: Verified that `EditPanelModal` correctly saves and retrieves localized manual entries for all overview cards.

---
*Updated by Solace (Team Lead) on 2026-04-02. TypeScript Stores patched, Deno compiler silenced, Kanban drag-and-drop stabilized on all platforms, and Sidebar aesthetically refined.*
