/**
 * ganttExport.ts
 * Pure TypeScript utility — no React imports.
 * Exports Gantt task data to ClickUp-compatible CSV and provides
 * business-day calculation helpers for Mexican federal holidays.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single task in the Gantt plan, ready for ClickUp CSV export. */
export interface GanttTaskExport {
  /** Unique task identifier */
  id: string
  /** Display name of the task */
  name: string
  /** Relative start day from the project start date (0 = day 1) */
  startDay: number
  /** Duration in calendar days */
  durationDays: number
  /** IDs of tasks that must complete before this one can start */
  dependencies?: string[]
  /** ClickUp priority level */
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  /** Assignee name or email */
  assignee?: string
  /** Current task status */
  status?: string
  /** Optional task description */
  description?: string
}

// ── Mexican federal holidays (MM-DD fixed dates) ──────────────────────────────
// Source: Ley Federal del Trabajo Art. 74 — días de descanso obligatorio.
// Note: "floating" holidays (3rd Monday of Feb, 3rd Monday of Nov) are not
// included here because they shift per year; add dynamically if needed.
const HOLIDAYS_MX: readonly string[] = [
  '01-01', // Año Nuevo
  '02-05', // Día de la Constitución (fijo por decreto)
  '03-21', // Natalicio de Benito Juárez
  '09-16', // Día de la Independencia
  '11-02', // Día de Muertos (descanso no obligatorio federal, pero común en municipios)
  '11-20', // Revolución Mexicana (fijo por decreto)
  '12-25', // Navidad
]

/**
 * Returns the zero-padded MM-DD string for a given Date.
 * Used internally to compare against the HOLIDAYS_MX list.
 */
function toMmDd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}-${d}`
}

/**
 * Returns `true` if the given date falls on a Saturday, Sunday,
 * or one of the Mexican federal fixed holidays.
 */
function isNonBusinessDay(date: Date): boolean {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return true
  return (HOLIDAYS_MX as string[]).includes(toMmDd(date))
}

/**
 * Adds `days` business days to `startDate`, skipping Saturdays, Sundays,
 * and Mexican federal fixed holidays.
 *
 * @param startDate - The reference date (not mutated)
 * @param days      - Number of business days to advance (must be ≥ 0)
 * @returns A new Date representing the resulting business day
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  let remaining = Math.max(0, Math.floor(days))
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    if (!isNonBusinessDay(result)) {
      remaining--
    }
  }
  return result
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

/**
 * Formats a Date as MM/DD/YYYY — the format expected by ClickUp's CSV importer.
 */
function toClickUpDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const y = date.getFullYear()
  return `${m}/${d}/${y}`
}

/**
 * Capitalises the first letter of a string.
 * Used to convert priority values like 'urgent' → 'Urgent'.
 */
function capitalise(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Wraps a CSV field value in double quotes and escapes any embedded double
 * quotes per RFC 4180.
 */
function csvField(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

// ── Main export function ──────────────────────────────────────────────────────

/**
 * Converts an array of `GanttTaskExport` objects into a ClickUp-compatible
 * CSV string.
 *
 * The resulting CSV uses the following headers (matching ClickUp's import spec):
 * `Task Name, List, Assignee, Due Date, Start Date, Priority, Status, Description`
 *
 * Dates are formatted as MM/DD/YYYY. `startDay` and `durationDays` are treated
 * as calendar days relative to `fechaInicio`.
 *
 * @param tasks       - Array of tasks to export
 * @param fechaInicio - Absolute project start date
 * @returns UTF-8 CSV string ready for download or file write
 */
export function exportGanttToClickUpCsv(
  tasks: GanttTaskExport[],
  fechaInicio: Date,
): string {
  const LIST_NAME = 'ALQUIMIA - Programa Municipal'

  const headers = [
    'Task Name',
    'List',
    'Assignee',
    'Due Date',
    'Start Date',
    'Priority',
    'Status',
    'Description',
  ]

  const rows = tasks.map(task => {
    const startDate = new Date(fechaInicio)
    startDate.setDate(startDate.getDate() + task.startDay)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + Math.max(0, task.durationDays - 1))

    const priority = capitalise(task.priority ?? 'normal')
    const status   = task.status ?? 'To Do'
    const assignee = task.assignee ?? ''
    const desc     = task.description ?? ''

    return [
      csvField(task.name),
      csvField(LIST_NAME),
      csvField(assignee),
      csvField(toClickUpDate(endDate)),
      csvField(toClickUpDate(startDate)),
      csvField(priority),
      csvField(status),
      csvField(desc),
    ].join(',')
  })

  return [headers.map(h => csvField(h)).join(','), ...rows].join('\r\n')
}

// ── Browser download helper ───────────────────────────────────────────────────

/**
 * Triggers a browser file-download for a CSV string.
 * Creates a temporary `<a>` element, clicks it programmatically, then
 * immediately revokes the object URL to avoid memory leaks.
 *
 * @param content  - CSV string to download
 * @param filename - Suggested file name (e.g. "gantt-slp.csv")
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Sub-task generator ────────────────────────────────────────────────────────

/**
 * Generates individual daily sub-tasks from a parent task template.
 *
 * Each returned task has `durationDays = 1` and `startDay` incremented by one
 * per day relative to the parent's implicit start. If `dailyTemplate` contains
 * fewer entries than `durationDays`, the last template entry is repeated for
 * the remaining days.
 *
 * @param taskId        - ID prefix for generated tasks (e.g. "fase1-arranque")
 * @param taskName      - Base name for the parent task (day number appended)
 * @param durationDays  - Total number of daily tasks to generate
 * @param dailyTemplate - Array of activity descriptions, one per day
 * @returns Array of `GanttTaskExport` with one entry per day
 */
export function generarSubtareasDiarias(
  taskId: string,
  taskName: string,
  durationDays: number,
  dailyTemplate: string[],
): GanttTaskExport[] {
  const count = Math.max(0, Math.floor(durationDays))
  const tasks: GanttTaskExport[] = []

  for (let day = 0; day < count; day++) {
    const templateIndex = Math.min(day, dailyTemplate.length - 1)
    const description   = dailyTemplate[templateIndex] ?? ''

    tasks.push({
      id:           `${taskId}-day-${day + 1}`,
      name:         `${taskName} — Día ${day + 1}`,
      startDay:     day,
      durationDays: 1,
      description,
    })
  }

  return tasks
}
