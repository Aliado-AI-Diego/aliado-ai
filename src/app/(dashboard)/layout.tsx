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
import { useState, useEffect } from 'react'

const navItems = [
  { title: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Operaciones', href: '/dashboard/chats', icon: Inbox },
  { title: 'Agentes', href: '/dashboard/agents', icon: Bot },
  { title: 'Simulador', href: '/dashboard/playground', icon: MessageSquare },
  { title: 'Reportes', href: '/dashboard/insights', icon: BarChart3 },
  { title: 'Config', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20 selection:text-foreground">
      
      {/* ═══ RAZOR COMMAND — Top Navigation Bar ═══ */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50 shadow-command">
        
        {/* Left: Brand Mark */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-7 h-7 bg-primary flex items-center justify-center shadow-command">
            <Cpu className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight hidden md:block">
            ALIADO
          </span>
        </Link>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center h-full ml-8 gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-1.5 h-full px-3 text-[13px] font-medium transition-colors
                  ${isActive 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.title}
                {/* Active indicator — bottom border */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 h-full">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground text-[13px] font-medium h-8 px-2.5"
          >
            <LogOut className="w-3.5 h-3.5 lg:mr-1.5" />
            <span className="hidden lg:inline">Salir</span>
          </Button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-1.5 hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ═══ Mobile Menu Dropdown ═══ */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 top-14 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu */}
          <div className="lg:hidden fixed top-14 left-0 right-0 z-50 border-b border-border bg-card shadow-command-lg animate-slide-up">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium border-b border-border/50 transition-colors
                    ${isActive 
                      ? 'bg-primary/5 text-primary accent-strip' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* ═══ Main Content Area ═══ */}
      <main className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full h-full p-4 lg:p-6 overflow-auto max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
