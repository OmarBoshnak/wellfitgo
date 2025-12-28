# Real-Time Chat System & Doctor Assignment Architecture

## Context
The user requires a dedicated "Chat Doctor" system separate from the standard "Diet/Workout Coach".
There are two specific doctors (e.g., Gehad and Mostafa) who handle chat consultations.
The system needs to support real-time messaging, admin oversight, and strict subscription gating.

## Backend Changes (Convex)

### 1. Schema Updates (`convex/schema.ts`)
*   **Modify `users` table:**
    *   Add `assignedChatDoctorId: v.optional(v.id("users"))`.
    *   *Note:* This is distinct from `assignedCoachId`. A client might have Coach A for diet but Chat Doctor B for consultations.
*   **Modify `conversations` table:**
    *   Ensure strict indexes exist for `by_chat_doctor` (if you decide to link conversations directly to the doctor) OR rely on looking up the `client.assignedChatDoctorId`.
    *   *Recommendation:* It is cleaner to keep the conversation between two users. Ensure `conversations` has `participant1Id` and `participant2Id` generic structure, OR rely on the User's `assignedChatDoctorId` to dynamically route messages.
    *   *Decision:* Let's stick to the current schema but strictly enforce that the "Coach" participant in a conversation *must* match the `assignedChatDoctorId`.

### 2. New Mutations & Queries (`convex/chat.ts` & `convex/users.ts`)

#### A. `assignChatDoctor` (Mutation)
*   **Args:** `clientId`, `doctorId`.
*   **Logic:**
    *   Verify `currentUser` is Admin.
    *   Update `users` table for `clientId`, setting `assignedChatDoctorId = doctorId`.
    *   Automatically create or reactivate a conversation between these two users.

#### B. `getCoachInbox` (Query)
*   **Logic:**
    *   If `currentUser.role === 'admin'`: Return ALL active conversations across the platform.
    *   If `currentUser.role === 'coach'`: Return conversations ONLY for clients where `client.assignedChatDoctorId === currentUser._id`.
*   **Filtering:**
    *   Filter out clients whose `subscriptionStatus` is NOT `active` or `trial`. (Paused/Cancelled clients should not appear in the active inbox, or should be visually grayed out).

#### C. `getMyChatDoctor` (Query for Client)
*   **Logic:** Returns the `User` object (name, avatar) of the doctor assigned to the current client.
*   If none assigned, return null (UI should show "Waiting for assignment").

## Frontend Changes (React Native)

### 1. Patient Chat Screen (`mobile/app/(app)/(tabs)/chat.tsx`)
*   **Dynamic Header:**
    *   Fetch the assigned doctor using `api.users.getMyChatDoctor`.
    *   Display their real `firstName`, `lastName`, and `avatarUrl`.
    *   *Fallback:* If no doctor is assigned, show a placeholder "Support Team".
*   **Real-Time Messages:**
    *   Keep using `useQuery(api.chat.getMessages)`.
    *   Ensure the `sendMessage` mutation sends notifications to the specific `assignedChatDoctorId`.

### 2. Doctor Inbox (`mobile/app/(app)/doctor/(tabs)/messages.tsx`)
*   **Data Source:** Use the updated `getCoachInbox`.
*   **UI Updates:**
    *   Display Client Name and Avatar.
    *   Show "Subscription Status" badge if strictly required, otherwise just ensure the list is filtered.
    *   **Admin View:** If the logged-in user is Admin, potentially group messages by "Assigned Doctor" or just show a master list.

### 3. Subscription Gating
*   In the Client Chat screen, if `subscriptionStatus` is `cancelled` or `paused`, disable the input field and show a "Renew Subscription to Chat" banner.

## Implementation Steps for Agent
1.  **Schema:** Add `assignedChatDoctorId` to `users`.
2.  **Backend:** Implement `assignChatDoctor` and update `getCoachInbox` / `getMessages` to respect the new field and Admin privileges.
3.  **Frontend (Doctor):** Update `messages.tsx` to render the real list of assigned paid clients.
4.  **Frontend (Patient):** Update `chat.tsx` to show the correct Doctor header and disable chat if subscription is inactive.
