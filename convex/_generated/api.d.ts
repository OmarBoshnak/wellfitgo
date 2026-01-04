/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as attention from "../attention.js";
import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as chat from "../chat.js";
import type * as clientProfile from "../clientProfile.js";
import type * as clients from "../clients.js";
import type * as coachProfiles from "../coachProfiles.js";
import type * as doctorPlans from "../doctorPlans.js";
import type * as mealCompletions from "../mealCompletions.js";
import type * as meals from "../meals.js";
import type * as plans from "../plans.js";
import type * as recentActivity from "../recentActivity.js";
import type * as users from "../users.js";
import type * as weeklyActivity from "../weeklyActivity.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attention: typeof attention;
  auth: typeof auth;
  calendar: typeof calendar;
  chat: typeof chat;
  clientProfile: typeof clientProfile;
  clients: typeof clients;
  coachProfiles: typeof coachProfiles;
  doctorPlans: typeof doctorPlans;
  mealCompletions: typeof mealCompletions;
  meals: typeof meals;
  plans: typeof plans;
  recentActivity: typeof recentActivity;
  users: typeof users;
  weeklyActivity: typeof weeklyActivity;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
