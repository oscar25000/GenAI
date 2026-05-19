import { AlertTriangle, AlertOctagon, Info, Bell } from 'lucide-react'
import clsx from 'clsx'
import { Pill, SEVERITY_TONE } from './ui.jsx'

const ICONS = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: Bell,
  low: Info,
}

const SEVERITY_LABEL = {
  critical: 'Bloquant',
  high: 'Important',
  medium: 'Vigilance',
  low: 'Conseil',
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function WarningsSection({ project }) {
  const sorted = [...project.warnings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  )

  const counts = sorted.reduce((acc, w) => {
    acc[w.severity] = (acc[w.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Pièges à éviter</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">À ne pas oublier</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          Les points critiques détectés dans le sujet — les oublis les plus fréquents en soutenance Epitech.
        </p>
        <div className="flex items-center gap-2 mt-4">
          {Object.entries(counts).map(([sev, n]) => (
            <Pill key={sev} tone={SEVERITY_TONE[sev]}>
              {SEVERITY_LABEL[sev]} · {n}
            </Pill>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_120px] px-6 py-3 border-b border-slate-100 bg-slate-50">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Sévérité</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Point à surveiller</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Catégorie</div>
        </div>
        {sorted.map((w, i) => {
          const Icon = ICONS[w.severity] || Info
          return (
            <div
              key={w.id}
              className={clsx(
                'grid grid-cols-[140px_1fr_120px] px-6 py-4 gap-4 items-start',
                i < sorted.length - 1 && 'border-b border-slate-100',
                'hover:bg-slate-50 transition-colors',
              )}
            >
              <div className="flex items-center gap-2 pt-0.5">
                <Icon
                  className={clsx(
                    'w-3.5 h-3.5 shrink-0',
                    w.severity === 'critical' && 'text-red-500',
                    w.severity === 'high' && 'text-amber-500',
                    w.severity === 'medium' && 'text-sky-500',
                    w.severity === 'low' && 'text-slate-400',
                  )}
                />
                <Pill tone={SEVERITY_TONE[w.severity]}>{SEVERITY_LABEL[w.severity]}</Pill>
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-slate-900 mb-1">{w.title}</div>
                <div className="text-[12.5px] text-slate-500 leading-relaxed">{w.detail}</div>
              </div>
              <div className="pt-0.5">
                <Pill>{w.category}</Pill>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
