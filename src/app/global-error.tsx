'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
            Algo salió mal
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo técnico ha sido notificado.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="rounded-full px-6"
            >
              Volver al inicio
            </Button>
            <Button
              onClick={() => reset()}
              className="rounded-full px-6"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
