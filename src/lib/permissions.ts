export type PlanType = 'free' | 'esencial' | 'profesional' | 'empresarial' | string | null

export const PlanLimits: Record<string, { maxAgents: number, canUseWhatsApp: boolean, canUseVoice: boolean, maxKnowledgeDocs: number }> = {
  free: {
    maxAgents: 1,
    canUseWhatsApp: false,
    canUseVoice: false,
    maxKnowledgeDocs: 5,
  },
  esencial: {
    maxAgents: 1,
    canUseWhatsApp: true,
    canUseVoice: false,
    maxKnowledgeDocs: 50,
  },
  profesional: {
    maxAgents: 3,
    canUseWhatsApp: true,
    canUseVoice: true,
    maxKnowledgeDocs: 300,
  },
  empresarial: {
    maxAgents: Infinity,
    canUseWhatsApp: true,
    canUseVoice: true,
    maxKnowledgeDocs: Infinity,
  }
}

function getLimits(plan: PlanType) {
  // If no plan, assume free
  const planKey = plan && PlanLimits[plan] ? plan : 'free'
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
