'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      setError(authError.message === 'User already registered' 
        ? 'Este correo ya está registrado.' 
        : 'Error al crear la cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // 2. Create company
    let newAgentId = null;

    if (authData.user) {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: authData.user.id,
          company_name: companyName,
        })
        .select()
        .single()

      if (companyError) {
        console.error('Error creating company:', companyError)
      } else if (newCompany) {
        // 3. Create default agent
        const defaultPrompt = 'Eres un agente de servicio al cliente profesional y eficiente. Ofrece respuestas claras, directas y bien estructuradas. Equilibra formalidad con amabilidad.'
        const { data: newAgent, error: agentError } = await supabase
          .from('agents')
          .insert({
            company_id: newCompany.id,
            agent_name: `IA de ${companyName}`,
            tone: 'profesional',
            system_prompt: defaultPrompt,
          })
          .select()
          .single()

        if (!agentError && newAgent) {
          newAgentId = newAgent.id
        }
      }
    }

    if (newAgentId) {
      router.push(`/dashboard/agents/${newAgentId}`)
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-xl font-heading font-bold tracking-tight mb-1">Crea tu cuenta</h1>
        <p className="text-[13px] text-muted-foreground">
          Configura tu agente de IA en minutos.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nombre completo
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Juan García"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-10 text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nombre de tu empresa
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Mi Empresa SA"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="h-10 text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-10 text-[13px]"
          />
        </div>

        {error && (
          <p className="text-[12px] text-destructive text-center font-medium">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-10 font-semibold text-[13px]"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Crear cuenta
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[12px] text-muted-foreground mt-5">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-foreground font-semibold hover:text-primary transition-colors">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
