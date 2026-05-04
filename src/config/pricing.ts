export const PRICING_PLANS = {
  esencial: {
    name: 'Esencial',
    price_monthly: 99,
    price_annual: 990,
    stripe_monthly_id: 'price_1TTTv7JSHsi4pkxRlyY6QqoM',
    stripe_annual_id: 'price_1TTTvrJSHsi4pkxRMfngmPlH',
    features: [
      '1 Agente de IA configurado',
      'WhatsApp Business 24/7',
      'Conocimiento: hasta 50 documentos',
      '2,000 conversaciones/mes',
      'Dashboard básico',
      'Soporte por correo'
    ]
  },
  profesional: {
    name: 'Profesional',
    price_monthly: 199,
    price_annual: 1990,
    stripe_monthly_id: 'price_1TTTwRJSHsi4pkxR0Tu3Vg8o',
    stripe_annual_id: 'price_1TTTxJJSHsi4pkxRuBYwmTS0',
    features: [
      '3 Agentes de IA distintos',
      'WhatsApp, Instagram, Messenger y Widget',
      'Recepcionista de Voz IA (500 min)',
      'Conocimiento: hasta 300 documentos',
      '8,000 conversaciones/mes',
      'Insights de IA en reportes'
    ]
  },
  empresarial: {
    name: 'Empresarial',
    price_monthly: 349,
    price_annual: 3490,
    stripe_monthly_id: 'price_1TTTxkJSHsi4pkxROEn6lDY1',
    stripe_annual_id: 'price_1TTTygJSHsi4pkxRvmGfrUJ4',
    features: [
      'Agentes IA Ilimitados',
      'Recepcionista de Voz Ilimitada',
      'Conocimiento Ilimitado',
      '25,000 conversaciones/mes',
      'Acceso API y Webhooks',
      'SLA 99.9% + Manager de cuenta'
    ]
  }
}

export function getPlanIdByStripePriceId(priceId: string): string {
  if (priceId === PRICING_PLANS.esencial.stripe_monthly_id || priceId === PRICING_PLANS.esencial.stripe_annual_id) {
    return 'esencial'
  }
  if (priceId === PRICING_PLANS.profesional.stripe_monthly_id || priceId === PRICING_PLANS.profesional.stripe_annual_id) {
    return 'profesional'
  }
  if (priceId === PRICING_PLANS.empresarial.stripe_monthly_id || priceId === PRICING_PLANS.empresarial.stripe_annual_id) {
    return 'empresarial'
  }
  return 'free'
}
