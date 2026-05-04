'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2, CheckCircle2, Building2, User } from 'lucide-react'
import type { Profile, Company } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [managingBilling, setManagingBilling] = useState(false)

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
        </CardHeader>
        <CardContent className="space-y-6">
          {company?.subscription_plan === 'free' || !company?.subscription_plan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-border/50 bg-background flex flex-col">
                <p className="text-lg font-bold mb-1">Plan Básico</p>
                <p className="text-3xl font-bold mb-4">$49<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                  <li>• WhatsApp Automático</li>
                  <li>• 1,000 conversaciones/mes</li>
                  <li>• 1 Agente de IA</li>
                </ul>
                <Button 
                  onClick={() => handleManageBilling(process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID)}
                  disabled={managingBilling}
                  className="w-full rounded-xl"
                >
                  Suscribirse al Básico
                </Button>
              </div>
              <div className="p-5 rounded-2xl border-2 border-foreground bg-background relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground text-background text-xs font-bold rounded-full">
                  Recomendado
                </div>
                <p className="text-lg font-bold mb-1">Plan Pro</p>
                <p className="text-3xl font-bold mb-4">$149<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                  <li>• WhatsApp + Llamadas de Voz</li>
                  <li>• 5,000 conversaciones/mes</li>
                  <li>• Agentes de IA Ilimitados</li>
                  <li>• Insights Avanzados</li>
                </ul>
                <Button 
                  onClick={() => handleManageBilling(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID)}
                  disabled={managingBilling}
                  className="w-full rounded-xl"
                >
                  Suscribirse al Pro
                </Button>
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
