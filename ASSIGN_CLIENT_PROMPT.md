# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are implementing the "Assign Diet Plan to Clients" flow.
A coach views a diet plan in `DietDetailsView.tsx`. When they click “Assign to Client”, they must be able to select one or more of their own clients and assign the current diet plan to them by creating `weeklyMealPlans` records.
This flow must be safe, scalable, idempotent, and production-ready.

**Files in Scope:**
*   Frontend:
    *   `src/features/meals/components/DietDetailsView.tsx`
    *   `src/features/meals/components/AssignClientModal.tsx`
*   Backend:
    *   `convex/plans.ts`
    *   `convex/schema.ts` (users, weeklyMealPlans, dietPlans)

---

## 1. Mission Objectives

### A. Assign Flow (End-to-End)
1.  Coach clicks "Assign to Client".
2.  Modal opens listing only clients assigned to the current coach.
3.  Coach selects one or more clients.
4.  Coach confirms assignment.
5.  Backend creates one `weeklyMealPlans` record per client.
6.  Success feedback is shown.

### B. Client Eligibility Rules
A client is eligible if:
*   `role === "client"`
*   `assignedCoachId === auth.userId`

**Clients not meeting these criteria must never be returned from the backend.**

---

## 2. Backend Implementation (Convex)

### Query: `getMyClients`
**Purpose**: Return all clients assigned to the authenticated coach.

**Logic**:
1.  Filter users:
    *   `role === "client"`
    *   `assignedCoachId === ctx.auth.userId`
2.  For each client:
    *   Include basic identity fields.
    *   Include whether they already have an active weekly plan.

**Return Shape**:
```typescript
{
  id: Id<"users">,
  firstName: string,
  lastName: string,
  avatarUrl?: string,
  hasActivePlan: boolean
}[]
```

### Mutation: `assignPlanToClients`
**Args**:
```typescript
{
  dietPlanId: Id<"dietPlans">,
  clientIds: Id<"users">[],
  startDate: string // ISO 8601
}
```

**Rules**:
*   Must be idempotent.
*   Must only allow assigning plans owned by the current coach.
*   Must be safe to call with large client lists.

**Logic**:
For each client:
1.  Validate ownership (`assignedCoachId`).
2.  **Archive any existing active weekly plans** (optional but recommended).
3.  Insert a new `weeklyMealPlans` document:
    *   `dietPlanId`
    *   `clientId`
    *   `coachId`: `ctx.auth.userId`
    *   `startDate`
    *   `status`: "active"
4.  **Error Handling**: If one client fails validation, skip that client, do not crash the mutation.

---

## 3. Frontend Implementation

### A. `AssignClientModal.tsx`
**Props**:
```typescript
{
  visible: boolean
  onClose(): void
  onConfirm(clientIds: Id<"users">[]): void
}
```

**UI Requirements**:
*   Search input (name filter).
*   Scrollable list (FlatList).
*   Multi-select with visual state.
*   “Select All / Clear All”.
*   **Assign button**:
    *   Disabled if no clients selected.
    *   Label: "Assign to X Clients".

**UX Enhancements**:
*   Show warning indicator if `hasActivePlan === true`.
*   Allow assignment anyway (no hard block).

### B. `DietDetailsView.tsx` Integration
**Responsibilities**:
*   Own modal open/close state.
*   Trigger `assignPlanToClients`.
*   Handle loading & error states.
*   Show success toast after completion.

---

## 4. Execution Rules (Strict)

*   **Security First**:
    *   Never trust frontend filters.
    *   Backend must enforce ownership.
*   **Type Safety**: Use `Id<"users">` and `Id<"dietPlans">`.
*   **Performance**:
    *   FlatList required.
    *   No N+1 client queries.
*   **UX**:
    *   Show loading indicator during assignment.
    *   Disable Assign button while mutation is running.

## 5. Deliverables

1.  `convex/plans.ts` (getMyClients, assignPlanToClients)
2.  `src/features/meals/components/AssignClientModal.tsx`
3.  Updated `DietDetailsView.tsx`

**Quality Bar**:
Production-safe. Scalable to 100+ clients. Idempotent backend logic. No frontend-only authorization. Clear separation of concerns.
