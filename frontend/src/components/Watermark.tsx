export function Watermark({
  version,
  date,
  status,
  validationPct,
}: {
  version: number
  date: string
  status: string
  validationPct: number
}) {
  if (status === 'official') return null
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-30 rounded-[6px] border border-[#D8D2C5] bg-[#FDFCFA]/85 px-3 py-2 text-center text-[10px] font-semibold uppercase leading-4 text-[#8A8680] shadow-sm sm:left-auto sm:right-4 sm:max-w-[calc(100vw-2rem)] sm:text-right sm:text-[11px] print:fixed">
      ALQUIMIA · Diagnóstico en construcción · {validationPct}% validado · {date} · V{version}
    </div>
  )
}
