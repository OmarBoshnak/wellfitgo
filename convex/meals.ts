import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./auth";

// ============ HELPER FUNCTIONS ============

/**
 * Get day of week from date string (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(dateStr: string): number {
    const date = new Date(dateStr + "T12:00:00Z");
    return date.getUTCDay();
}

/**
 * Map day number to day name for dailyMeals lookup
 */
const DAY_NAMES: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
};

/**
 * Day keys in order starting from Saturday (Day 1)
 * This is for the diet cycle where Saturday = Day 1
 */
const DIET_DAY_KEYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

/**
 * Arabic day names for UI display (اليوم الأول, اليوم الثاني, etc.)
 */
const DIET_DAY_NAMES_AR: Record<number, string> = {
    1: "اليوم الأول",
    2: "اليوم الثاني",
    3: "اليوم الثالث",
    4: "اليوم الرابع",
    5: "اليوم الخامس",
    6: "اليوم السادس",
    7: "اليوم السابع",
};

/**
 * English day names for UI display
 */
const DIET_DAY_NAMES_EN: Record<number, string> = {
    1: "Day One",
    2: "Day Two",
    3: "Day Three",
    4: "Day Four",
    5: "Day Five",
    6: "Day Six",
    7: "Day Seven",
};

/**
 * Calculate which day of the diet cycle based on start date
 * Returns { dayNumber: 1-7, dayKey: "saturday"|"sunday"|... }
 */
function calculateDietDay(startDateStr: string, currentDateStr: string): { dayNumber: number; dayKey: string } {
    const startDate = new Date(startDateStr + "T12:00:00");
    const currentDate = new Date(currentDateStr + "T12:00:00");

    // Calculate difference in days
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Handle negative days (before plan started)
    if (diffDays < 0) {
        return { dayNumber: 0, dayKey: "" };
    }

    // Day 1 is the start day, cycles every 7 days
    const dayNumber = (diffDays % 7) + 1; // 1-7
    const dayKey = DIET_DAY_KEYS[dayNumber - 1];

    return { dayNumber, dayKey };
}

// ============ QUERIES ============

/**
 * Get the active meal plan for the authenticated client
 * Returns plan metadata including name, description, tags, and start date
 */
export const getMyActivePlan = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "client") return null;

        // Find active weekly meal plan for this client
        const weeklyPlan = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published")
                )
            )
            .order("desc")
            .first();

        if (!weeklyPlan) return null;

        // Get the diet plan template if linked
        let dietPlan = null;
        if (weeklyPlan.dietPlanId) {
            dietPlan = await ctx.db.get(weeklyPlan.dietPlanId);
        }

        return {
            _id: weeklyPlan._id,
            name: dietPlan?.name ?? "Custom Plan",
            nameAr: dietPlan?.nameAr ?? "خطة مخصصة",
            description: dietPlan?.description,
            descriptionAr: dietPlan?.descriptionAr,
            tags: dietPlan?.tags ?? [],
            emoji: dietPlan?.emoji ?? "🥗",
            startDate: weeklyPlan.weekStartDate,
            endDate: weeklyPlan.planEndDate ?? weeklyPlan.weekEndDate,
            weeklyPlanId: weeklyPlan._id,
            dietPlanId: weeklyPlan.dietPlanId,
            format: dietPlan?.format ?? "general",
        };
    },
});

/**
 * Get meals for a specific date with completion status
 * Returns the active plan info and meals for that day
 * Supports both "general" and "daily" diet formats
 */
