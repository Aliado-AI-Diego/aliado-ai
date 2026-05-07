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
  { title: 'SYS_PANEL', href: '/dashboard', icon: LayoutDashboard },
  { title: 'OPERATIONS', href: '/dashboard/chats', icon: Inbox },
  { title: 'AGENTS_NODE', href: '/dashboard/agents', icon: Bot },
  { title: 'TEST_ENV', href: '/dashboard/playground', icon: MessageSquare },
  { title: 'DATA_STREAM', href: '/dashboard/insights', icon: BarChart3 },
  { title: 'CONFIG', href: '/dashboard/settings', icon: Settings },
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
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary selection:text-primary-foreground">
      
      {/* Brutalist Top Nav / HUD Command Bar */}
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50 uppercase tracking-widest text-[10px] md:text-xs">
        {/* Left: Brand */}
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center border border-border shadow-brutalist">
            <Cpu className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-black text-2xl tracking-tighter hidden md:block">ALIADO_OS</span>
        </Link>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 h-full px-5 border-l border-border transition-none font-bold
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-[inset_0_-4px_0_0_var(--color-foreground)] dark:shadow-[inset_0_-4px_0_0_var(--color-background)]' 
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
        <div className="flex items-center gap-4 h-full border-l lg:border-border pl-6">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground font-bold uppercase rounded-none border border-transparent hover:border-border h-10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">TERMINATE</span>
          </Button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 border border-border bg-card"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-background absolute top-16 left-0 w-full z-40 flex flex-col uppercase tracking-widest text-xs font-bold">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  p-4 border-b border-border flex items-center gap-3
                  ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
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
      <main className="flex-1 w-full bg-grid-matrix relative overflow-hidden flex flex-col">
        {/* Subtle scanline overlay for terminal effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-50 opacity-20" />
        
        <div className="flex-1 w-full h-full p-4 lg:p-8 relative z-10 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
