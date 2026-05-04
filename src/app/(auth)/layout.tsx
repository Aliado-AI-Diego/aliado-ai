import { Bot } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Bot className="w-5 h-5 text-background" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Aliado AI</span>
        </Link>
        <ThemeToggle />
      </nav>
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        {children}
      </main>
    </div>
  )
}
