import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aliado AI — Agentes de IA para tu negocio',
  description:
    'Plataforma de agentes de servicio al cliente con inteligencia artificial. Entrena tu agente con tus datos, atiende a tus clientes 24/7 y obtén insights de negocio procesables.',
  keywords: ['IA', 'agentes', 'servicio al cliente', 'PyMEs', 'Latinoamérica', 'chatbot', 'business intelligence'],
  authors: [{ name: 'Aliado AI' }],
  openGraph: {
    title: 'Aliado AI — Agentes de IA para tu negocio',
    description: 'Entrena tu agente con tus datos, atiende a tus clientes 24/7 y obtén insights de negocio procesables.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
