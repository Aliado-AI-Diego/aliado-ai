export type PlanType = 'free' | 'basic' | 'pro' | string | null

export const PlanLimits = {
  free: {
    maxAgents: 1,
    canUseWhatsApp: false,
    canUseVoice: false,
  },
  basic: {
    maxAgents: 1,
    canUseWhatsApp: true,
    canUseVoice: false,
  },
  pro: {
    maxAgents: Infinity,
    canUseWhatsApp: true,
    canUseVoice: true,
  }
}

function getLimits(plan: PlanType) {
  // If no plan, assume free
  const planKey = (plan === 'free' || plan === 'basic' || plan === 'pro') ? plan : 'free'
  return PlanLimits[planKey]
}

export function canCreateAgent(plan: PlanType, currentAgentCount: number): boolean {
  const limits = getLimits(plan)
  return currentAgentCount < limits.maxAgents
}

export function canUseWhatsApp(plan: PlanType): boolean {
  return getLimits(plan).canUseWhatsApp
}

export function canUseVoice(plan: PlanType): boolean {
  return getLimits(plan).canUseVoice
}
