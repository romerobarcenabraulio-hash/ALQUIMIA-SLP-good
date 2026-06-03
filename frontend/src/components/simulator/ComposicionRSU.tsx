'use client'
import { MATERIAL_COLORS, MATERIAL_LABELS } from '@/lib/utils'
import { ContextoModulo } from '@/components/ui/ContextoModulo'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'

const MATERIALS = [
  { key: 'organico',  pct: 45, extra: 'Fracción orgánica; metano potencial si llega a relleno',  color: MATERIAL_COLORS.organico },
  { key: 'papel',     pct: 20, extra: 'Papel/cartón seco; precio depende de pureza y comprador',  color: MATERIAL_COLORS.papel },
  { key: 'plastico',  pct: 15, extra: 'PET/HDPE se valoran por separado en precios',              color: MATERIAL_COLORS.plastico },
  { key: 'vidrio',    pct: 5,  extra: 'Peso alto; logística y comprador definen viabilidad',       color: MATERIAL_COLORS.vidrio },
  { key: 'aluminio',  pct: 5,  extra: 'Metales totales; aluminio es subfracción de mayor valor',   color: MATERIAL_COLORS.aluminio },
  { key: 'otros',     pct: 10, extra: 'Rechazo sin valorización en este escenario',                color: MATERIAL_COLORS.otros },
]

export function ComposicionRSU() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-[24px] text-gray-900c">Fracción de residuos</h2>
        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400c mt-1">Referencia documental</p>
      </div>
      <details className="mb-3 text-[11px]">
        <summary className="cursor-pointer text-[#6B6760] hover:text-[#1C1B18] select-none">
          Referencia documental — porcentajes base del modelo
        </summary>
        <div className="mt-2">
          <ContextoModulo
            variante="info"
            titulo="¿Qué es la composición RSU y por qué se declara como referencia?"
            cuerpo="Esta tabla muestra cómo se reparte una tonelada de RSU municipal dentro del escenario. Los porcentajes son referencia documental del modelo y deben sustituirse cuando exista estudio municipal de composición más reciente. No se presentan como medición oficial del municipio activo."
            puntos={[
              'Orgánico 45%: la fracción más grande, y la que más contamina si no se gestiona (metano en relleno).',
              'Papel/cartón 20%: requiere llegar seco y separado para conservar valor de venta.',
              'Plásticos 15%: PET, HDPE y otros polímeros no tienen el mismo precio ni la misma merma.',
              'Vidrio 5% y metales 5%: baja proporción; la viabilidad depende de logística, comprador y pureza.',
              'Otros 10%: rechazo de impurezas — material que no puede valorizarse y va al relleno de todas formas.',
            ]}
            fuente="Composición: matriz Bibliografía y cálculos · Modelo_BASED.xlsx · referencia SEMARNAT/DBGIR documentada."
            advertencia="Si tu municipio tiene estudio de composición propio, debe reemplazar esta referencia antes de usar el escenario como soporte público."
          />
        </div>
      </details>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {MATERIALS.map(m => (
          <div key={m.key} className="border-b border-[0.5px] border-gray-200c pb-5">
            <AnchorFigure
              figure={`${m.pct}%`}
              context={MATERIAL_LABELS[m.key]}
              figureClassName="tabular-nums"
            />
            <div className="h-1.5 bg-gray-200c rounded-full mt-3 mb-2 max-w-[200px]">
              <div className="h-full rounded-full" style={{ width: `${m.pct * 2}%`, background: m.color }} />
            </div>
            <p className="font-sans text-[12px] text-gray-600c leading-[1.5]">{m.extra}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
