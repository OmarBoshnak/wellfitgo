import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getCurrentUser } from "./auth";

/**
 * Get clients for the current coach/admin (for client selector dropdown)
 * Returns assigned clients first, falls back to all clients if none assigned
 * Admin can see all clients
 */
export const getMyClients = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) return [];

        // Admin sees all clients
        if (user.role === "admin") {
            const allClients = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "client"))
                .collect();

            return allClients.map((client) => ({
                _id: client._id,
                firstName: client.firstName,
                lastName: client.lastName || "",
                avatarUrl: client.avatarUrl,
            }));
        }

        // First try to get clients assigned to this coach
        const assignedClients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .filter((q) => q.eq(q.field("role"), "client"))
            .collect();

        // If coach has assigned clients, return them
        if (assignedClients.length > 0) {
            return assignedClients.map((client) => ({
                _id: client._id,
                firstName: client.firstName,
                lastName: client.lastName || "",
                avatarUrl: client.avatarUrl,
            }));
        }

        // Fallback: return ALL clients (for coaches without assigned clients)
        const allClients = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "client"))
            .collect();

        return allClients.map((client) => ({
            _id: client._id,
            firstName: client.firstName,
            lastName: client.lastName || "",
            avatarUrl: client.avatarUrl,
        }));
    },
});

/**
 * Get calendar events for current coach/admin on a specific date
 * Admin can see all events
 */
export const getEventsByDate = query({
    args: {
        date: v.string(), // ISO date "2025-12-21"
    },
    handler: async (ctx, { date }) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) return [];

        let events;
        if (user.role === "admin") {
            // Admin sees all events for this date
            events = await ctx.db
                .query("calendarEvents")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("date"), date),
                        q.neq(q.field("status"), "cancelled")
                    )
                )
                .collect();
        } else {
            // Coach sees only their events
            events = await ctx.db
                .query("calendarEvents")
                .withIndex("by_coach_date", (q) =>
                    q.eq("coachId", user._id).eq("date", date)
                )
                .filter((q) => q.neq(q.field("status"), "cancelled"))
                .collect();
        }

        // Enrich with client info
        const enrichedEvents = await Promise.all(
            events.map(async (event) => {
                const client = await ctx.db.get(event.clientId);
                return {
                    ...event,
                    clientName: client
                        ? `${client.firstName} ${client.lastName || ""}`.trim()
                        : "Unknown Client",
                    clientAvatar: client?.avatarUrl,
                    clientPhone: client?.phone ?? null,
                };
            })
        );

        return enrichedEvents;
    },
});

/**
 * Get calendar events for current coach/admin within a date range (for week view)
 * Admin can see all events
 */
export const getEventsByDateRange = query({
    args: {
        startDate: v.string(), // ISO date "2025-12-21"
        endDate: v.string(), // ISO date "2025-12-27"
    },
    handler: async (ctx, { startDate, endDate }) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) return [];

        let events;
        if (user.role === "admin") {
            // Admin sees all events in date range
            events = await ctx.db
                .query("calendarEvents")
                .filter((q) =>
                    q.and(
                        q.gte(q.field("date"), startDate),
                        q.lte(q.field("date"), endDate),
                        q.neq(q.field("status"), "cancelled")
                    )
                )
                .collect();
        } else {
            // Coach sees only their events - we need to filter by date range after collecting
            const allCoachEvents = await ctx.db
                .query("calendarEvents")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("coachId"), user._id),
                        q.gte(q.field("date"), startDate),
                        q.lte(q.field("date"), endDate),
                        q.neq(q.field("status"), "cancelled")
                    )
                )
                .collect();
            events = allCoachEvents;
        }

        // Enrich with client info
        const enrichedEvents = await Promise.all(
            events.map(async (event) => {
                const client = await ctx.db.get(event.clientId);
                return {
                    ...event,
                    clientName: client
                        ? `${client.firstName} ${client.lastName || ""}`.trim()
                        : "Unknown Client",
                    clientAvatar: client?.avatarUrl,
                };
            })
        );

        return enrichedEvents;
    },
});

