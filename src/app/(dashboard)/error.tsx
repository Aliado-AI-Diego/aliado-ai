'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error Boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-8 text-center rounded-2xl border border-border bg-card/50 shadow-sm animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2 text-foreground">
        Error al cargar la sección
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">
        Ocurrió un problema al intentar cargar esta parte del panel. Por favor, intenta de nuevo.
      </p>
      <Button 
        onClick={() => reset()} 
        className="rounded-full px-6 gap-2"
        variant="default"
      >
        <RefreshCcw className="w-4 h-4" />
        Reintentar
      </Button>
    </div>
  )
}
