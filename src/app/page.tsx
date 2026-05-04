'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, BarChart3, MessageSquare, Zap, Shield, Globe, Check, X, PhoneCall, Calendar, Code, PhoneOff, Clock, Moon, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Custom Accordion Component
function FaqAccordionItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-2xl bg-card overflow-hidden transition-all duration-300 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-6 py-5 flex items-center justify-between font-semibold text-left text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] opacity-50"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Aliado AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-sm font-medium hover:bg-muted/50 rounded-full px-4">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm font-medium rounded-full px-5 shadow-apple hover:shadow-apple-hover transition-all">
                Comenzar gratis
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/80 text-sm font-medium border border-border/50 text-foreground mb-8 animate-fade-in shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Más de 10 negocios ya automatizados en Latinoamérica
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-slide-up">
            Tu negocio pierde clientes cada noche. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500">Aliado los atiende por ti.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Un agente de IA entrenado con la información de tu negocio que responde WhatsApp, Instagram y llamadas telefónicas las 24 horas — aunque estés dormido.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/register">
              <Button size="lg" className="rounded-full px-8 text-base h-14 shadow-apple hover:shadow-apple-hover transition-all group">
                Crear mi primer agente
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-14 bg-background/50 backdrop-blur-md hover:bg-muted/50 border-border/50">
                Ver cómo funciona &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Dolor */}
      <section className="relative z-10 py-16 px-6 bg-muted/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">¿Cuántos clientes perdiste esta semana?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                <PhoneOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Llamadas sin respuesta</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El 67% de los pacientes que no logran comunicarse con una clínica llaman a la competencia. No regresan.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-6 relative">
                <MessageSquare className="w-6 h-6" />
                <Clock className="w-3 h-3 absolute bottom-3 right-3 bg-card rounded-full" />
              </div>
              <h3 className="text-lg font-bold mb-3">WhatsApp sin atender</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El tiempo promedio de respuesta en negocios sin automatización es 4 horas. Tus clientes no esperan tanto.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Fuera de horario</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El 40% de las consultas llegan después de las 6pm. Sin Aliado, ese dinero se va a otro lado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Mockup Context & Mockup */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="text-sm font-bold text-primary tracking-widest uppercase mb-3">ASÍ SE VE EN TIEMPO REAL</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Tu agente trabajando mientras tú duermes</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Cada conversación atendida, cada llamada respondida, cada cita agendada — todo registrado en tu panel en tiempo real.
          </p>
        </div>

        <div className="max-w-5xl mx-auto animate-slide-up">
          <div className="relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"></div>
            <div className="absolute top-0 left-0 right-0 h-12 border-b border-border/40 flex items-center px-4 gap-2 bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            
            <div className="w-full h-full pt-12 flex">
              <div className="w-64 border-r border-border/40 p-6 hidden md:block">
                <div className="h-4 w-24 bg-muted rounded mb-8"></div>
                <div className="space-y-4">
                  <div className="h-8 w-full bg-primary/10 rounded-lg"></div>
                  <div className="h-8 w-3/4 bg-muted/50 rounded-lg"></div>
                  <div className="h-8 w-4/5 bg-muted/50 rounded-lg"></div>
                </div>
              </div>
              <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-6 relative">
                  <Bot className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ONLINE</div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Agente de Ventas</h3>
                <p className="text-muted-foreground mb-8">Respondiendo WhatsApp y llamadas en tiempo real.</p>
                <div className="flex gap-4 w-full max-w-md">
                  <div className="flex-1 bg-card border border-border/50 rounded-xl p-4 shadow-sm text-center">
                    <div className="text-3xl font-bold">1,248</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Chats Hoy</div>
                  </div>
                  <div className="flex-1 bg-card border border-border/50 rounded-xl p-4 shadow-sm text-center">
                    <div className="text-3xl font-bold text-primary">85</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Llamadas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-muted/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Configurado en minutos. Funcionando para siempre.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 z-0"></div>
            
            <div className="relative z-10 bg-card p-8 rounded-3xl border border-border/50 shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-6 shadow-sm">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Entrena tu agente</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sube los documentos de tu negocio: servicios, precios, horarios, preguntas frecuentes. Tu agente aprende todo.
              </p>
            </div>
            
            <div className="relative z-10 bg-card p-8 rounded-3xl border border-border/50 shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-6 shadow-sm">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Conecta tus canales</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                WhatsApp, Instagram, Facebook Messenger, tu sitio web. Un clic por canal. Sin código, sin técnicos.
              </p>
            </div>
            
            <div className="relative z-10 bg-card p-8 rounded-3xl border border-border/50 shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-6 shadow-sm">
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Recibe resultados</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu agente empieza a atender al instante. Tú recibes un reporte cada lunes con todo lo que pasó esa semana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="relative z-10 border-b border-border/40 bg-primary/5 text-foreground py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-center">
          <Globe className="w-5 h-5 text-primary shrink-0" />
          <p className="font-medium text-sm md:text-base">
            Aliado ya automatiza más de 10,000 conversaciones al mes para negocios en Honduras, Guatemala y México
          </p>
        </div>
      </section>

      {/* Pricing Section (EXACTLY AS PROVIDED) */}
      <section id="pricing" className="relative z-10 py-24 px-6 bg-muted/10 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Planes diseñados para escalar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Todo el poder de la IA conversacional a un precio accesible para cualquier empresa.</p>
            
            <div className="flex items-center justify-center gap-3 mt-10">
              <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensual</Label>
              <Switch 
                id="billing-toggle" 
                checked={isAnnual} 
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-primary" 
              />
              <Label htmlFor="billing-toggle" className={`text-sm font-medium flex items-center gap-1.5 ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Anual
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">2 MESES GRATIS</span>
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Esencial Plan */}
            <div className="relative p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Esencial</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">Para pequeños negocios que empiezan a automatizar su servicio.</p>
              </div>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold">${isAnnual ? '990' : '99'}</span>
                <span className="text-muted-foreground mb-1 font-medium">/ {isAnnual ? 'año' : 'mes'}</span>
              </div>
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full rounded-xl h-12 font-semibold bg-background hover:bg-muted/50 border-border/50">
                  Empezar con Esencial
                </Button>
              </Link>
              
              <div className="mt-8 space-y-4 flex-1">
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Qué incluye</div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span><strong>1 Agente de IA</strong> configurado</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>WhatsApp Business 24/7</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>Conocimiento: hasta 50 documentos</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>2,000 conversaciones/mes</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>Dashboard básico</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>Soporte por correo (horario hábil)</span></li>
                </ul>

                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-4">Lo que no incluye</div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-muted-foreground/70"><X className="w-5 h-5 shrink-0" /> <span>Redes sociales ni Widget</span></li>
                  <li className="flex gap-3 text-sm text-muted-foreground/70"><X className="w-5 h-5 shrink-0" /> <span>Recepcionista de Voz</span></li>
                  <li className="flex gap-3 text-sm text-muted-foreground/70"><X className="w-5 h-5 shrink-0" /> <span>Insights e integraciones</span></li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-border/40 text-[11px] text-muted-foreground text-center">
                Conversaciones adicionales: $0.025 c/u
              </div>
            </div>

            {/* Profesional Plan */}
            <div className="relative p-8 rounded-3xl bg-card border-2 border-primary shadow-2xl flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                MÁS POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-foreground">Profesional</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">Para empresas establecidas que necesitan omnicanalidad total.</p>
              </div>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-5xl font-extrabold">${isAnnual ? '1,990' : '199'}</span>
                <span className="text-muted-foreground mb-1.5 font-medium">/ {isAnnual ? 'año' : 'mes'}</span>
              </div>
              <Link href="/register" className="w-full">
                <Button className="w-full rounded-xl h-12 font-semibold shadow-apple hover:shadow-apple-hover">
                  Empezar con Profesional
                </Button>
              </Link>
              
              <div className="mt-8 space-y-4 flex-1">
                <div className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Todo lo Esencial, más:</div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm font-medium"><Check className="w-5 h-5 text-primary shrink-0" /> <span><strong>3 Agentes de IA</strong> distintos</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>WhatsApp, Instagram, Messenger y Widget Web</span></li>
                  <li className="flex gap-3 text-sm font-medium"><PhoneCall className="w-5 h-5 text-blue-500 shrink-0" /> <span><strong>Recepcionista de Voz IA</strong> (500 min)</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Conocimiento: hasta 300 documentos</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>8,000 conversaciones/mes</span></li>
                  <li className="flex gap-3 text-sm"><BarChart3 className="w-5 h-5 text-purple-500 shrink-0" /> <span>Insights de IA en reportes</span></li>
                  <li className="flex gap-3 text-sm"><Calendar className="w-5 h-5 text-green-500 shrink-0" /> <span>Integración Google Calendar</span></li>
                  <li className="flex gap-3 text-sm"><MessageSquare className="w-5 h-5 text-primary shrink-0" /> <span>Soporte prioritario por WhatsApp</span></li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-border/40 text-[11px] text-muted-foreground text-center">
                Conversaciones adicionales: $0.018 c/u
              </div>
            </div>

            {/* Empresarial Plan */}
            <div className="relative p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Empresarial</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">Solución a gran escala para operaciones de alto volumen.</p>
              </div>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold">${isAnnual ? '3,490' : '349'}</span>
                <span className="text-muted-foreground mb-1 font-medium">/ {isAnnual ? 'año' : 'mes'}</span>
              </div>
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full rounded-xl h-12 font-semibold bg-background hover:bg-muted/50 border-border/50">
                  Contactar Ventas
                </Button>
              </Link>
              
              <div className="mt-8 space-y-4 flex-1">
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Todo lo Profesional, más:</div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span><strong>Agentes IA Ilimitados</strong></span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span>Conocimiento Ilimitado</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span><strong>Recepcionista de Voz Ilimitada</strong></span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span>25,000 conversaciones/mes</span></li>
                  <li className="flex gap-3 text-sm"><Code className="w-5 h-5 text-foreground shrink-0" /> <span><strong>Acceso API y Webhooks</strong> (CRM, ERP)</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span>Dashboard empresarial completo</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span>Onboarding dedicado (90 min)</span></li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-foreground shrink-0" /> <span>SLA 99.9% + Manager de cuenta</span></li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-border/40 text-[11px] text-muted-foreground text-center">
                Conversaciones adicionales: $0.012 c/u
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-4">
            <FaqAccordionItem 
              question="¿Necesito saber programar para usar Aliado?" 
              answer="No. Aliado está diseñado para dueños de negocio, no para técnicos. Si puedes enviar un WhatsApp, puedes configurar tu agente." 
            />
            <FaqAccordionItem 
              question="¿Cuánto tiempo tarda en estar listo mi agente?" 
              answer="La mayoría de nuestros clientes tienen su agente respondiendo dentro de los primeros 10 minutos. Solo necesitas subir la información de tu negocio y conectar tu WhatsApp." 
            />
            <FaqAccordionItem 
              question="¿Qué pasa si el agente no sabe responder algo?" 
              answer="Tu agente solo responde con la información que tú le proporcionas. Si un cliente pregunta algo fuera de eso, el agente le indica que un miembro de tu equipo le contactará — nunca inventa respuestas." 
            />
            <FaqAccordionItem 
              question="¿Puedo cancelar en cualquier momento?" 
              answer="Sí. Sin contratos de permanencia, sin cargos por cancelación. Si pagas mensual puedes cancelar cuando quieras. Si pagas anual, aplica nuestra política de reembolso proporcional." 
            />
            <FaqAccordionItem 
              question="¿Funciona para mi tipo de negocio?" 
              answer="Aliado funciona para cualquier negocio que recibe consultas por WhatsApp o teléfono: clínicas, consultorios dentales, veterinarias, agencias inmobiliarias, negocios de servicios y más." 
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 py-24 px-6 overflow-hidden bg-primary/5 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Tu competencia ya está respondiendo a las 2am.
          </h2>
          <p className="text-muted-foreground mb-10 text-xl max-w-2xl mx-auto font-medium">
            ¿Cuánto te está costando no tener Aliado?
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href="/register">
              <Button size="lg" className="rounded-full px-10 text-base h-14 shadow-apple hover:shadow-apple-hover">
                Crear mi agente gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Sin tarjeta de crédito · Configuración en 10 minutos · Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-muted/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Aliado AI</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Privacidad y Seguridad</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Infraestructura Global Latam</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aliado AI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
