'use client'

import { useState } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTopic {
  title: string
  description: string
  steps?: string[]
}

const HELP_TOPICS: HelpTopic[] = [
  {
    title: 'Save Your Simulation',
    description: 'Keep your work safe by saving it regularly',
    steps: [
      'Click the "Save" button to open the save dialog',
      'Enter a name for your simulation (e.g., "Baseline 2024")',
      'Optionally add a description to remember what this version contains',
      'Click "Save" to store your simulation securely',
    ],
  },
  {
    title: 'Load a Previous Simulation',
    description: 'Resume work on a saved simulation',
    steps: [
      'Click the "Load" button to open your simulations',
      'Search by name or description to find what you need',
      'Click on a simulation to load it into the editor',
      'The simulation state will be restored exactly as you saved it',
    ],
  },
  {
    title: 'Export & Share Results',
    description: 'Generate professional reports for stakeholders',
    steps: [
      'Click the "Export" button to see export options',
      'Choose "Export as JSON" for technical use or data backup',
      'Choose "Export as CSV" for spreadsheet analysis',
      'Download your file and share with decision makers',
    ],
  },
  {
    title: 'View & Restore Versions',
    description: 'Track how your simulation evolved over time',
    steps: [
      'Scroll down to "Version History" in the control panel',
      'See all versions you\'ve created with timestamps',
      'Click on any version to see what changed',
      'Use the restore button to go back to a previous version if needed',
    ],
  },
  {
    title: 'Generate Reports',
    description: 'Create professional documentation',
    steps: [
      'Scroll to the "Generate Report" section',
      'Choose HTML format for web viewing or PDF printing',
      'Choose JSON format for technical integration',
      'Click "Generate & Download" to get your report',
    ],
  },
  {
    title: 'Offline Mode',
    description: 'Keep working even without internet',
    steps: [
      'The "Offline" indicator shows your connection status',
      'Changes are automatically queued while offline',
      'When you reconnect, pending changes sync automatically',
      'No need to manually retry - we handle it for you',
    ],
  },
]

interface SimulationHelpProps {
  className?: string
}

export function SimulationHelp({ className }: SimulationHelpProps) {
  const [open, setOpen] = useState(false)
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null)

  return (
    <div className={cn('', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6760] hover:text-[#3B6D11] hover:bg-[#FDFCFA] transition-colors"
        title="Click for help"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help & Guide</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
              <h2 className="text-lg font-semibold text-[#1C1B18]">Simulation Management Guide</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-[#F4F2ED] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#6B6760]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-0">
                {HELP_TOPICS.map((topic, index) => (
                  <div key={index} className="border-b border-[#E8E4DC]">
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === index ? null : index)}
                      className="w-full px-5 py-4 flex items-start justify-between hover:bg-[#FDFCFA] transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-[#1C1B18]">{topic.title}</h3>
                        <p className="text-xs text-[#6B6760] mt-1">{topic.description}</p>
                      </div>
                      {expandedTopic === index ? (
                        <ChevronUp className="h-5 w-5 text-[#6B6760] flex-shrink-0 ml-3" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#6B6760] flex-shrink-0 ml-3" />
                      )}
                    </button>

                    {expandedTopic === index && topic.steps && (
                      <div className="px-5 pb-4 bg-[#FDFCFA]">
                        <ol className="space-y-2">
                          {topic.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex gap-3 text-xs text-[#6B6760]">
                              <span className="font-semibold text-[#3B6D11] flex-shrink-0">
                                {stepIndex + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#E8E4DC] bg-[#FDFCFA]">
              <p className="text-xs text-[#8E8980]">
                💡 Tip: All your changes are automatically saved to ensure you never lose your work.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
