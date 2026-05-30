export function Watermark({
  version,
  date,
  status,
}: {
  version: number
  date: string
  status: string
}) {
  if (status === 'official') return null
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 rounded-[6px] border border-[#D8D2C5] bg-[#FDFCFA]/85 px-3 py-2 text-[11px] font-semibold uppercase text-[#8A8680] shadow-sm print:fixed">
      ALQUIMIA · Diagnóstico inicial · Versión {version} · {date}
    </div>
  )
}
