import { Check } from 'lucide-react'
import clsx from 'clsx'
import { ProgressBar } from './ui.jsx'

export default function ChecklistSection({ project, onToggle }) {
  const done = project.checklist.filter((c) => c.done).length
  const pct = Math.round((done / project.checklist.length) * 100)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Avant le rendu</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Checklist finale de soutenance</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          Les vérifications systématiques avant de pousser ton tag et de passer devant les jurys.
        </p>
      </div>

      {/* Progress strip */}
      <div className="bg-white rounded-2xl shadow-sm px-8 py-6 mb-8 flex items-center gap-10">
        <div>
          <div className="text-[34px] font-bold text-slate-900 leading-none">{pct}%</div>
          <div className="text-[13px] text-slate-500 mt-1.5">
            {done}/{project.checklist.length} éléments ·{' '}
            {pct === 100 ? 'Prêt à rendre ✓' : pct >= 70 ? 'Quasi prêt' : pct >= 30 ? 'En progression' : 'À démarrer'}
          </div>
        </div>
        <div className="flex-1">
          <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'violet'} />
        </div>
      </div>

      {/* Checklist table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {project.checklist.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            className={clsx(
              'w-full text-left flex items-center gap-4 px-6 py-4 transition-colors',
              i < project.checklist.length - 1 && 'border-b border-slate-100',
              c.done ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50',
            )}
          >
            <div
              className={clsx(
                'w-5 h-5 rounded-lg grid place-items-center shrink-0 transition-colors',
                c.done ? 'bg-emerald-500' : 'bg-slate-100 hover:bg-slate-200',
              )}
            >
              {c.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span
              className={clsx(
                'text-[14px] font-medium transition-colors',
                c.done ? 'text-emerald-700 line-through' : 'text-slate-700',
              )}
            >
              {c.label}
            </span>
            {c.done && (
              <span className="ml-auto text-[11px] text-emerald-600 font-semibold shrink-0">Validé</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
