import Link from 'next/link'

export default function PendienteValidacionPage() {
  return (
    <main className="min-h-screen bg-[#F4F2ED] px-5 py-12">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <p className="mb-3 text-[12px] font-semibold uppercase text-[#8A5C05]">Validación humana requerida</p>
        <h1 className="font-serif text-[42px] leading-tight text-[#1C1B18]">
          Tu solicitud está pendiente de validación.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#4A4740]">
          El correo usado requiere revisión manual antes de asociarse a un municipio o institución.
          Crear una cuenta no crea un municipio oficial ni habilita datos como oficiales.
        </p>
        <div className="mt-8 rounded-[8px] border border-[#E1C98E] bg-[#FFF8E8] p-5">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Qué ocurre ahora</p>
          <p className="mt-2 text-[13px] leading-6 text-[#6B6760]">
            ALQUIMIA revisará la institución, el cargo y el municipio solicitado. Si falta evidencia
            local, el diagnóstico conservará el paquete completo y marcará brechas críticas.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/metodologia" className="rounded-[8px] border border-[#3B6D11] px-4 py-2 text-[13px] font-semibold text-[#2F5B0D]">
            Ver límites metodológicos
          </Link>
          <Link href="/" className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
