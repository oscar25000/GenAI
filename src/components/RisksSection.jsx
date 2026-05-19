import { ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { Pill, ProgressBar } from './ui.jsx'

const LEVEL_TONE = { high: 'red', medium: 'amber', low: 'default' }
const LEVEL_LABEL = { high: 'Élevé', medium: 'Moyen', low: 'Faible' }
const LEVEL_ORDER = { high: 0, medium: 1, low: 2 }

export default function RisksSection({ project }) {
  const avg = Math.round(project.risks.reduce((s, r) => s + r.score, 0) / project.risks.length)
  const sorted = [...project.risks].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9),
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Détection des risques</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Anticipe avant que ça parte en vrille</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          EpiPilot évalue les risques classiques d'un projet Epitech. Chaque risque vient avec sa mitigation.
        </p>
      </div>

      {/* Score strip */}
      <div className="bg-white rounded-2xl shadow-sm px-8 py-6 mb-8 flex items-center gap-10">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Score global</div>
          <div className="text-[42px] font-bold text-slate-900 leading-none">{avg}</div>
          <div className="text-[13px] text-slate-500 mt-1">
            {avg >= 60 ? 'Vigilance requise' : avg >= 40 ? 'Niveau modéré' : 'Sous contrôle'}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {['high', 'medium', 'low'].map((level) => {
            const count = sorted.filter((r) => r.level === level).length
            return (
              <div key={level} className="flex items-center gap-3">
                <Pill tone={LEVEL_TONE[level]} className="w-20 justify-center">{LEVEL_LABEL[level]}</Pill>
                <div className="text-[13px] text-slate-600 font-semibold w-4">{count}</div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', level === 'high' ? 'bg-red-400' : level === 'medium' ? 'bg-amber-400' : 'bg-slate-300')}
                    style={{ width: `${(count / sorted.length) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_80px_200px] px-6 py-3 border-b border-slate-100 bg-slate-50">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Niveau</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Risque</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Score</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Mitigation</div>
        </div>
        {sorted.map((r, i) => (
          <div
            key={r.id}
            className={clsx(
              'grid grid-cols-[100px_1fr_80px_200px] px-6 py-4 gap-4 items-start',
              i < sorted.length - 1 && 'border-b border-slate-100',
              'hover:bg-slate-50 transition-colors',
            )}
          >
            <div className="pt-0.5">
              <Pill tone={LEVEL_TONE[r.level]}>{LEVEL_LABEL[r.level]}</Pill>
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-slate-900 mb-1">{r.title}</div>
              <div className="text-[12.5px] text-slate-500 leading-relaxed">{r.detail}</div>
            </div>
            <div>
              <div className="text-[15px] font-bold text-slate-900 mb-1">{r.score}</div>
              <ProgressBar
                value={r.score}
                tone={r.level === 'high' ? 'red' : r.level === 'medium' ? 'amber' : 'violet'}
              />
            </div>
            <div className="text-[12px] text-slate-600 leading-relaxed">{r.mitigation}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
