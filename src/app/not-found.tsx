import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3">Página no encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        No pudimos encontrar la página que estás buscando. Es posible que haya sido movida o eliminada.
      </p>
      <Link href="/">
        <Button className="rounded-full px-8">
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
