'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">
        Ha ocurrido un error
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        No pudimos cargar esta página correctamente. Por favor, intenta de nuevo.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="outline" className="rounded-full px-6">
            Ir al Inicio
          </Button>
        </Link>
        <Button onClick={() => reset()} className="rounded-full px-6">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
