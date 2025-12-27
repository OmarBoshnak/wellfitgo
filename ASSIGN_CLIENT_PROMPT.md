# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are implementing the "Assign Plan" functionality in `DietDetailsView.tsx`.
When the coach clicks "Assign to Client", they should see a list of their clients and be able to assign the current diet plan to one or more of them.

**Files of Interest:**
- UI: `src/features/meals/components/DietDetailsView.tsx`
- New Component: `src/features/meals/components/AssignClientModal.tsx`
- Schema: `convex/schema.ts` (`users`, `weeklyMealPlans`)

---

## 1. The Mission

Make the "Assign to Client" button functional.

1.  **Create Modal**: Implement `AssignClientModal` to list available clients.
2.  **Fetch Clients**: Query `users` where `role === 'client'` (and ideally `assignedCoachId === currentUser`).
3.  **Bulk Assign**: Allow selecting multiple clients.
4.  **Action**: On confirm, create a `weeklyMealPlans` entry for each selected client.

---

## 2. Backend Implementation (Convex)

Update `convex/plans.ts`:

### Query: `getMyClients`
- **Logic**: Fetch all users where `assignedCoachId` matches the current user.
- **Return**: `{ id, firstName, lastName, avatarUrl, currentPlan? }` (It's helpful to know if they already have a plan).

### Mutation: `assignPlanToClients`
- **Args**:
    ```typescript
    {
      dietPlanId: Id<"dietPlans">,
      clientIds: Id<"users">[],
      startDate: string // ISO date
    }
    ```
- **Logic**:
    - Iterate over `clientIds`.
    - For each client, create a new `weeklyMealPlans` record.
    - Set `status: 'active'`.
    - (Optional) Archive any previous active plans for that client to avoid collisions.

---

## 3. Frontend Implementation

### A. New Component: `AssignClientModal.tsx`
- **Props**: `visible`, `onClose`, `onAssign(clientIds: string[])`.
- **UI**:
    - Search bar (filter clients by name).
    - List of clients with checkboxes/selection state.
    - "Select All" toggle.
    - "Assign" button showing count (e.g., "Assign to 3 Clients").

### B. Integration in `DietDetailsView.tsx`
- **State**: Add `showAssignModal` (boolean).
- **Handler**:
    - `onAssign` prop -> sets `showAssignModal(true)`.
    - Modal `onAssign` -> calls `assignPlanToClients` mutation -> closes modal -> shows Success Toast.

---

## 4. Execution Rules

1.  **Performance**: If a coach has 100+ clients, the list should be performant (FlatList).
2.  **UX**:
    - Show `ActivityIndicator` while assigning.
    - If a client already has an active plan, show a warning icon next to their name in the list.
3.  **Type Safety**: Use `Id<"users">` and `Id<"dietPlans">`.

## 5. Deliverables

- `convex/plans.ts` (getMyClients, assignPlanToClients)
- `src/features/meals/components/AssignClientModal.tsx`
- Refactored `DietDetailsView.tsx` (integrated modal)

**Tone**:
Efficient. Scalable. Coach-centric.