export const getDayView = query({
    args: {
        date: v.string(), // YYYY-MM-DD format (client's local timezone)
        dayOffset: v.optional(v.number()), // Optional offset from today for day navigation in daily format
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "client") return null;

        // Find active weekly meal plan for this client
        const weeklyPlan = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published")
                )
            )
            .order("desc")
            .first();

        if (!weeklyPlan) return null;

        // Get the diet plan template
        let dietPlan = null;
        if (weeklyPlan.dietPlanId) {
            dietPlan = await ctx.db.get(weeklyPlan.dietPlanId);
        }

        if (!dietPlan) return null;

        // Get meal completions for this date
        const completions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client_date", (q) =>
                q.eq("clientId", user._id).eq("date", args.date)
            )
            .collect();

        // Create a map of mealId -> completion data
        const completionMap = new Map<string, {
            isCompleted: boolean;
            completedAt?: number;
            selectedOptions: Array<{
                categoryId: string;
                categoryName: string;
                optionId: string;
                optionText: string;
            }>;
        }>();

        for (const completion of completions) {
            completionMap.set(completion.mealId, {
                isCompleted: true,
                completedAt: completion.completedAt,
                selectedOptions: completion.selectedOptions,
            });
        }

        // Check if today
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const isToday = args.date === todayStr;

        // ============ DAILY FORMAT ============
        if (dietPlan.format === "daily" && dietPlan.dailyMeals) {
            // Calculate which day of the diet cycle
            const { dayNumber, dayKey } = calculateDietDay(weeklyPlan.weekStartDate, args.date);

            // Handle date before plan started
            if (dayNumber === 0) {
                return {
                    format: "daily" as const,
                    activePlan: {
                        _id: weeklyPlan._id,
                        name: dietPlan.name,
                        nameAr: dietPlan.nameAr,
                        description: dietPlan.description,
                        descriptionAr: dietPlan.descriptionAr,
                        generalNotes: dietPlan.generalNotes,
                        generalNotesAr: dietPlan.generalNotesAr,
                        startDate: weeklyPlan.weekStartDate,
                    },
                    currentDay: null, // Plan not started yet
                    meals: [],
                    beforePlanStart: true,
                };
            }

            // Get meals for this day from dailyMeals
            const dailyMealsData = dietPlan.dailyMeals as Record<string, {
                dayName?: string;
                dayNameAr?: string;
                meals: Array<{
                    id: string;
                    emoji?: string;
                    name: string;
                    nameAr?: string;
                    note?: string;
                    noteAr?: string;
                    categories: Array<unknown>;
                }>;
            } | undefined>;

            const dayData = dailyMealsData[dayKey];

            // If no meals for this day
            if (!dayData?.meals) {
                return {
                    format: "daily" as const,
                    activePlan: {
                        _id: weeklyPlan._id,
                        name: dietPlan.name,
                        nameAr: dietPlan.nameAr,
                        description: dietPlan.description,
                        descriptionAr: dietPlan.descriptionAr,
                        generalNotes: dietPlan.generalNotes,
                        generalNotesAr: dietPlan.generalNotesAr,
                        startDate: weeklyPlan.weekStartDate,
                    },
                    currentDay: {
                        dayKey,
                        dayNumber,
                        dayName: DIET_DAY_NAMES_EN[dayNumber] || `Day ${dayNumber}`,
                        dayNameAr: dayData?.dayNameAr || DIET_DAY_NAMES_AR[dayNumber] || `اليوم ${dayNumber}`,
                        isToday,
                    },
                    meals: [],
                    noMealsForDay: true,
                };
            }

            // Map meals with completion status for daily format
            const dailyMeals = dayData.meals.map((meal) => {
                // For daily format, mealId is stored as "dayKey-mealId"
                const dailyMealId = `${dayKey}-${meal.id}`;
                const completion = completionMap.get(dailyMealId) || completionMap.get(meal.id);

                return {
                    id: meal.id,
                    dailyId: dailyMealId,
                    emoji: meal.emoji,
                    name: meal.name,
                    nameAr: meal.nameAr,
                    note: meal.note,
                    noteAr: meal.noteAr,
                    isCompleted: completion?.isCompleted ?? false,
                    completedAt: completion?.completedAt,
                };
            });

            return {
                format: "daily" as const,
                activePlan: {
                    _id: weeklyPlan._id,
                    name: dietPlan.name,
                    nameAr: dietPlan.nameAr,
                    description: dietPlan.description,
                    descriptionAr: dietPlan.descriptionAr,
                    generalNotes: dietPlan.generalNotes,
                    generalNotesAr: dietPlan.generalNotesAr,
                    startDate: weeklyPlan.weekStartDate,
                },
                currentDay: {
                    dayKey,
                    dayNumber,
                    dayName: DIET_DAY_NAMES_EN[dayNumber] || `Day ${dayNumber}`,
                    dayNameAr: dayData.dayNameAr || DIET_DAY_NAMES_AR[dayNumber] || `اليوم ${dayNumber}`,
                    isToday,
                },
                meals: dailyMeals,
            };
        }

        // ============ GENERAL FORMAT ============
        // Determine which meals to show
        let mealsToShow: Array<{
            id: string;
            emoji?: string;
            name: string;
            nameAr?: string;
            time?: string;
            note?: string;
            noteAr?: string;
            categories: Array<{
                id: string;
                emoji?: string;
                name: string;
                nameAr?: string;
                options: Array<{
                    id: string;
                    text: string;
                    textEn?: string;
                }>;
            }>;
        }> = [];

        if (dietPlan.meals) {
            // General format - same meals every day
            mealsToShow = dietPlan.meals;
        }

        // Merge meals with completion data and restore selected options
        const mealsWithCompletion = mealsToShow.map((meal) => {
            const completion = completionMap.get(meal.id);

            // If there's a completion, restore selected options to categories
            const categoriesWithSelection = meal.categories.map((category) => {
                const selectedOption = completion?.selectedOptions.find(
                    (so) => so.categoryId === category.id
                );

                return {
                    ...category,
                    options: category.options.map((option) => ({
                        ...option,
                        selected: selectedOption?.optionId === option.id,
                    })),
                    expanded: false,
                };
            });

            return {
                ...meal,
                _id: `${weeklyPlan._id}_${meal.id}_${args.date}`,
                categories: categoriesWithSelection,
                completed: completion?.isCompleted ?? false,
                completedAt: completion?.completedAt,
            };
        });

        return {
            format: "general" as const,
            activePlan: {
                _id: weeklyPlan._id,
                name: dietPlan.name,
                nameAr: dietPlan.nameAr,
                description: dietPlan.description,
                descriptionAr: dietPlan.descriptionAr,
                tags: dietPlan.tags ?? [],
                emoji: dietPlan.emoji ?? "🥗",
                startDate: weeklyPlan.weekStartDate,
            },
            meals: mealsWithCompletion,
        };
    },
});

