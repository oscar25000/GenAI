import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Card, SectionHeader, ProgressBar } from './ui.jsx'

export default function ChecklistSection({ project, onToggle }) {
  const done = project.checklist.filter((c) => c.done).length
  const pct = Math.round((done / project.checklist.length) * 100)

  return (
    <div>
      <SectionHeader
        eyebrow="Avant le rendu"
        title="Checklist finale de soutenance"
        description="Les vérifications systématiques avant de pousser ton tag et de passer devant les jurys. Si tu coches tout : tu es prêt."
      />

      <Card className="p-6 mb-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[12px] text-violet-300/70">
              {done}/{project.checklist.length} éléments validés
            </div>
            <div className="text-[24px] font-semibold tracking-tight gradient-text mt-0.5">
              {pct}% prêt
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
              Statut
            </div>
            <div className="text-[14px] font-medium mt-0.5">
              {pct === 100
                ? 'Prêt à rendre ✓'
                : pct >= 70
                  ? 'Quasi prêt'
                  : pct >= 30
                    ? 'En progression'
                    : 'À démarrer'}
            </div>
          </div>
        </div>
        <ProgressBar value={pct} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {project.checklist.map((c) => (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            className={clsx(
              'group text-left flex items-center gap-3 px-4 py-3 rounded-2xl border transition',
              c.done
                ? 'bg-emerald-400/5 border-emerald-400/20'
                : 'bg-white/[0.03] border-white/5 hover:border-violet-400/30',
            )}
          >
            <div
              className={clsx(
                'w-5 h-5 rounded-md border grid place-items-center shrink-0 transition',
                c.done
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300'
                  : 'border-white/15 group-hover:border-violet-400/60',
              )}
            >
              {c.done && <Check className="w-3 h-3 text-ink-950" />}
            </div>
            <span
              className={clsx(
                'text-[13px] transition',
                c.done
                  ? 'text-violet-200/60 line-through'
                  : 'text-violet-50',
              )}
            >
              {c.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
