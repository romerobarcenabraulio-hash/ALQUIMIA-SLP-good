import type { ClientPlatformStage } from '@/lib/platformRouting'
import { PLATFORM_LABEL_BY_STAGE } from '@/lib/platformRouting'

const STAGE_STYLE: Record<ClientPlatformStage, string> = {
  validation: 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]',
  planning: 'border-[#BDD7F5] bg-[#E8F0FA] text-[#1A5FA8]',
  execution: 'border-[#D8C4E8] bg-[#F5EFF9] text-[#4A1C7A]',
}

export function PlatformStageBadge({ stage }: { stage: ClientPlatformStage }) {
  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold ${STAGE_STYLE[stage]}`}>
      {PLATFORM_LABEL_BY_STAGE[stage]}
    </span>
  )
}
