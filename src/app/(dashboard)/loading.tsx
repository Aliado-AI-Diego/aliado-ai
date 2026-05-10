import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] w-full">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Cargando...
      </p>
    </div>
  )
}