/**
 * Get today's appointments for the dashboard
 * Returns scheduled events for today with client info and calculated status
 */
export const getTodaysAppointments = query({
    args: {
        date: v.optional(v.string()), // Optional: override today's date (for testing)
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Use provided date or today's date
        const today = args.date || new Date().toISOString().split("T")[0];
        const limit = args.limit ?? 10;
        const now = Date.now();

        // Get events for today
        let events;
        if (user.role === "admin") {
            events = await ctx.db
                .query("calendarEvents")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("date"), today),
                        q.eq(q.field("status"), "scheduled")
                    )
                )
                .collect();
        } else {
            events = await ctx.db
                .query("calendarEvents")
                .withIndex("by_coach_date", (q) =>
                    q.eq("coachId", user._id).eq("date", today)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .collect();
        }

        // Sort by startAt timestamp
        events.sort((a, b) => a.startAt - b.startAt);

        // Limit results
        events = events.slice(0, limit);

        // Calculate duration (in minutes) from startTime and endTime
        const calculateDuration = (startTime: string, endTime: string): number => {
            const [startH, startM] = startTime.split(":").map(Number);
            const [endH, endM] = endTime.split(":").map(Number);
            return (endH * 60 + endM) - (startH * 60 + startM);
        };

        // Enrich with client info and calculate status
        const enrichedEvents = await Promise.all(
            events.map(async (event) => {
                const client = await ctx.db.get(event.clientId);

                // Calculate status based on current time
                const minutesUntilStart = (event.startAt - now) / (1000 * 60);
                let status: "upcoming" | "starting_soon" | "in_progress";

                if (now >= event.startAt && now < event.endAt) {
                    status = "in_progress";
                } else if (minutesUntilStart <= 15 && minutesUntilStart > 0) {
                    status = "starting_soon";
                } else {
                    status = "upcoming";
                }

                return {
                    id: event._id,
                    clientId: event.clientId,
                    clientName: client
                        ? `${client.firstName} ${client.lastName || ""}`.trim()
                        : "Unknown Client",
                    clientAvatar: client?.avatarUrl ?? null,
                    clientPhone: client?.phone ?? null,
                    date: event.date,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    type: event.type,
                    duration: calculateDuration(event.startTime, event.endTime),
                    status,
                    reason: event.reason,
                    notes: event.notes,
                };
            })
        );

        return enrichedEvents;
    },
});

/**
 * Create a new phone call appointment
 * Both coach and admin can create appointments
 */
export const createCalendarCall = mutation({
    args: {
        clientId: v.id("users"),
        date: v.string(), // "2025-12-21"
        startTime: v.string(), // "10:00"
        endTime: v.string(), // "10:30"
        reason: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches and admins can create appointments");
        }

        // Parse times to create Unix timestamps
        const [startHour, startMin] = args.startTime.split(":").map(Number);
        const [endHour, endMin] = args.endTime.split(":").map(Number);

        // Parse date components manually to avoid timezone issues
        // new Date("2025-12-22") parses as UTC midnight, causing day offset in local timezone
        const [year, month, day] = args.date.split("-").map(Number);

        // Create dates in local timezone by specifying components
        const startAt = new Date(year, month - 1, day, startHour, startMin, 0, 0);
        const endAt = new Date(year, month - 1, day, endHour, endMin, 0, 0);

        // Validate end time is after start time
        if (endAt.getTime() <= startAt.getTime()) {
            throw new Error("End time must be after start time");
        }

        // Check for overlapping events
        const existingEvents = await ctx.db
            .query("calendarEvents")
            .withIndex("by_coach_date", (q) =>
                q.eq("coachId", user._id).eq("date", args.date)
            )
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .collect();

        for (const event of existingEvents) {
            // Check if times overlap
            if (
                (startAt.getTime() < event.endAt && endAt.getTime() > event.startAt)
            ) {
                throw new Error("This time slot overlaps with an existing appointment");
            }
        }

        const now = Date.now();
        const eventId = await ctx.db.insert("calendarEvents", {
            coachId: user._id,
            clientId: args.clientId,
            type: "call",
            reason: args.reason,
            notes: args.notes,
            date: args.date,
            startTime: args.startTime,
            endTime: args.endTime,
            startAt: startAt.getTime(),
            endAt: endAt.getTime(),
            status: "scheduled",
            createdAt: now,
            updatedAt: now,
        });

        // Return the created event with client info
        const client = await ctx.db.get(args.clientId);
        const event = await ctx.db.get(eventId);

        return {
            ...event,
            clientName: client
                ? `${client.firstName} ${client.lastName || ""}`.trim()
                : "Unknown Client",
            clientAvatar: client?.avatarUrl,
        };
    },
});

