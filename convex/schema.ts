import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ============ CALENDAR EVENTS (for doctor calls) ============
    calendarEvents: defineTable({
        coachId: v.id("users"),
        clientId: v.id("users"),
        type: v.literal("call"), // Only phone calls for now
        reason: v.string(), // Required - why is this call scheduled
        notes: v.optional(v.string()),
        date: v.string(), // ISO date "2025-12-21"
        startTime: v.string(), // "10:00"
        endTime: v.string(), // "10:30"
        startAt: v.number(), // Unix timestamp for sorting
        endAt: v.number(), // Unix timestamp
        status: v.union(
            v.literal("scheduled"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("no_show")
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_coach", ["coachId"])
        .index("by_coach_date", ["coachId", "date"])
        .index("by_client", ["clientId"])
        .index("by_status", ["status"]),

    // ============ USER MANAGEMENT ============
    users: defineTable({
        clerkId: v.string(),
        role: v.union(
            v.literal("client"),
            v.literal("coach"),
            v.literal("admin")
        ),
        firstName: v.string(),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        gender: v.union(v.literal("male"), v.literal("female")),
        dateOfBirth: v.optional(v.string()),
        height: v.optional(v.number()),
        activityLevel: v.optional(v.string()),
        currentWeight: v.number(),
        targetWeight: v.number(),
        startingWeight: v.number(),
        goal: v.union(
            v.literal("weight_loss"),
            v.literal("maintain"),
            v.literal("gain_muscle")
        ),
        // Assigned doctor - simple enum-like field for easy identification
        assignedDoctor: v.optional(v.union(
            v.literal("gehad"),
            v.literal("mostafa"),
            v.literal("none")
        )),
        assignedCoachId: v.optional(v.id("users")), // Reference to diet/workout coach
        assignedChatDoctorId: v.optional(v.id("users")), // Reference to chat consultation doctor (may differ from coach)
        subscriptionStatus: v.union(
            v.literal("active"),
            v.literal("paused"),
            v.literal("cancelled"),
            v.literal("trial")
        ),
        subscriptionEndDate: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        preferredLanguage: v.union(v.literal("ar"), v.literal("en")),
        preferredUnits: v.union(v.literal("metric"), v.literal("imperial")),
        // Regional settings
        regionalSettings: v.optional(v.object({
            dateFormat: v.optional(v.union(
                v.literal("MM/DD/YYYY"),
                v.literal("DD/MM/YYYY"),
                v.literal("YYYY-MM-DD")
            )),
            timeFormat: v.optional(v.union(v.literal("12h"), v.literal("24h"))),
            timezone: v.optional(v.string()),
            autoDetectTimezone: v.optional(v.boolean()),
            firstDayOfWeek: v.optional(v.union(
                v.literal("saturday"),
                v.literal("sunday"),
                v.literal("monday")
            )),
        })),
        // Making fields optional for backwards compatibility with existing users
        // The getNotificationSettings query provides safe defaults
        notificationSettings: v.optional(v.object({
            pushEnabled: v.optional(v.boolean()),
            newMessages: v.optional(v.boolean()),
            appointments: v.optional(v.boolean()),
            // Legacy fields from old schema (will be ignored)
            mealReminders: v.optional(v.boolean()),
            weeklyCheckin: v.optional(v.boolean()),
            coachMessages: v.optional(v.boolean()),
            motivational: v.optional(v.boolean()),
            quietHoursStart: v.optional(v.string()),
            quietHoursEnd: v.optional(v.string()),
        })),
        // Coach notes for this client (private to coach)
        coachNotes: v.optional(v.string()),
        coachNotesUpdatedAt: v.optional(v.number()),
        // Push notification token (Expo Push Token)
        expoPushToken: v.optional(v.string()),
        isActive: v.boolean(),
        lastActiveAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_role", ["role"])
        .index("by_assigned_coach", ["assignedCoachId"])
        .index("by_assigned_chat_doctor", ["assignedChatDoctorId"])
        .index("by_subscription_status", ["subscriptionStatus"]),

    // ============ CLIENT NOTES (Coach notes history) ============
    clientNotes: defineTable({
        clientId: v.id("users"),
        coachId: v.id("users"),
        content: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_client", ["clientId"])
        .index("by_coach", ["coachId"]),

    // ============ MEAL COMPLETIONS (Daily tracking) ============
    mealCompletions: defineTable({
        clientId: v.id("users"),
        mealId: v.string(), // Local meal ID from app (breakfast, lunch, etc.)
        date: v.string(), // ISO date "2025-12-09"
        mealType: v.string(), // breakfast, lunch, dinner, snack
        selectedOptions: v.array(
            v.object({
                categoryId: v.string(),
                categoryName: v.string(),
                optionId: v.string(),
                optionText: v.string(),
            })
        ),
        completedAt: v.number(),
        createdAt: v.number(),
    })
        .index("by_client", ["clientId"])
        .index("by_client_date", ["clientId", "date"])
        .index("by_date", ["date"]),

    // ============ COACH/DOCTOR PROFILES ============
    coachProfiles: defineTable({
        userId: v.id("users"),
        specialization: v.optional(v.string()),
        bio: v.optional(v.string()),
        qualifications: v.optional(v.array(v.string())),
        maxClients: v.number(),
        currentClientCount: v.number(),
        averageResponseTime: v.optional(v.string()),
        isAcceptingClients: v.boolean(),
        // New format: per-day availability with times as minutes since midnight
        // Example: sunday: { enabled: true, from: 540, to: 1080 } = 9:00 AM - 6:00 PM
        workingHours: v.optional(
            v.object({
                timezone: v.string(),
                days: v.object({
                    sunday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    monday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    tuesday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    wednesday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    thursday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    friday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                    saturday: v.object({ enabled: v.boolean(), from: v.number(), to: v.number() }),
                }),
            })
        ),
    }).index("by_user", ["userId"]),

    // ============ WEEKLY MEAL PLANS ============
    weeklyMealPlans: defineTable({
        clientId: v.id("users"),
        coachId: v.id("users"),
        dietPlanId: v.optional(v.id("dietPlans")), // The diet plan template this is based on
        weekStartDate: v.string(), // ISO date string (e.g., "2025-12-08")
        weekEndDate: v.string(),
        weekNumber: v.number(), // Week of the year
        year: v.number(),
        status: v.union(
            v.literal("draft"),
            v.literal("published"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        ),
        notes: v.optional(v.string()), // Coach notes for this week
        totalCalories: v.optional(v.number()), // Optional weekly target
        specialInstructions: v.optional(v.string()),
        isTemplate: v.boolean(), // Can be reused as template
        templateName: v.optional(v.string()),
        durationWeeks: v.optional(v.number()), // Plan duration in weeks (null = ongoing)
        planEndDate: v.optional(v.string()), // Calculated end date based on duration
        publishedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_client", ["clientId"])
        .index("by_coach", ["coachId"])
        .index("by_client_week", ["clientId", "year", "weekNumber"])
        .index("by_status", ["status"])
        .index("by_template", ["isTemplate", "coachId"])
        .index("by_diet_plan", ["dietPlanId"]),

    // ============ DAILY MEALS ============
    meals: defineTable({
        weeklyPlanId: v.id("weeklyMealPlans"),
        clientId: v.id("users"),
        coachId: v.id("users"),
        date: v.string(), // ISO date string
        dayOfWeek: v.number(), // 0-6
        mealType: v.union(
            v.literal("breakfast"),
            v.literal("lunch"),
            v.literal("dinner"),
            v.literal("snack_morning"),
            v.literal("snack_afternoon"),
            v.literal("snack_evening")
        ),
        scheduledTime: v.string(), // "08:00"
        title: v.string(),
        titleAr: v.optional(v.string()), // Arabic title
        description: v.optional(v.string()),
        descriptionAr: v.optional(v.string()),
        ingredients: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    quantity: v.string(),
                    unit: v.string(),
                })
            )
        ),
        preparationSteps: v.optional(v.array(v.string())),
        imageUrl: v.optional(v.string()),
        tags: v.array(v.string()), // ["high-protein", "quick-prep", "egyptian"]
        nutritionInfo: v.optional(
            v.object({
                calories: v.number(),
                protein: v.number(),
                carbs: v.number(),
                fat: v.number(),
                fiber: v.optional(v.number()),
            })
        ),
        alternatives: v.optional(
            v.array(
                v.object({
                    title: v.string(),
                    titleAr: v.optional(v.string()),
                    description: v.optional(v.string()),
                })
            )
        ),
        // Client interaction
        isCompleted: v.boolean(),
        completedAt: v.optional(v.number()),
        isFavorite: v.boolean(),
        clientFeedback: v.optional(
            v.union(
                v.literal("loved"),
                v.literal("liked"),
                v.literal("neutral"),
                v.literal("disliked")
            )
        ),
        clientNote: v.optional(v.string()),
        // Tracking
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_client_date", ["clientId", "date"])
        .index("by_weekly_plan", ["weeklyPlanId"])
        .index("by_coach", ["coachId"])
        .index("by_client_meal_type", ["clientId", "mealType"]),

    // ============ MEAL TEMPLATES (Reusable) ============
    mealTemplates: defineTable({
        coachId: v.id("users"),
        title: v.string(),
        titleAr: v.optional(v.string()),
        description: v.optional(v.string()),
        descriptionAr: v.optional(v.string()),
        mealType: v.union(
            v.literal("breakfast"),
            v.literal("lunch"),
            v.literal("dinner"),
            v.literal("snack")
        ),
        ingredients: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    quantity: v.string(),
                    unit: v.string(),
                })
            )
        ),
        imageUrl: v.optional(v.string()),
        tags: v.array(v.string()),
        nutritionInfo: v.optional(
            v.object({
                calories: v.number(),
                protein: v.number(),
                carbs: v.number(),
                fat: v.number(),
            })
        ),
        isGlobal: v.boolean(), // Available to all coaches
        usageCount: v.number(),
        createdAt: v.number(),
    })
        .index("by_coach", ["coachId"])
        .index("by_meal_type", ["mealType"])
        .index("by_global", ["isGlobal"]),


    // ============ DIET PLANS (Full diet templates with all meals) ============
    // ============ DIET PLANS ============
    dietPlans: defineTable({
        // ===== BASIC INFO =====
        name: v.string(),
        nameAr: v.optional(v.string()),
        description: v.optional(v.string()),
        descriptionAr: v.optional(v.string()),
        emoji: v.optional(v.string()),
        imageUrl: v.optional(v.string()),

        // ===== CATEGORIZATION =====
        type: v.union(
            v.literal("keto"),
            v.literal("weekly"),
            v.literal("classic"),
            v.literal("low_carb"),
            v.literal("high_protein"),
            v.literal("intermittent_fasting"),
            v.literal("vegetarian"),
            v.literal("maintenance"),
            v.literal("muscle_gain"),
            v.literal("medical"),
            v.literal("custom")
        ),
        tags: v.optional(v.array(v.string())),

        // ===== TARGET =====
        targetGoal: v.optional(v.union(
            v.literal("weight_loss"),
            v.literal("maintain"),
            v.literal("gain_muscle")
        )),
        targetCalories: v.optional(v.number()),
        difficulty: v.optional(v.union(
            v.literal("easy"),
            v.literal("medium"),
            v.literal("hard")
        )),

        // ===== DIET FORMAT =====
        format: v.union(
            v.literal("general"),  // Same meals every day
            v.literal("daily")     // Different meals per day
        ),

        // ===== MEALS (For "general" format) =====
        // Array of meals - same structure every day
        meals: v.optional(v.array(v.object({
            id: v.string(),
            emoji: v.optional(v.string()),
            name: v.string(),
            nameAr: v.optional(v.string()),
            time: v.optional(v.string()),
            note: v.optional(v.string()),
            noteAr: v.optional(v.string()),
            categories: v.array(v.object({
                id: v.string(),
                emoji: v.optional(v.string()),
                name: v.string(),
                nameAr: v.optional(v.string()),
                options: v.array(v.object({
                    id: v.string(),
                    text: v.string(),
                    textEn: v.optional(v.string()),
                })),
            })),
        }))),

        // ===== DAILY MEALS (For "daily" format) =====
        // Different meals for each day of the week
        dailyMeals: v.optional(v.object({
            saturday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            sunday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            monday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            tuesday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            wednesday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            thursday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
            friday: v.optional(v.object({
                dayName: v.optional(v.string()),
                dayNameAr: v.optional(v.string()),
                meals: v.array(v.object({
                    id: v.string(),
                    emoji: v.optional(v.string()),
                    name: v.string(),
                    nameAr: v.optional(v.string()),
                    time: v.optional(v.string()),
                    note: v.optional(v.string()),
                    noteAr: v.optional(v.string()),
                    categories: v.array(v.object({
                        id: v.string(),
                        emoji: v.optional(v.string()),
                        name: v.string(),
                        nameAr: v.optional(v.string()),
                        options: v.array(v.object({
                            id: v.string(),
                            text: v.string(),
                            textEn: v.optional(v.string()),
                        })),
                    })),
                })),
            })),
        })),

        // ===== GENERAL NOTES =====
        generalNotes: v.optional(v.string()),
        generalNotesAr: v.optional(v.string()),

        // ===== STATUS =====
        isTemplate: v.optional(v.boolean()),
        isActive: v.boolean(),
        usageCount: v.number(),
        sortOrder: v.optional(v.number()),

        // ===== TIMESTAMPS =====
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_format", ["format"])
        .index("by_active", ["isActive"])
        .index("by_type_active", ["type", "isActive"]),

    // ============ CONVERSATIONS & MESSAGES ============
    conversations: defineTable({
        clientId: v.id("users"),
        coachId: v.id("users"),
        status: v.union(
            v.literal("active"),
            v.literal("archived"),
            v.literal("blocked")
        ),
        lastMessageAt: v.number(),
        lastMessagePreview: v.optional(v.string()),
        unreadByClient: v.number(),
        unreadByCoach: v.number(),
        // Priority flags for coaches
        isPinned: v.boolean(),
        priority: v.union(
            v.literal("normal"),
            v.literal("high"),
            v.literal("urgent")
        ),
        tags: v.optional(v.array(v.string())), // ["needs-attention", "new-client"]
        createdAt: v.number(),
    })
        .index("by_client", ["clientId"])
        .index("by_coach", ["coachId"])
        .index("by_coach_priority", ["coachId", "priority"])
        .index("by_coach_pinned", ["coachId", "isPinned"])
        .index("by_last_message", ["coachId", "lastMessageAt"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        senderRole: v.union(
            v.literal("client"),
            v.literal("coach"),
            v.literal("admin")
        ),
        content: v.string(),
        messageType: v.union(
            v.literal("text"),
            v.literal("image"),
            v.literal("voice"),
            v.literal("meal_plan"), // Shared meal plan
            v.literal("weight_update"), // Auto-generated weight log
            v.literal("quick_action"),
            v.literal("system") // System notifications
        ),
        mediaUrl: v.optional(v.string()),
        mediaDuration: v.optional(v.number()), // For voice messages
        metadata: v.optional(v.any()), // Flexible metadata
        // Read receipts
        isReadByClient: v.boolean(),
        isReadByCoach: v.boolean(),
        readAt: v.optional(v.number()),
        // Message actions
        isEdited: v.boolean(),
        editedAt: v.optional(v.number()),
        isDeleted: v.boolean(),
        deletedAt: v.optional(v.number()),
        // Reactions (optional)
        reactions: v.optional(
            v.array(
                v.object({
                    userId: v.id("users"),
                    emoji: v.string(),
                })
            )
        ),
        createdAt: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_time", ["conversationId", "createdAt"])
        .index("by_sender", ["senderId"]),

    // ============ WEIGHT & PROGRESS LOGS ============
    weightLogs: defineTable({
        clientId: v.id("users"),
        weight: v.number(),
        unit: v.union(v.literal("kg"), v.literal("lbs")),
        date: v.string(),
        weekNumber: v.number(),
        year: v.number(),
        feeling: v.optional(
            v.union(
                v.literal("very_hard"),
                v.literal("challenging"),
                v.literal("good"),
                v.literal("great"),
                v.literal("excellent")
            )
        ),
        note: v.optional(v.string()),
        photoStorageId: v.optional(v.id("_storage")),
        photoUrl: v.optional(v.string()),
        // Coach visibility
        isReviewedByCoach: v.boolean(),
        coachNote: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_client", ["clientId"])
        .index("by_client_date", ["clientId", "date"])
        .index("by_client_week", ["clientId", "year", "weekNumber"]),

    // ============ ADMIN AUDIT LOGS ============
    auditLogs: defineTable({
        actorId: v.id("users"),
        actorRole: v.string(),
        action: v.string(), // "create_meal_plan", "send_message", "view_client"
        targetType: v.string(), // "user", "meal_plan", "conversation"
        targetId: v.string(),
        metadata: v.optional(v.any()),
        ipAddress: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_actor", ["actorId"])
        .index("by_action", ["action"])
        .index("by_target", ["targetType", "targetId"]),

    // ============ NOTIFICATIONS ============
    notifications: defineTable({
        userId: v.id("users"), // The user who receives the notification
        type: v.string(), // "meal_plan", "message", "reminder", etc.
        title: v.string(),
        titleAr: v.optional(v.string()),
        message: v.string(),
        messageAr: v.optional(v.string()),
        isRead: v.boolean(),
        relatedId: v.optional(v.string()), // ID of related entity (plan, message, etc.)
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_unread", ["userId", "isRead"])
        .index("by_type", ["type"]),
});
