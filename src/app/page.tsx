'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, MessageSquare, Zap, Shield, Globe, Check, PhoneCall, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A1628] text-[#FFFFFF] selection:bg-[#2D6EFF]/30 font-sans">
      
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] w-[80%] h-[60%] rounded-full bg-[#2D6EFF]/5 blur-[150px] opacity-70"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-[#A8B4C0]/10 bg-[#0A1628]/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Custom Typographic Logo */}
          <Link href="/" className="flex items-center group">
            <div className="font-space font-bold text-2xl tracking-widest flex items-center text-[#FFFFFF]">
              <span>AL</span>
              {/* The 'I' with a glowing green dot */}
              <div className="relative flex flex-col items-center justify-end h-full px-[1px]">
                <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#00D68F] shadow-[0_0_8px_rgba(0,214,143,0.8)] animate-pulse"></div>
                <span>I</span>
              </div>
              <span>AD</span>
              {/* Perfect circle 'O' */}
              <div className="w-5 h-5 rounded-full border-[3px] border-[#FFFFFF] ml-[2px] mt-[1px]"></div>
              
              {/* Superscript AI */}
              <span className="text-[#2D6EFF] text-xs font-bold -mt-4 ml-1 tracking-normal">AI</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden sm:block">
              <span className="text-sm font-medium text-[#A8B4C0] hover:text-[#FFFFFF] transition-colors">
                Iniciar sesión
              </span>
            </Link>
            <Link href="/register">
              <Button className="h-11 px-6 rounded-none bg-[#2D6EFF] hover:bg-[#2D6EFF]/90 text-white font-semibold text-sm transition-all border border-[#2D6EFF]/50 hover:shadow-[0_0_20px_rgba(45,110,255,0.3)]">
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-32 px-6 flex flex-col items-center text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-space text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            Tu negocio nunca duerme. <br />
            <span className="text-[#FFFFFF]">Aliado tampoco.</span>
          </h1>
          
          <h2 className="font-space text-xl md:text-2xl text-[#A8B4C0] font-semibold max-w-2xl mx-auto mb-12 leading-relaxed">
            El primer agente cognitivo latinoamericano que trabaja mientras tú descansas. <br className="hidden md:block" />
            <span className="text-[#2D6EFF] font-bold">Aliado los atiende.</span>
          </h2>

          <div className="flex justify-center">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 rounded-none bg-[#2D6EFF] hover:bg-[#2D6EFF]/90 text-white font-semibold text-base flex items-center gap-3 transition-all border border-[#2D6EFF]/50 hover:shadow-[0_0_25px_rgba(45,110,255,0.4)]">
                <span className="w-2 h-2 rounded-full bg-[#00D68F] shadow-[0_0_8px_rgba(0,214,143,0.8)]"></span>
                Crear mi primer agente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section className="relative z-10 py-32 px-6 border-t border-[#A8B4C0]/10 bg-[#0A1628]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-space text-2xl md:text-4xl text-[#FFFFFF] leading-relaxed font-semibold max-w-4xl mx-auto">
            Aliado AI es la plataforma de agentes cognitivos conversacionales diseñada para PyMEs latinoamericanas. Atiende WhatsApp, Instagram, Facebook y llamadas telefónicas en tiempo real, 24 horas, entrenado con la información exacta de tu negocio. 
            <br /><br />
            <span className="text-[#A8B4C0]">No es un chatbot. Es tu mejor colaborador digital.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
            <div className="p-10 border border-[#A8B4C0]/10 bg-[#FFFFFF]/5 flex flex-col items-start text-left group hover:border-[#2D6EFF]/30 transition-colors">
              <MessageSquare className="w-8 h-8 text-[#2D6EFF] mb-6" />
              <h3 className="font-space text-2xl font-bold mb-4">Atención 24/7</h3>
              <p className="text-[#A8B4C0] leading-relaxed">
                Automatiza el 100% de tus consultas rutinarias. Tu agente interactúa de forma natural y resuelve dudas en segundos, liberando a tu equipo para tareas estratégicas.
              </p>
            </div>
            <div className="p-10 border border-[#A8B4C0]/10 bg-[#FFFFFF]/5 flex flex-col items-start text-left group hover:border-[#2D6EFF]/30 transition-colors">
              <BarChart3 className="w-8 h-8 text-[#00D68F] mb-6" />
              <h3 className="font-space text-2xl font-bold mb-4">Business Insights</h3>
              <p className="text-[#A8B4C0] leading-relaxed">
                Analizamos cada conversación para extraer datos vitales. Identifica tendencias, quejas recurrentes y nuevas oportunidades de venta generadas automáticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-6 border-t border-[#A8B4C0]/10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="font-space text-4xl md:text-5xl font-bold tracking-tight">
              Como tener a tu mejor empleado <br className="hidden md:block"/> trabajando 24/7, sin quejarse.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-8 border border-[#A8B4C0]/20 bg-transparent hover:bg-[#FFFFFF]/5 transition-colors group">
              <Globe className="w-6 h-6 text-[#FFFFFF] mb-6 group-hover:text-[#2D6EFF] transition-colors" />
              <h3 className="font-space text-lg font-bold mb-3">Chat Omnicanal</h3>
              <p className="text-sm text-[#A8B4C0] leading-relaxed">Un solo cerebro atendiendo WhatsApp, Instagram, Messenger y tu sitio web de forma simultánea.</p>
            </div>

            <div className="p-8 border border-[#A8B4C0]/20 bg-transparent hover:bg-[#FFFFFF]/5 transition-colors group">
              <PhoneCall className="w-6 h-6 text-[#FFFFFF] mb-6 group-hover:text-[#2D6EFF] transition-colors" />
              <h3 className="font-space text-lg font-bold mb-3">Voz IA</h3>
              <p className="text-sm text-[#A8B4C0] leading-relaxed">Recepcionista telefónica capaz de hablar de forma humana, agendar citas y transferir llamadas importantes.</p>
            </div>

            <div className="p-8 border border-[#A8B4C0]/20 bg-transparent hover:bg-[#FFFFFF]/5 transition-colors group">
              <Zap className="w-6 h-6 text-[#FFFFFF] mb-6 group-hover:text-[#2D6EFF] transition-colors" />
              <h3 className="font-space text-lg font-bold mb-3">Conocimiento Privado</h3>
              <p className="text-sm text-[#A8B4C0] leading-relaxed">Sube tus PDFs, políticas y catálogos. El agente responde basándose exclusivamente en tu información.</p>
            </div>

            <div className="p-8 border border-[#A8B4C0]/20 bg-transparent hover:bg-[#FFFFFF]/5 transition-colors group">
              <Shield className="w-6 h-6 text-[#FFFFFF] mb-6 group-hover:text-[#2D6EFF] transition-colors" />
              <h3 className="font-space text-lg font-bold mb-3">Dashboard Insights</h3>
              <p className="text-sm text-[#A8B4C0] leading-relaxed">Panel de control con analíticas avanzadas de todas las interacciones de tus clientes en tiempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA & Footer */}
      <section className="relative z-10 pt-32 pb-12 px-6 border-t border-[#A8B4C0]/10 bg-[#0A1628]">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <h2 className="font-space text-4xl md:text-6xl font-bold tracking-tight mb-10">
            La IA que democratiza el servicio de clase mundial para toda Latinoamérica.
          </h2>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 rounded-none bg-[#FFFFFF] hover:bg-[#A8B4C0] text-[#0A1628] font-bold text-base transition-all">
              Comenzar la evolución
            </Button>
          </Link>
        </div>

        <footer className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#A8B4C0]/10 pt-12">
          <div className="flex items-center group">
            <div className="font-space font-bold text-xl tracking-widest flex items-center text-[#FFFFFF]">
              <span>AL</span>
              <div className="relative flex flex-col items-center justify-end h-full px-[1px]">
                <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#00D68F]"></div>
                <span>I</span>
              </div>
              <span>AD</span>
              <div className="w-4 h-4 rounded-full border-2 border-[#FFFFFF] ml-[2px] mt-[1px]"></div>
              <span className="text-[#2D6EFF] text-[10px] font-bold -mt-3 ml-1 tracking-normal">AI</span>
            </div>
          </div>
          
          <div className="text-sm font-space text-[#A8B4C0] tracking-wider uppercase">
            El aliado que toda empresa latinoamericana merece.
          </div>
          
          <p className="text-xs text-[#A8B4C0]/50 font-sans">
            © {new Date().getFullYear()} Aliado AI LLC. Todos los derechos reservados.
          </p>
        </footer>
      </section>
    </div>
  )
}
