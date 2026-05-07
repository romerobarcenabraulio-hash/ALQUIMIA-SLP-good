'use client'
import { COMPOSICION_RSU_DETALLE } from '@/lib/constants'
import { MATERIAL_COLORS, MATERIAL_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { ContextoModulo } from '@/components/ui/ContextoModulo'

const MATERIALS = [
  { key: 'organico',  pct: 45, extra: '30% biodigestor · 70% composta',  color: MATERIAL_COLORS.organico },
  { key: 'papel',     pct: 20, extra: 'IPSL absorbe flujo completo SLP',  color: MATERIAL_COLORS.papel },
  { key: 'plastico',  pct: 15, extra: '50% es PET',                       color: MATERIAL_COLORS.plastico },
  { key: 'vidrio',    pct: 5,  extra: 'Vitro/Owens Illinois cap. disponible', color: MATERIAL_COLORS.vidrio },
  { key: 'aluminio',  pct: 5,  extra: '70% es aluminio (de metales totales)', color: MATERIAL_COLORS.aluminio },
  { key: 'otros',     pct: 10, extra: 'Rechazo al relleno sanitario',     color: MATERIAL_COLORS.otros },
]

export function ComposicionRSU() {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S6 — Composición RSU</p>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-serif text-[24px] text-[#1C1B18]">Fracción de residuos</h2>
        <Badge variant="info">Dato certificado SEMARNAT</Badge>
      </div>
      <ContextoModulo
        variante="info"
        titulo="¿Qué es la composición RSU y por qué es fija?"
        cuerpo="Esta tabla muestra en qué fracción se divide cada tonelada de basura que llega al relleno. Los porcentajes son fijos en el modelo porque provienen de mediciones directas validadas contra el promedio nacional para ciudades medias. No los sobreescribe ninguna API. Cambiarlos implicaría supuestos sin respaldo."
        puntos={[
          'Orgánico 45%: la fracción más grande, y la que más contamina si no se gestiona (metano en relleno).',
          'Papel/cartón 20%: IPSL en SLP absorbe todo el flujo disponible de papel reciclado.',
          'Plásticos 15%: la mitad es PET (botella), la mitad HDPE y otros polímeros de mayor valor.',
          'Vidrio 5% y metales 5%: baja proporción pero alto valor, especialmente el aluminio ($15/kg).',
          'Otros 10%: rechazo de impurezas — material que no puede valorizarse y va al relleno de todas formas.',
        ]}
        fuente="Composición: Bootstrap ALQUIMIA §2.1 · Modelo_BASED.xlsx · SEMARNAT DBGIR 2022."
        advertencia="Si tu municipio tiene un estudio de composición propio más reciente, contacta a ALQUIMIA para incorporarlo. La composición genérica puede subestimar o sobreestimar algunas fracciones según la dieta local."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MATERIALS.map(m => (
          <div key={m.key} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium text-[#1C1B18]">
                {MATERIAL_LABELS[m.key]}
              </span>
              <span className="font-mono text-[22px]" style={{ color: m.color }}>{m.pct}%</span>
            </div>
            {/* Barra */}
            <div className="h-1.5 bg-[#E2DED6] rounded-full mb-3">
              <div className="h-full rounded-full" style={{ width: `${m.pct * 2}%`, background: m.color }} />
            </div>
            <p className="text-[10px] text-[#A8A49C]">{m.extra}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
