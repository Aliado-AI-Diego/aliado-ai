'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, CheckCircle2, Building2, User } from 'lucide-react'
import type { Profile, Company } from '@/types'
import { PRICING_PLANS } from '@/config/pricing'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [managingBilling, setManagingBilling] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(true)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setFullName(profileData.full_name || '')
    }

    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)

    if (companies && companies.length > 0) {
      setCompany(companies[0])
      setCompanyName(companies[0].company_name)
      setIndustry(companies[0].industry || '')
      setWebsiteUrl(companies[0].website_url || '')
    }

    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update profile
    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    // Update company
    if (company) {
      await supabase
        .from('companies')
        .update({
          company_name: companyName,
          industry,
          website_url: websiteUrl || null,
        })
        .eq('id', company.id)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function handleManageBilling(priceId?: string) {
    if (!company) return
    setManagingBilling(true)
    
    try {
      const plan = company.subscription_plan || 'free'
      
      if (plan === 'free' && priceId) {
        // Create checkout session
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, companyId: company.id })
        })
        
        if (!res.ok) {
          throw new Error(await res.text())
        }
        
        const data = await res.json()
        if (data.url) window.location.href = data.url
      } else {
        // Create portal session
        const res = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company.id })
        })
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    } finally {
      setManagingBilling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-heading font-bold tracking-tight">Configuración</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Administra tu cuenta y empresa.
        </p>
      </div>

      {/* Profile */}
      <Card className="shadow-command border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-[13px] font-semibold">Perfil</CardTitle>
              <CardDescription className="text-[11px]">Tu información personal.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Correo electrónico</Label>
            <Input
              value={profile?.id ? '' : ''}
              disabled
              placeholder="cargando..."
              className="h-9 text-[13px] bg-muted/50"
            />
            <p className="text-[10px] text-muted-foreground">
              El correo no se puede modificar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company */}
      <Card className="shadow-command border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-muted flex items-center justify-center">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-[13px] font-semibold">Empresa</CardTitle>
              <CardDescription className="text-[11px]">Información de tu negocio.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre de la empresa</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Industria</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Ej: E-commerce, Restaurante, Consultora..."
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sitio web</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.miempresa.com"
              className="h-9 text-[13px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="shadow-command border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/40">
          <CardTitle className="text-[13px] font-semibold">Suscripción</CardTitle>
          <CardDescription className="text-[11px]">Escala tu negocio con el plan correcto.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          {company?.subscription_plan === 'free' || !company?.subscription_plan ? (
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-2.5">
                <Label className={`text-[12px] font-semibold ${!isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>Mensual</Label>
                <Switch 
                  checked={isAnnualBilling} 
                  onCheckedChange={setIsAnnualBilling}
                  className="data-[state=checked]:bg-primary" 
                />
                <Label className={`text-[12px] font-semibold flex items-center gap-1.5 ${isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Anual
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[9px] font-bold uppercase tracking-wider">2 Meses Gratis</Badge>
                </Label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {Object.entries(PRICING_PLANS).map(([key, plan]) => {
                  const isPopular = key === 'profesional';
                  const price = isAnnualBilling ? plan.price_annual : plan.price_monthly;
                  const priceId = isAnnualBilling ? plan.stripe_annual_id : plan.stripe_monthly_id;
                  
                  return (
                    <div key={key} className={`p-4 bg-background flex flex-col relative transition-all duration-150 ${isPopular ? 'border-2 border-primary shadow-command-md' : 'border border-border hover:border-primary/30'}`}>
                      {isPopular && (
                        <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">
                          Recomendado
                        </div>
                      )}
                      <p className="text-sm font-bold mb-0.5">{plan.name}</p>
                      <p className="text-2xl font-bold mb-3 tabular-nums">${price}<span className="text-[11px] font-normal text-muted-foreground">/{isAnnualBilling ? 'año' : 'mes'}</span></p>
                      <ul className="text-[12px] text-muted-foreground space-y-1.5 mb-4 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex gap-1.5 items-start">
                            <span className="text-primary mt-0.5 text-[10px]">■</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleManageBilling(priceId)}
                        disabled={managingBilling}
                        variant={isPopular ? 'default' : 'outline'}
                        size="sm"
                        className={`w-full h-8 text-[12px] font-semibold ${isPopular ? 'shadow-command' : ''}`}
                      >
                        {managingBilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Suscribirse'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/40 border border-border gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold capitalize">Plan {company.subscription_plan}</p>
                  <Badge variant={company.subscription_status === 'active' ? 'default' : 'destructive'} className="text-[9px] font-bold uppercase tracking-wider">
                    {company.subscription_status === 'active' ? 'Activo' : 'Problema de pago'}
                  </Badge>
                </div>
                {company.stripe_current_period_end && company.subscription_status === 'active' && (
                  <p className="text-[12px] font-medium text-foreground mb-0.5">
                    Próximo cobro: {new Date(company.stripe_current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Facturación gestionada de forma segura a través de Stripe.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleManageBilling()}
                disabled={managingBilling}
                size="sm"
                className="shrink-0 h-8 text-[12px] font-semibold"
              >
                {managingBilling ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Gestionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={saveSettings}
        disabled={saving}
        size="sm"
        className="shadow-command h-8 text-[13px] font-semibold gap-1.5"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : saved ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Guardado
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            Guardar cambios
          </>
        )}
      </Button>
    </div>
  )
}
