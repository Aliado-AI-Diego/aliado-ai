import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div>
        <div className="h-9 w-64 bg-muted/50 rounded-lg animate-pulse"></div>
        <div className="h-5 w-48 bg-muted/40 rounded-md animate-pulse mt-2"></div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-apple-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-muted/50 rounded-md animate-pulse"></div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted/40 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Skeleton */}
        <Card className="shadow-apple-sm border-border/50">
          <CardHeader>
            <div className="h-6 w-36 bg-muted/50 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded animate-pulse"></div>
                    <div className="h-3 w-48 bg-muted/40 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded bg-muted/50 animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insights Skeleton */}
        <Card className="shadow-apple-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-6 w-40 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-6 w-20 bg-muted/30 rounded-md animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted/60 animate-pulse"></div>
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="h-3 w-full bg-muted/40 rounded animate-pulse"></div>
                  <div className="h-3 w-4/5 bg-muted/40 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
