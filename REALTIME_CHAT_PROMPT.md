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

## Production Logic Requirements

🔐 **A. Message Authorization Rules (Mandatory)**
1. **Client:**
   - May ONLY send messages to their `assignedChatDoctorId`.
   - If no doctor is assigned → sending is disabled.
   - If `subscriptionStatus !== 'active' | 'trial'` → sending is disabled.
2. **Chat Doctor (Coach role):**
   - May ONLY send messages to clients where `client.assignedChatDoctorId === currentUser._id`.
3. **Admin:**
   - Read access to all conversations.
   - Sending messages is OPTIONAL:
     - If allowed, must be explicitly implemented.
     - Otherwise, admin is read-only.

🔁 **B. Conversation Uniqueness & Reassignment**
- There must be **EXACTLY ONE** active conversation per `(clientId, assignedChatDoctorId)`.
- `assignChatDoctor` must be **idempotent**:
  - If conversation already exists → reactivate it.
  - Do NOT create duplicates.
- If a client is reassigned to a new chat doctor:
  - **Archive** the old conversation.
  - **Create or activate** a new conversation with the new doctor.
  - Old messages remain readable but locked (no new messages allowed).

🔔 **C. Unread & Read Semantics**
- Conversations must track:
  - `unreadByDoctor`
  - `unreadByClient`
- Rules:
  - When Client sends → `unreadByDoctor++`
  - When Doctor sends → `unreadByClient++`
  - Opening a conversation resets unread for that role ONLY.
- **Admin** opening a conversation:
  - Does **NOT** affect unread counts for doctor or client (Ghost Mode).

⚡ **D. Index & Performance Requirements**
- **Required indexes:**
  - `conversations.by_participants`
  - `conversations.by_updatedAt`
  - `users.by_assignedChatDoctor`
  - `messages.by_conversation`
- **Inbox queries MUST:**
  - Filter by role first.
  - Filter by subscription status early.
  - Avoid full table scans.

📸 **E. Media & Voice Capabilities**

### 1. Image Attachments (The "Attach" Button)
- **Status:** Partially implemented in `chat.tsx`.
- **Requirement:**
  - Ensure `expo-image-picker` is correctly configured (verify permissions in `app.json` / Info.plist).
  - Use `api.chat.generateUploadUrl` to get a signed URL.
  - Upload the file blob to Convex Storage.
  - Send message with `messageType: 'image'` and `mediaUrl: storageId`.
  - **UX:** Show a progress indicator while uploading. Disable send button during upload.

### 2. Voice Notes (The "Mic" Button)
- **Status:** Pending implementation (currently empty function).
- **Requirement:**
  - Install/Use `expo-av` for recording and playback.
  - **Recording Flow:**
    - Press Mic → Request Permission → Start Recording (show red indicator/timer).
    - Release/Stop → Upload Audio Blob to Convex Storage.
    - Send message with `messageType: 'voice'`, `mediaUrl: storageId`, and `mediaDuration`.
  - **Playback UI:**
    - Render a custom audio player bubble.
    - Features: Play/Pause toggle, Seek bar, Duration display.
    - **Performance:** Ensure sound is unloaded when component unmounts.

## Implementation Steps for Agent
1.  **Schema:** Add `assignedChatDoctorId` to `users`.
2.  **Backend:** Implement `assignChatDoctor` with the Reassignment logic (B) and Authorization rules (A).
3.  **Backend:** Update `getCoachInbox` / `getMessages` to respect Admin privileges and Index requirements (D).
4.  **Frontend (Doctor):** Update `messages.tsx` to render the real list of assigned paid clients with accurate Unread counts (C).
5.  **Frontend (Patient):** Update `chat.tsx` to:
    - Show the correct Doctor header.
    - Enforce Subscription Gating (A).
    - **Enable Media:** Fix Image Attachments and implement Voice Recording/Playback (E).