/**
 * Cancel an appointment
 * Coach can cancel their own events, admin can cancel any event
 */
export const cancelEvent = mutation({
    args: {
        eventId: v.id("calendarEvents"),
    },
    handler: async (ctx, { eventId }) => {
        const user = await requireAuth(ctx);
        const event = await ctx.db.get(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Admin can cancel any event, coach can only cancel their own
        if (user.role !== "admin" && event.coachId !== user._id) {
            throw new Error("Not authorized to cancel this event");
        }

        await ctx.db.patch(eventId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Update an appointment (date, time)
 * Coach can update their own events, admin can update any event
 */
export const updateEvent = mutation({
    args: {
        eventId: v.id("calendarEvents"),
        date: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        reason: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Admin can update any event, coach can only update their own
        if (user.role !== "admin" && event.coachId !== user._id) {
            throw new Error("Not authorized to update this event");
        }

        // Build update object
        const updates: Record<string, any> = {
            updatedAt: Date.now(),
        };

        if (args.date !== undefined) updates.date = args.date;
        if (args.reason !== undefined) updates.reason = args.reason;
        if (args.notes !== undefined) updates.notes = args.notes;

        // If times are being updated, recalculate timestamps
        const newDate = args.date || event.date;
        const newStartTime = args.startTime || event.startTime;
        const newEndTime = args.endTime || event.endTime;

        if (args.startTime || args.endTime || args.date) {
            const [startHour, startMin] = newStartTime.split(":").map(Number);
            const [endHour, endMin] = newEndTime.split(":").map(Number);

            // Parse date components manually to avoid timezone issues
            const [year, month, day] = newDate.split("-").map(Number);

            // Create dates in local timezone by specifying components
            const startAt = new Date(year, month - 1, day, startHour, startMin, 0, 0);
            const endAt = new Date(year, month - 1, day, endHour, endMin, 0, 0);

            // Validate end time is after start time
            if (endAt.getTime() <= startAt.getTime()) {
                throw new Error("End time must be after start time");
            }

            updates.date = newDate;
            updates.startTime = newStartTime;
            updates.endTime = newEndTime;
            updates.startAt = startAt.getTime();
            updates.endAt = endAt.getTime();

            // Check for overlapping events (excluding this event)
            const existingEvents = await ctx.db
                .query("calendarEvents")
                .withIndex("by_coach_date", (q) =>
                    q.eq("coachId", event.coachId).eq("date", newDate)
                )
                .filter((q) =>
                    q.and(
                        q.neq(q.field("_id"), args.eventId),
                        q.neq(q.field("status"), "cancelled")
                    )
                )
                .collect();

            for (const existing of existingEvents) {
                if (startAt.getTime() < existing.endAt && endAt.getTime() > existing.startAt) {
                    throw new Error("This time slot overlaps with an existing appointment");
                }
            }
        }

        await ctx.db.patch(args.eventId, updates);

        // Return updated event with client info
        const updatedEvent = await ctx.db.get(args.eventId);
        const client = await ctx.db.get(event.clientId);

        return {
            ...updatedEvent,
            clientName: client
                ? `${client.firstName} ${client.lastName || ""}`.trim()
                : "Unknown Client",
            clientAvatar: client?.avatarUrl,
        };
    },
});
