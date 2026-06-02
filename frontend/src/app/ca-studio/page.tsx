'use client'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { CAIsometrico } from '@/components/ca-studio/CAIsometrico'
import { CAPanelLateral } from '@/components/ca-studio/CAPanelLateral'
import { GuiaOperativa } from '@/components/ca-studio/GuiaOperativa'
import { EstudiosIdoneidad } from '@/components/ca-studio/EstudiosIdoneidad'
import { PlatformGatewayHint } from '@/components/platform/PlatformGatewayHint'
import { cn } from '@/lib/utils'

type Pestaña = 'studio' | 'guia' | 'idoneidad'
type Escala  = 'P' | 'M' | 'G'
type Contexto = 'torre' | 'casa' | 'privada' | 'comercial'

export default function CAStudioPage() {
  const [pestaña, setPestaña]   = useState<Pestaña>('studio')
  const [escala, setEscala]     = useState<Escala>('M')
  const [contexto, setContexto] = useState<Contexto>('torre')

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">CA-Studio — Laboratorio técnico interno</p>
          <h1 className="font-serif text-[32px] text-[#1C1B18]">Diseña tu Centro de Acopio</h1>
          <PlatformGatewayHint variant="compact" className="mt-3 max-w-2xl" />
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 mb-6 bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-1 w-fit">
          {[
            { id: 'studio',   label: 'Modelo 3D' },
            { id: 'guia',     label: 'Guía operativa' },
            { id: 'idoneidad', label: 'Estudios de idoneidad' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setPestaña(t.id as Pestaña)}
              className={cn(
                'px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors',
                pestaña === t.id ? 'bg-[#3B6D11] text-white' : 'text-[#6B6760] hover:bg-[#F0EDE5]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {pestaña === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controles + Vista isométrica */}
            <div className="lg:col-span-2">
              {/* Selectores */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-[11px] text-[#A8A49C] mb-2">Escala del CA</p>
                  <div className="flex gap-2">
                    {(['P', 'M', 'G'] as Escala[]).map(e => (
                      <button key={e} onClick={() => setEscala(e)}
                        className={cn('px-4 py-2 rounded-[8px] text-[12px] font-medium border transition-colors',
                          escala === e ? 'bg-[#3B6D11] text-white border-[#3B6D11]' : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC]')}>
                        {e === 'P' ? 'Pequeño 250m²' : e === 'M' ? 'Mediano 750m²' : 'Grande 2,000m²'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-[#A8A49C] mb-2">Contexto urbano</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['torre', 'casa', 'privada', 'comercial'] as Contexto[]).map(c => (
                      <button key={c} onClick={() => setContexto(c)}
                        className={cn('px-3 py-1.5 rounded-[6px] text-[11px] border transition-colors',
                          contexto === c ? 'bg-[#1A5FA8] text-white border-[#1A5FA8]' : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC]')}>
                        {c === 'torre' ? 'Torre residencial' : c === 'casa' ? 'Casa habitación' :
                         c === 'privada' ? 'Privada/residencial' : 'Comercial mixto'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <CAIsometrico escala={escala} contexto={contexto} />
            </div>

            {/* Panel lateral */}
            <CAPanelLateral escala={escala} />
          </div>
        )}

        {pestaña === 'guia' && <GuiaOperativa />}
        {pestaña === 'idoneidad' && <EstudiosIdoneidad />}
      </div>
    </AppShell>
  )
}
