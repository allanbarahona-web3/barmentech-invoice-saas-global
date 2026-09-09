/**
 * Pricing Plans Configuration
 * Single source of truth for all pricing plans
 * All user-facing strings should use i18n t() function
 */

export type PlanId = "trial" | "free" | "starter" | "pro" | "premium";

export interface PlanFeatures {
  // Reminders
  reminders_manual: boolean;
  reminders_scheduled: boolean;
  reminders_automatic: boolean;
  reminders_limit: number; // -1 = unlimited
  reminder_templates_limit: number; // -1 = unlimited
  
  // Other features (existing)
  unlimited_invoices: boolean;
  unlimited_customers: boolean;
  multi_user: boolean;
  api_access: boolean;
  priority_support: boolean;
}

export interface Plan {
  id: PlanId;
  name: string; // i18n key
  monthlyPrice: number | null; // null = free/trial
  currency: string;
  description: string; // i18n key
  features: string[]; // i18n keys
  planFeatures: PlanFeatures; // actual feature flags
  highlighted?: boolean;
  badge?: string; // i18n key - "Popular", "Recommended", etc
  ctaLabel: string; // i18n key
  disabled?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "plans.trial.name",
    monthlyPrice: null,
    currency: "USD",
    description: "plans.trial.description",
    features: [
      "plans.trial.features.duration",
      "plans.trial.features.invoices",
      "plans.trial.features.customers",
      "plans.trial.features.products",
      "plans.trial.features.support",
    ],
    planFeatures: {
      reminders_manual: true,
      reminders_scheduled: false,
      reminders_automatic: false,
      reminders_limit: 10,
      reminder_templates_limit: 3,
      unlimited_invoices: false,
      unlimited_customers: false,
      multi_user: false,
      api_access: false,
      priority_support: false,
    },
    ctaLabel: "plans.trial.cta",
    disabled: true,
  },
  {
    id: "free",
    name: "plans.free.name",
    monthlyPrice: 0,
    currency: "USD",
    description: "plans.free.description",
    features: [
      "plans.free.features.invoices",
      "plans.free.features.customers",
      "plans.free.features.products",
      "plans.free.features.emailSupport",
      "plans.free.features.basicReports",
    ],
    planFeatures: {
      reminders_manual: false,
      reminders_scheduled: false,
      reminders_automatic: false,
      reminders_limit: 0,
      reminder_templates_limit: 0,
      unlimited_invoices: false,
      unlimited_customers: false,
      multi_user: false,
      api_access: false,
      priority_support: false,
    },
    ctaLabel: "plans.free.cta",
    highlighted: false,
  },
  {
    id: "starter",
    name: "plans.starter.name",
    monthlyPrice: 29,
    currency: "USD",
    description: "plans.starter.description",
    features: [
      "plans.starter.features.unlimitedInvoices",
      "plans.starter.features.unlimitedCustomers",
      "plans.starter.features.unlimitedProducts",
      "plans.starter.features.emailSupport",
      "plans.starter.features.exportPdf",
      "plans.starter.features.branding",
      "plans.starter.features.manualReminders", // New
    ],
    planFeatures: {
      reminders_manual: true,
      reminders_scheduled: false,
      reminders_automatic: false,
      reminders_limit: 50, // 50 reminders/month
      reminder_templates_limit: 5,
      unlimited_invoices: true,
      unlimited_customers: true,
      multi_user: false,
      api_access: false,
      priority_support: false,
    },
    ctaLabel: "plans.starter.cta",
    highlighted: false,
  },
  {
    id: "pro",
    name: "plans.pro.name",
    monthlyPrice: 79,
    currency: "USD",
    description: "plans.pro.description",
    features: [
      "plans.pro.features.everything",
      "plans.pro.features.multiUser",
      "plans.pro.features.api",
      "plans.pro.features.prioritySupport",
      "plans.pro.features.customReports",
      "plans.pro.features.whiteLabel",
      "plans.pro.features.scheduledReminders", // New
      "plans.pro.features.autoReminders", // New
      "plans.pro.features.unlimitedReminders", // New
    ],
    planFeatures: {
      reminders_manual: true,
      reminders_scheduled: true, // 🔓 Pro feature
      reminders_automatic: true, // 🔓 Pro feature (for now)
      reminders_limit: -1, // unlimited
      reminder_templates_limit: -1, // unlimited
      unlimited_invoices: true,
      unlimited_customers: true,
      multi_user: true,
      api_access: true,
      priority_support: true,
    },
    badge: "plans.pro.badge",
    ctaLabel: "plans.pro.cta",
    highlighted: true,
  },
  {
    id: "premium",
    name: "plans.premium.name",
    monthlyPrice: 149,
    currency: "USD",
    description: "plans.premium.description",
    features: [
      "plans.premium.features.everything",
      "plans.premium.features.unlimitedUsers",
      "plans.premium.features.dedicatedSupport",
      "plans.premium.features.customIntegrations",
      "plans.premium.features.advancedAnalytics",
      "plans.premium.features.sla",
      "plans.premium.features.customBranding",
    ],
    planFeatures: {
      reminders_manual: true,
      reminders_scheduled: true,
      reminders_automatic: true,
      reminders_limit: -1,
      reminder_templates_limit: -1,
      unlimited_invoices: true,
      unlimited_customers: true,
      multi_user: true,
      api_access: true,
      priority_support: true,
    },
    badge: "plans.premium.badge",
    ctaLabel: "plans.premium.cta",
    highlighted: false,
  },
];

export function getPlanById(id: PlanId): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getActivePlans(): Plan[] {
  return PLANS.filter((plan) => plan.id !== "trial");
}
