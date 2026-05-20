import { Search, Command, FileText, Settings } from 'lucide-react'

const SECTION_TITLES = {
  conversation: 'Conversation guidée',
  overview: "Vue d'ensemble",
  summary: 'Résumé du projet',
  warnings: 'À ne pas oublier',
  tasks: 'Tâches',
  planning: 'Planning',
  team: 'Équipe',
  risks: 'Analyse des risques',
  checklist: 'Checklist finale',
  export: 'Export',
}

export default function TopBar({ project, section, onOpenSettings }) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null
  const formattedDeadline =
    deadlineDate && !Number.isNaN(deadlineDate.getTime())
      ? deadlineDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Deadline à définir'

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400">{project.name}</div>
          <div className="text-[15px] font-bold text-slate-900 truncate">
            {SECTION_TITLES[section] || 'Dashboard'}
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-auto hidden md:flex">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-[12px] text-slate-400 cursor-default">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">Rechercher…</span>
            <span className="flex items-center gap-0.5 text-[10px] text-slate-300">
              <Command className="w-3 h-3" />K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            {formattedDeadline}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[130px]">
            <FileText className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <span className="truncate">{project.sourcePdf}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
