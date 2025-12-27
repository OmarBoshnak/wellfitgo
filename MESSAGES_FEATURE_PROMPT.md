# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are finalizing the "Messages" feature for the Doctor's Dashboard.
Currently, the `MessagesScreen` is partially connected, but the **Tab Bar Badge** (red circle showing unread count) is hardcoded to `5`.
The goal is to make the entire messaging flow, including the badge, fully interactive, secure, and real-time.

**Files of Interest:**
- UI (Screen): `app/(app)/doctor/(tabs)/messages.tsx`
- UI (Layout/Tabs): `app/(app)/doctor/(tabs)/_layout.tsx`
- Backend: `convex/chat.ts` (or wherever messaging logic lives)

---

## 1. The Mission

1.  **Global Badge**: Create a query to get the *total* number of unread messages for the current user and connect it to the Tab Bar.
2.  **Inbox Polish**: Ensure the `MessagesScreen` correctly displays conversations, handles "Unread" filtering, and updates in real-time.

---

## 2. Backend Implementation (Convex)

Update `convex/chat.ts`:

### Query: `getUnreadCount`
- **Logic**:
    - Query `conversations` where `coachId` is the current user.
    - Sum the `unreadByCoach` field across all conversations.
    - *Performance Note*: If possible, use an index `by_unread_coach` or similar. Do not scan archived/inactive conversations if they shouldn't count.
- **Security**: Only conversations where the authenticated user is a participant (coachId) may be queried or counted.
- **Return**: `number` (The total count).

### Query: `getInbox` (Review & Polish)
- Ensure it returns `unreadByCoach` for each conversation so the list UI can show per-chat badges.

---

## 3. Frontend Implementation

### A. Tab Bar Badge (`_layout.tsx`)
- **Hook**: Use `useQuery(api.chat.getUnreadCount)`.
- **Integration**:
    - Pass the result to `<TabBadge count={data || 0} />`.
    - **UX Rule**: If `count === 0` (or data is undefined), the badge must **not render at all**. No empty red dots.

### B. Messages Screen (`messages.tsx`)
- **Review**: Ensure `useCoachInbox` uses the correct Convex query.
- **Interactivity**:
    - Clicking a conversation opens `ChatScreen`.
    - **Read Semantics**: A message is considered "read" when the coach opens the conversation.
    - **Action**: Entering `ChatScreen` (on focus/mount) must trigger `api.chat.markRead` (or equivalent mutation) to clear the unread count for that conversation.

---

## 4. Execution Rules

1.  **Real-Time**: Do not implement manual polling. Use Convex `useQuery`.
2.  **Zero Mock Data**: Remove the hardcoded `count={5}` in `_layout.tsx`.
3.  **Read Logic**: Unread messages must be cleared when the coach opens a conversation.
4.  **Security**: Prevent data leakage. Queries must be strictly scoped to the authenticated user's conversations.
5.  **Performance**: Avoid scanning historical/archived data for unread counts if unnecessary.

## 5. Deliverables

- `convex/chat.ts` (getUnreadCount, markRead logic)
- `app/(app)/doctor/(tabs)/_layout.tsx` (Connected Badge)
- `app/(app)/doctor/(tabs)/messages.tsx` (Verified Integration)

**Tone**:
Polished. Real-time. Secure.
