import { Sparkles, Settings } from 'lucide-react'
import clsx from 'clsx'

const ITEMS = [
  { id: 'conversation', label: 'Conversation' },
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tâches' },
  { id: 'planning', label: 'Planning' },
  { id: 'team', label: 'Équipe' },
  { id: 'risks', label: 'Risques' },
  { id: 'summary', label: 'Résumé' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'export', label: 'Export' },
]

export default function TopNav({ current, onChange, project, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
      <div className="px-6 flex items-center gap-0 h-14">
        <div className="flex items-center gap-2.5 mr-8 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 grid place-items-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-slate-900">Epilot</span>
        </div>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {ITEMS.map((it) => (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={clsx(
                'shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all',
                current === it.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="ml-4 shrink-0 flex items-center gap-3">
          {project && (
            <div className="hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] text-slate-500 truncate max-w-[160px] font-medium">{project.name}</span>
            </div>
          )}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
