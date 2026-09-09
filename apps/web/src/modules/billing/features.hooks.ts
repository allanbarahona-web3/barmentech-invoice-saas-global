import { useTrial } from "./trial.hooks";
import { PLANS, PlanId, PlanFeatures } from "./plans";

/**
 * Hook to check if a specific feature is available in the current plan
 */
export function usePlanFeatures() {
  // Por ahora todos están en trial. En el futuro esto vendrá del backend
  const { data: trial } = useTrial();
  const currentPlanId: PlanId = "trial"; // TODO: integrar con suscripción del backend
  
  const plan = PLANS.find(p => p.id === currentPlanId);
  const features: PlanFeatures = plan?.planFeatures || PLANS[0].planFeatures;
  
  /**
   * Check if a feature is available
   */
  const hasFeature = (featureKey: keyof PlanFeatures): boolean => {
    if (!features) return false;
    return Boolean(features[featureKey]);
  };
  
  /**
   * Get reminder limit for current plan
   */
  const getReminderLimit = (): number => {
    return features?.reminders_limit || 0;
  };
  
  /**
   * Get template limit for current plan
   */
  const getTemplateLimit = (): number => {
    return features?.reminder_templates_limit || 0;
  };
  
  /**
   * Check if limit is unlimited (-1)
   */
  const isUnlimited = (limit: number): boolean => {
    return limit === -1;
  };
  
  return {
    hasFeature,
    getReminderLimit,
    getTemplateLimit,
    isUnlimited,
    currentPlan: currentPlanId || "trial",
    features: features || PLANS[0].planFeatures,
  };
}

/**
 * Get plan that has a specific feature
 */
export function getPlanWithFeature(featureKey: string): PlanId | null {
  const plan = PLANS.find(p => {
    const features = p.planFeatures as any;
    return features[featureKey] === true;
  });
  
  return plan?.id || null;
}
