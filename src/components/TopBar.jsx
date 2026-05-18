import { Search, Command, Bell, RefreshCw, FileText } from 'lucide-react'

const SECTION_TITLES = {
  overview: 'Vue d\'ensemble',
  summary: 'Résumé du projet',
  warnings: 'À ne pas oublier',
  tasks: 'Tâches',
  planning: 'Planning',
  team: 'Équipe',
  risks: 'Analyse des risques',
  checklist: 'Checklist finale',
  export: 'Export',
}

export default function TopBar({ project, section }) {
  const formattedDeadline = new Date(project.deadline).toLocaleDateString(
    'fr-FR',
    { day: '2-digit', month: 'short', year: 'numeric' },
  )

  return (
    <div className="sticky top-0 z-10 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
            {project.name} · sujet analysé
          </div>
          <div className="text-[17px] font-semibold tracking-tight truncate">
            {SECTION_TITLES[section] || 'Dashboard'}
          </div>
        </div>

        <div className="flex-1 max-w-md mx-auto hidden md:flex">
          <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[12px] text-violet-200/60">
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1">Rechercher tâche, livrable, membre…</span>
            <span className="flex items-center gap-1 text-[10px] text-violet-200/40">
              <Command className="w-3 h-3" /> K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-violet-300/70 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[160px]">{project.sourcePdf}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-violet-300/70 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Deadline {formattedDeadline}
          </div>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-400/40 transition">
            <RefreshCw className="w-3.5 h-3.5 text-violet-200" />
          </button>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-400/40 transition">
            <Bell className="w-3.5 h-3.5 text-violet-200" />
          </button>
        </div>
      </div>
    </div>
  )
}
