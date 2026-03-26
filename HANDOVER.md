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
- **OneSignal Restoration**: Successfully debugged and restored the push notification system, including service worker registration and edge function payload mapping.
- **Total Synchronization**: Connected every dashboard card, persona panel, and War Room feed to live Supabase data.
- **EOD & North Star Fixes**: Resolved critical schema mismatches (missing `date` and `north_star_chart_data` columns) via SQL migration.
- **Mobile Documents UI Refactor**: Successfully refactored the `Documents` page to use a responsive card-based layout on mobile devices. This fixed an issue where action buttons (download/delete) were hidden due to lack of space and reliance on hover states.
- **Mobile Polish**: Added the theme toggle to the mobile menu for full accessibility.

## 🔮 Future Roadmap (Next Steps)
- **RLS Enablement**: Enable Supabase Row Level Security once user authentication (Auth) is fully integrated.
- **Task Analytics**: The `completed_at` column in `tasks` is ready for advanced velocity chart implementation.
- **Collaboration**: Real-time presence and typing indicators in the War Room.

- **Mobile Usability Overhaul**: Fully refactored the navigation for mobile devices. Added the "Projects" module to both the bottom navigation bar and the hamburger menu.
- **Touch-Optimized Kanban**: Integrated `TouchSensor` with a 250ms hold-to-drag delay and implemented permanently visible drag handles for mobile, ensuring the project board is fully functional on touch devices.

- **Manual Task Velocity Correction**: Reverted the dynamic Supabase query to restore manual data control. Implemented a functional Weekly/Monthly toggle that switches between manual data sets in the `workspaceStore`.
- **Enhanced Modal Editing**: Updated the `EditPanelModal` to contextually edit either Weekly (daily) or Monthly values depending on the active view.

---
*Updated by Solace (Team Lead) on 2026-03-26. Manual Task Velocity toggle and mobile navigation are fully functional and live.*
