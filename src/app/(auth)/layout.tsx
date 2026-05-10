import { Cpu } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Auth Navigation */}
      <nav className="px-4 lg:px-6 h-14 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight">ALIADO</span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </main>

      {/* Subtle grid pattern background */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.3]" />
    </div>
  )
}
