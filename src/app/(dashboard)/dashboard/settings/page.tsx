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
        if (data.url) window.location.assign(data.url)
      } else {
        // Create portal session
        const res = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company.id })
        })
        const data = await res.json()
        if (data.url) window.location.assign(data.url)
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu cuenta y empresa.
        </p>
      </div>

      {/* Profile */}
      <Card className="shadow-apple-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Perfil</CardTitle>
              <CardDescription>Tu información personal.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input
              value={profile?.id ? '' : ''}
              disabled
              placeholder="cargando..."
              className="h-11 rounded-xl bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              El correo no se puede modificar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company */}
      <Card className="shadow-apple-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Empresa</CardTitle>
              <CardDescription>Información de tu negocio.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la empresa</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Industria</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Ej: E-commerce, Restaurante, Consultora..."
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Sitio web</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.miempresa.com"
              className="h-11 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="shadow-apple-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Suscripción</CardTitle>
          <CardDescription>Escala tu negocio con el plan perfecto para ti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {company?.subscription_plan === 'free' || !company?.subscription_plan ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Label className={`text-sm font-medium ${!isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>Mensual</Label>
                <Switch 
                  checked={isAnnualBilling} 
                  onCheckedChange={setIsAnnualBilling}
                  className="data-[state=checked]:bg-primary" 
                />
                <Label className={`text-sm font-medium flex items-center gap-1.5 ${isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Anual
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[10px]">2 MESES GRATIS</Badge>
                </Label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Object.entries(PRICING_PLANS).map(([key, plan]) => {
                  const isPopular = key === 'profesional';
                  const price = isAnnualBilling ? plan.price_annual : plan.price_monthly;
                  const priceId = isAnnualBilling ? plan.stripe_annual_id : plan.stripe_monthly_id;
                  
                  return (
                    <div key={key} className={`p-5 rounded-2xl bg-background flex flex-col relative transition-all duration-200 ${isPopular ? 'border-2 border-primary shadow-lg lg:-translate-y-2' : 'border border-border/50'}`}>
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-blue-500 text-white text-xs font-bold rounded-full shadow-md">
                          RECOMENDADO
                        </div>
                      )}
                      <p className="text-lg font-bold mb-1">{plan.name}</p>
                      <p className="text-3xl font-bold mb-4">${price}<span className="text-sm font-normal text-muted-foreground">/{isAnnualBilling ? 'año' : 'mes'}</span></p>
                      <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleManageBilling(priceId)}
                        disabled={managingBilling}
                        variant={isPopular ? 'default' : 'outline'}
                        className={`w-full rounded-xl ${isPopular ? 'shadow-apple hover:shadow-apple-hover' : 'bg-background hover:bg-muted/50'}`}
                      >
                        {managingBilling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suscribirse'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-muted/50 border border-border/50 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-lg font-bold capitalize">Plan {company.subscription_plan}</p>
                  <Badge variant={company.subscription_status === 'active' ? 'default' : 'destructive'} className="text-xs">
                    {company.subscription_status === 'active' ? 'Activo' : 'Problema de pago'}
                  </Badge>
                </div>
                {company.stripe_current_period_end && company.subscription_status === 'active' && (
                  <p className="text-sm font-medium text-foreground mb-1">
                    Próximo cobro: {new Date(company.stripe_current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Estás suscrito al plan premium. Tu facturación se gestiona de forma segura a través de Stripe.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleManageBilling()}
                disabled={managingBilling}
                className="shrink-0 rounded-xl"
              >
                {managingBilling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Gestionar Facturación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={saveSettings}
        disabled={saving}
        className="rounded-full px-6 gap-2"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Guardado
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar cambios
          </>
        )}
      </Button>
    </div>
  )
}
