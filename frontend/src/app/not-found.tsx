import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-5 py-12 text-[#1C1B18]">
      <section className="mx-auto max-w-3xl border-t border-[#D8D2C5] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B6760]">
          ALQUIMIA
        </p>
        <h1 className="mt-3 font-serif text-[40px] leading-tight">
          Ruta no encontrada.
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-7 text-[#4A4740]">
          La plataforma no encontró esta vista. Regresa al paquete consultivo o al centro de administración.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/v" className="bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white">
            Ir a validación
          </Link>
          <Link href="/admin" className="border border-[#D8D2C5] px-4 py-2 text-[13px] font-semibold text-[#3B3326]">
            Ir a admin
          </Link>
        </div>
      </section>
    </main>
  )
}
