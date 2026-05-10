'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-xl font-heading font-bold tracking-tight mb-1">Bienvenido de vuelta</h1>
        <p className="text-[13px] text-muted-foreground">
          Ingresa a tu cuenta para continuar.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
              Iniciar sesión
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[12px] text-muted-foreground mt-5">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-foreground font-semibold hover:text-primary transition-colors">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
