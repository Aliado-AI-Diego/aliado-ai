'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Cpu,
  Inbox,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { title: 'Panel de Control', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Operaciones', href: '/dashboard/chats', icon: Inbox },
  { title: 'Agentes', href: '/dashboard/agents', icon: Bot },
  { title: 'Simulador', href: '/dashboard/playground', icon: MessageSquare },
  { title: 'Reportes', href: '/dashboard/insights', icon: BarChart3 },
  { title: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20 selection:text-foreground">
      
      {/* Executive Top Nav */}
      <header className="h-16 border-b border-border/60 bg-background flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        {/* Left: Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight hidden md:block">Aliado AI</span>
        </Link>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center h-full ml-8 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 h-full border-l lg:border-border/60 pl-6">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground text-sm font-medium h-9 px-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Salir</span>
          </Button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border/60 bg-background absolute top-16 left-0 w-full z-40 flex flex-col shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  p-4 border-b border-border/40 flex items-center gap-3 text-sm font-medium
                  ${isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted/50'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            )
          })}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col max-w-[1600px] mx-auto">
        <div className="flex-1 w-full h-full p-4 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
