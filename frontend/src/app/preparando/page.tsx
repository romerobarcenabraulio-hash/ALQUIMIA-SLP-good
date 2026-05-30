import Link from 'next/link'

export default function PreparandoPage() {
  return (
    <main className="min-h-screen bg-[#F4F2ED] px-5 py-12">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <p className="mb-3 text-[12px] font-semibold uppercase text-[#6B6760]">Solicitud recibida</p>
        <h1 className="font-serif text-[42px] leading-tight text-[#1C1B18]">
          Estamos preparando tu diagnóstico inicial.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#4A4740]">
          La plataforma prepara una lectura preliminar del municipio seleccionado, revisa fuentes
          públicas y separa datos verificados, inferencias, benchmarks y brechas críticas. Nada de
          esta preparación sustituye validación humana ni estudio local.
        </p>
        <div className="mt-8 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-5">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Siguiente paso</p>
          <p className="mt-2 text-[13px] leading-6 text-[#6B6760]">
            Un responsable humano revisará la solicitud antes de habilitar el diagnóstico completo.
            Si falta evidencia municipal, la plataforma mostrará brecha crítica.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/metodologia" className="rounded-[8px] border border-[#3B6D11] px-4 py-2 text-[13px] font-semibold text-[#2F5B0D]">
            Conocer metodología
          </Link>
          <Link href="/sign-in" className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  )
}
