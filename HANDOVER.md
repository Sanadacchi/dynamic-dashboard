# Grahamly Dashboard - Digital Handover Log

> [!IMPORTANT]
> **MANDATORY RULE FOR AI AGENTS**: Any change made to the codebase MUST be instantly recorded in this `HANDOVER.md` file. This is the source of truth for all architectural and feature updates.

## 🎯 Project State
The Grahamly Dashboard has been fully migrated from LocalStorage to a **Supabase Cloud Backend**. All core features are synchronized, persistent, and verified with a production build.

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

### 5. PWA & Web Push Notifications (New)
- **Installable App**: Powered by `vite-plugin-pwa`, users can now "Add to Home Screen" on iOS/Android or "Install" on Desktop for an app-like experience.
- **Push Delivery**: Integrated **OneSignal** (SDK v16) for cross-platform notifications.
- **Explicit Opt-in**: Users can enroll in push notifications via the **User Profile** page, which syncs their unique subscription ID to the `users` table.
- **Automated Triggers**: 
  - **Socials**: Posting an update pings all team members.
  - **War Room**: Adding a blocker pings the team for immediate attention.
  - **Self-Test**: Users can send a "Test Push" from their profile to verify their device is linked.

### 4. Social Layer (Fixed)
- **Tracked Likes**: Replaced simple counters with a `liked_by` array, enabling multi-user toggle (like/unlike) functionality.
- **Full Commenting**: Implemented a real-time comment system stored in the `social_posts` table (JSONB), with interactive UI for viewing and posting.

### 3. Project Management (New)
- **Edit/Delete**: Project cards now support hover-triggered actions to change names/descriptions or permanently remove projects (and their tasks).
- **Cascade Deletion**: Store logic ensures that deleting a project also cleans up its associated tasks from the local state.

## 🚀 Recent Accomplishments
- **Total Synchronization**: Connected every dashboard card, persona panel, and War Room feed to live Supabase data.
- **EOD & North Star Fixes**: Resolved critical schema mismatches (missing `date` and `north_star_chart_data` columns) via SQL migration.
- **Mobile Polish**: Added the theme toggle to the mobile menu for full accessibility.

## 🔮 Future Roadmap (Next Steps)
- **RLS Enablement**: Enable Supabase Row Level Security once user authentication (Auth) is fully integrated.
- **Task Analytics**: The `completed_at` column in `tasks` is ready for advanced velocity chart implementation.
- **Collaboration**: Real-time presence and typing indicators in the War Room.

---
*Created by Antigravity AI on 2026-03-23. The project is production-ready and cloud-synchronized.*
