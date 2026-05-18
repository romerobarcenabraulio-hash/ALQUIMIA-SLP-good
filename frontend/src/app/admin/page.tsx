'use client'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SimulatorGatewayHint } from '@/components/simulator/SimulatorGatewayHint'

const USUARIOS_MOCK = [
  { id: 1, nombre: 'Arq. Carlos Pérez', email: 'carlos@slp.gob.mx', rol: 'analista', zm: 'SLP', ultimo_acceso: '2025-04-26' },
  { id: 2, nombre: 'Lic. María García', email: 'maria@qro.gob.mx',  rol: 'analista', zm: 'QRO', ultimo_acceso: '2025-04-25' },
  { id: 3, nombre: 'Admin Sistema',     email: 'admin@alquimia.mx', rol: 'admin',    zm: 'ALL', ultimo_acceso: '2025-04-27' },
]

const LOGS_MOCK = [
  { ts: '2025-04-27 09:14', usuario: 'carlos@slp.gob.mx', accion: 'Generó plan circularidad', zm: 'SLP', estado: 'completado' },
  { ts: '2025-04-26 15:30', usuario: 'maria@qro.gob.mx',  accion: 'Generó plan circularidad', zm: 'QRO', estado: 'en proceso' },
  { ts: '2025-04-25 11:00', usuario: 'carlos@slp.gob.mx', accion: 'Exportó PDF ejecutivo',    zm: 'SLP', estado: 'completado' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<'usuarios' | 'logs' | 'agentes'>('usuarios')

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">/admin — Panel de administración</p>
          <h1 className="font-serif text-[28px] text-[#1C1B18]">Administración ALQUIMIA</h1>
          <SimulatorGatewayHint variant="compact" className="mt-3 max-w-2xl" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-1 w-fit">
          {[
            { id: 'usuarios', label: 'Usuarios' },
            { id: 'logs',     label: 'Logs de generación' },
            { id: 'agentes',  label: 'Estado ÁGORA' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                tab === t.id ? 'bg-[#3B6D11] text-white' : 'text-[#6B6760] hover:bg-[#F0EDE5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'usuarios' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[13px] font-medium text-[#1C1B18]">{USUARIOS_MOCK.length} usuarios registrados</p>
              <button className="btn-primary text-[12px]">+ Crear usuario</button>
            </div>
            <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead className="bg-[#F0EDE5]">
                  <tr>
                    {['Nombre','Email','Rol','ZM','Último acceso','Acciones'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[#6B6760] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {USUARIOS_MOCK.map(u => (
                    <tr key={u.id} className="border-t border-[#E8E4DC]">
                      <td className="py-3 px-4 font-medium text-[#1C1B18]">{u.nombre}</td>
                      <td className="py-3 px-4 text-[#6B6760]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.rol === 'admin' ? 'bg-[#FBEAEA] text-[#C0392B]' : 'bg-[#EAF3DE] text-[#3B6D11]'}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#6B6760]">{u.zm}</td>
                      <td className="py-3 px-4 text-[#A8A49C]">{u.ultimo_acceso}</td>
                      <td className="py-3 px-4">
                        <button className="text-[#1A5FA8] hover:underline mr-3">Editar</button>
                        <button className="text-[#C0392B] hover:underline">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-[#F0EDE5]">
                <tr>
                  {['Timestamp','Usuario','Acción','ZM','Estado'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[#6B6760] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOGS_MOCK.map((l, i) => (
                  <tr key={i} className="border-t border-[#E8E4DC]">
                    <td className="py-3 px-4 font-mono text-[10px] text-[#A8A49C]">{l.ts}</td>
                    <td className="py-3 px-4 text-[#6B6760]">{l.usuario}</td>
                    <td className="py-3 px-4 text-[#1C1B18]">{l.accion}</td>
                    <td className="py-3 px-4 font-mono">{l.zm}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        l.estado === 'completado' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FEF7E7] text-[#D4881E]'
                      }`}>{l.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'agentes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { nombre: 'Director',    estado: 'idle',  ultima: '2025-04-27 09:14' },
              { nombre: 'Arquitecto',  estado: 'idle',  ultima: '2025-04-27 09:16' },
              { nombre: 'Ghostwriter', estado: 'idle',  ultima: '2025-04-27 09:22' },
              { nombre: 'Comparador',  estado: 'idle',  ultima: '2025-04-26 15:30' },
              { nombre: 'Mapeador',    estado: 'idle',  ultima: '2025-04-26 15:34' },
              { nombre: 'Validador',   estado: 'idle',  ultima: '2025-04-27 09:25' },
              { nombre: 'Humanizador', estado: 'idle',  ultima: '2025-04-27 09:27' },
            ].map(a => (
              <div key={a.nombre} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] px-5 py-4 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${a.estado === 'running' ? 'bg-[#3B6D11] animate-pulse' : 'bg-[#E2DED6]'}`} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#1C1B18]">{a.nombre}</p>
                  <p className="text-[11px] text-[#A8A49C]">Última ejecución: {a.ultima}</p>
                </div>
                <span className="text-[10px] text-[#A8A49C] uppercase">{a.estado}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
