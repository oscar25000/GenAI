import { AlertTriangle, AlertOctagon, Info, Bell } from 'lucide-react'
import clsx from 'clsx'
import { Card, Pill, SectionHeader, SEVERITY_TONE } from './ui.jsx'

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

export default function WarningsSection({ project }) {
  const byCat = project.warnings.reduce((acc, w) => {
    acc[w.severity] = (acc[w.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <SectionHeader
        eyebrow="Pièges à éviter"
        title="À ne pas oublier dans ton projet"
        description="Les points critiques que l'IA a détectés dans le sujet — ce sont les oublis les plus fréquents en soutenance Epitech."
        action={
          <div className="flex items-center gap-2">
            {Object.entries(byCat).map(([sev, n]) => (
              <Pill key={sev} tone={SEVERITY_TONE[sev]}>
                {SEVERITY_LABEL[sev]} · {n}
              </Pill>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {project.warnings.map((w) => {
          const Icon = ICONS[w.severity] || Info
          return (
            <Card key={w.id} className="p-5 hover:border-violet-400/30 transition">
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'shrink-0 w-9 h-9 rounded-xl grid place-items-center',
                    w.severity === 'critical' &&
                      'bg-rose-500/15 border border-rose-400/30',
                    w.severity === 'high' &&
                      'bg-amber-400/10 border border-amber-400/30',
                    w.severity === 'medium' &&
                      'bg-violet-500/15 border border-violet-400/30',
                    w.severity === 'low' &&
                      'bg-white/5 border border-white/10',
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4',
                      w.severity === 'critical' && 'text-rose-300',
                      w.severity === 'high' && 'text-amber-300',
                      w.severity === 'medium' && 'text-violet-200',
                      w.severity === 'low' && 'text-violet-200/70',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[14px] font-medium leading-snug">
                      {w.title}
                    </div>
                    <Pill tone={SEVERITY_TONE[w.severity]}>
                      {SEVERITY_LABEL[w.severity]}
                    </Pill>
                    <Pill>{w.category}</Pill>
                  </div>
                  <p className="text-[12.5px] text-violet-200/70 mt-1.5 leading-relaxed">
                    {w.detail}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
