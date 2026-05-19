import {
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
    <aside className="w-[210px] shrink-0 border-r border-slate-100 bg-white flex flex-col">
      <div className="px-4 pt-5 pb-4">
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-slate-900 tracking-tight">Epilot</div>
          <div className="text-[11px] text-slate-400">Gestion de projet</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        {ITEMS.map((it) => {
          const Icon = it.icon
          const active = current === it.id
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={clsx(
                'w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all',
                active
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium',
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0 transition-colors',
                  active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span className="truncate flex-1 text-left">{it.label}</span>
              {it.id === 'warnings' && project?.warnings?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {project.warnings.length}
                </span>
              )}
              {it.id === 'tasks' && project?.tasks?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                  {project.tasks.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="px-3 py-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
            Projet actif
          </div>
          <div className="text-[13px] font-semibold text-slate-800 truncate">{project.name}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">{project.sourcePdf}</div>
          <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-slate-400">{project.progress}% complété</div>
        </div>
      </div>
    </aside>
  )
}
