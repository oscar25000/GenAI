import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  AlertTriangle,
  ListChecks,
  Calendar,
  Users,
  ShieldAlert,
  CheckCircle2,
  Share2,
  MessageCircle,
} from 'lucide-react'
import clsx from 'clsx'

const ITEMS = [
  { id: 'conversation', label: 'Conversation', icon: MessageCircle },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'summary', label: 'Résumé', icon: BookOpen },
  { id: 'warnings', label: 'À ne pas oublier', icon: AlertTriangle },
  { id: 'tasks', label: 'Tâches', icon: ListChecks },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'risks', label: 'Risques', icon: ShieldAlert },
  { id: 'checklist', label: 'Checklist finale', icon: CheckCircle2 },
  { id: 'export', label: 'Export', icon: Share2 },
]

export default function Sidebar({ current, onChange, project }) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/5 bg-ink-900/60 backdrop-blur-xl flex flex-col">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">
              EpiPilot
            </div>
            <div className="text-[11px] text-violet-300/60">
              Copilote projet
            </div>
          </div>
        </div>
      </div>

      <div className="divider mx-3 mb-3" />

      <nav className="flex-1 px-3 space-y-0.5">
        {ITEMS.map((it) => {
          const Icon = it.icon
          const active = current === it.id
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={clsx(
                'w-full group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all',
                active
                  ? 'bg-gradient-to-r from-violet-500/20 to-violet-500/5 text-violet-50 border border-violet-400/20'
                  : 'text-violet-100/60 hover:text-violet-50 hover:bg-white/5 border border-transparent',
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 transition',
                  active ? 'text-violet-300' : 'text-violet-200/40 group-hover:text-violet-200/80',
                )}
              />
              <span className="truncate flex-1 text-left">{it.label}</span>
              {it.id === 'warnings' && project?.warnings?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  {project.warnings.length}
                </span>
              )}
              {it.id === 'tasks' && project?.tasks?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-400/10 text-violet-200 border border-violet-400/20">
                  {project.tasks.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3">
        <div className="glass rounded-2xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-2">
            Projet actif
          </div>
          <div className="text-sm font-medium truncate">{project.name}</div>
          <div className="text-[11px] text-violet-300/60 truncate">
            {project.sourcePdf}
          </div>
          <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-violet-600"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10px] text-violet-300/60">
            {project.progress}% complété
          </div>
        </div>
      </div>
    </aside>
  )
}