/**
 * Get meal completion history for a month (for calendar display)
 * Returns a map of date strings to completion counts
 */
export const getMyFullMealHistory = query({
    args: {
        month: v.number(), // 1-12
        year: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "client") return {};

        // Calculate date range for the month
        const startDate = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
        const lastDay = new Date(args.year, args.month, 0).getDate();
        const endDate = `${args.year}-${String(args.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        // Get all completions for this client in this month
        const completions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .collect();

        // Filter to this month and count by date
        const filtered = completions.filter(
            (c) => c.date >= startDate && c.date <= endDate
        );

        // Group by date
        const historyMap: Record<string, { completed: number; total: number }> = {};

        for (const completion of filtered) {
            if (!historyMap[completion.date]) {
                historyMap[completion.date] = { completed: 0, total: 4 }; // Assume 4 meals per day
            }
            historyMap[completion.date].completed++;
        }

        // Get active plan to determine actual meal count per day
        const weeklyPlan = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published")
                )
            )
            .order("desc")
            .first();

        let totalMealsPerDay = 4; // Default

        if (weeklyPlan?.dietPlanId) {
            const dietPlan = await ctx.db.get(weeklyPlan.dietPlanId);
            if (dietPlan?.meals) {
                totalMealsPerDay = dietPlan.meals.length;
            }
        }

        // Update totals
        for (const date of Object.keys(historyMap)) {
            historyMap[date].total = totalMealsPerDay;
        }

        return historyMap;
    },
});

// ============ MUTATIONS ============

/**
 * Save selected option for a meal category
 * This stores the user's meal choice before completion
 */
export const selectMealOption = mutation({
    args: {
        mealId: v.string(),
        categoryId: v.string(),
        optionId: v.string(),
        optionText: v.string(),
        categoryName: v.string(),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Check if there's an existing completion for this meal/date
        const existing = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client_date", (q) =>
                q.eq("clientId", user._id).eq("date", args.date)
            )
            .filter((q) => q.eq(q.field("mealId"), args.mealId))
            .unique();

        if (existing) {
            // Update the selected options
            const newOptions = existing.selectedOptions.filter(
                (o) => o.categoryId !== args.categoryId
            );
            newOptions.push({
                categoryId: args.categoryId,
                categoryName: args.categoryName,
                optionId: args.optionId,
                optionText: args.optionText,
            });

            await ctx.db.patch(existing._id, {
                selectedOptions: newOptions,
            });
            return existing._id;
        }

        // Create a draft/partial completion with just this selection
        const id = await ctx.db.insert("mealCompletions", {
            clientId: user._id,
            mealId: args.mealId,
            date: args.date,
            mealType: args.mealId, // Use mealId as mealType
            selectedOptions: [{
                categoryId: args.categoryId,
                categoryName: args.categoryName,
                optionId: args.optionId,
                optionText: args.optionText,
            }],
            completedAt: 0, // Not completed yet
            createdAt: now,
        });

        return id;
    },
});

/**
 * Request a plan change from the coach
 * Sends a message to the coach via the chat conversation
 */
export const requestPlanChange = mutation({
    args: {
        reason: v.string(),
        message: v.string(),
        mealName: v.optional(v.string()),
        mealNameAr: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Only clients can request changes
        if (user.role !== "client") {
            throw new Error("Only clients can request plan changes");
        }

        // Get the user's assigned chat doctor
        if (!user.assignedChatDoctorId) {
            throw new Error("No doctor assigned. Please contact support.");
        }

        // Check if active conversation already exists with current doctor
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("coachId"), user.assignedChatDoctorId),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        // Create conversation if it doesn't exist
        if (!conversation) {
            const conversationId = await ctx.db.insert("conversations", {
                clientId: user._id,
                coachId: user.assignedChatDoctorId!,
                status: "active",
                lastMessageAt: now,
                unreadByClient: 0,
                unreadByCoach: 1,
                isPinned: false,
                priority: "normal",
                createdAt: now,
            });
            conversation = await ctx.db.get(conversationId);
        }

        if (!conversation) {
            throw new Error("Failed to create conversation");
        }

        // Format the message content
        const reasonLabels: Record<string, { en: string; ar: string }> = {
            dislike: { en: "I don't like these foods", ar: "لا أحب هذه الأطعمة" },
            ingredients: { en: "I can't find these ingredients", ar: "لا أجد هذه المكونات" },
            allergy: { en: "I'm allergic to something", ar: "لدي حساسية من شيء" },
            variety: { en: "I need more variety", ar: "أريد المزيد من التنوع" },
            other: { en: "Other", ar: "أخرى" },
        };

        const reasonLabel = reasonLabels[args.reason] || reasonLabels.other;

        // Build message with meal info if provided
        const mealInfo = args.mealNameAr
            ? `\n🍽️ الوجبة: ${args.mealNameAr}`
            : (args.mealName ? `\n🍽️ الوجبة: ${args.mealName}` : "");

        const messageContent = `🔄 *طلب تغيير النظام الغذائي*${mealInfo}\n\n📋 السبب: ${reasonLabel.ar}\n\n💬 التفاصيل:\n${args.message || "لم يتم إضافة تفاصيل"}`;

        // Send the message
        await ctx.db.insert("messages", {
            conversationId: conversation._id,
            senderId: user._id,
            senderRole: "client",
            content: messageContent,
            messageType: "text",
            isReadByClient: true,
            isReadByCoach: false,
            isEdited: false,
            isDeleted: false,
            createdAt: now,
        });

        // Update conversation
        await ctx.db.patch(conversation._id, {
            lastMessageAt: now,
            lastMessagePreview: `🔄 طلب تغيير النظام الغذائي`,
            unreadByCoach: (conversation.unreadByCoach || 0) + 1,
        });

        return { success: true, conversationId: conversation._id };
    },
});
