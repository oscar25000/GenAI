import { ShieldAlert, Lightbulb } from 'lucide-react'
import clsx from 'clsx'
import { Card, Pill, ProgressBar, SectionHeader, Gauge } from './ui.jsx'

const LEVEL_TONE = {
  high: 'red',
  medium: 'amber',
  low: 'violet',
}
const LEVEL_LABEL = {
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
}

export default function RisksSection({ project }) {
  const avg = Math.round(
    project.risks.reduce((s, r) => s + r.score, 0) / project.risks.length,
  )
  return (
    <div>
      <SectionHeader
        eyebrow="Détection des risques"
        title="Anticipe avant que ça parte en vrille"
        description="EpiPilot évalue les risques classiques d'un projet Epitech : ambition, dépendance, tests, soutenance. Chaque risque vient avec sa mitigation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-6 flex items-center gap-6 lg:col-span-1">
          <Gauge value={avg} label="Risque" color="#F59E0B" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
              Score global de risque
            </div>
            <div className="text-[16px] font-medium mt-1">
              {avg >= 60 ? 'Vigilance' : avg >= 40 ? 'Modéré' : 'Sous contrôle'}
            </div>
            <p className="text-[12px] text-violet-200/60 mt-1 max-w-[240px]">
              Moyenne pondérée des risques détectés dans le sujet et la
              répartition équipe.
            </p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="text-[13px] font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-300" /> Conseils prioritaires
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {project.risks
              .filter((r) => r.level !== 'low')
              .slice(0, 4)
              .map((r) => (
                <li
                  key={r.id}
                  className="text-[12.5px] text-violet-100/90 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 leading-relaxed"
                >
                  <span className="text-violet-300/80">→</span> {r.mitigation}
                </li>
              ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {project.risks.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start gap-3">
              <div
                className={clsx(
                  'w-9 h-9 rounded-xl grid place-items-center shrink-0',
                  r.level === 'high' &&
                    'bg-rose-500/15 border border-rose-400/30',
                  r.level === 'medium' &&
                    'bg-amber-400/10 border border-amber-400/30',
                  r.level === 'low' &&
                    'bg-violet-500/10 border border-violet-400/30',
                )}
              >
                <ShieldAlert
                  className={clsx(
                    'w-4 h-4',
                    r.level === 'high' && 'text-rose-300',
                    r.level === 'medium' && 'text-amber-300',
                    r.level === 'low' && 'text-violet-200',
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[14px] font-medium">{r.title}</div>
                  <Pill tone={LEVEL_TONE[r.level]}>{LEVEL_LABEL[r.level]}</Pill>
                </div>
                <p className="text-[12.5px] text-violet-200/70 mt-1.5 leading-relaxed">
                  {r.detail}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-violet-300/60">Score</span>
                    <span className="text-violet-200">{r.score}/100</span>
                  </div>
                  <ProgressBar
                    value={r.score}
                    tone={
                      r.level === 'high'
                        ? 'red'
                        : r.level === 'medium'
                          ? 'amber'
                          : 'violet'
                    }
                  />
                </div>
                <div className="mt-3 text-[12px] text-violet-100/90 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-400/20">
                  <span className="text-violet-300/80 text-[10.5px] uppercase tracking-wider mr-2">
                    Mitigation
                  </span>
                  {r.mitigation}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
