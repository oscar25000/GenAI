import { Hammer, Compass, Lock, PackageCheck } from 'lucide-react'
import { Card, SectionHeader } from './ui.jsx'

const BLOCKS = [
  {
    key: 'goal',
    title: 'Objectif du projet',
    icon: Compass,
    accent: 'from-violet-500/20',
  },
  {
    key: 'whatToBuild',
    title: 'Ce qu\'il faut construire',
    icon: Hammer,
    accent: 'from-violet-500/15',
  },
  {
    key: 'constraints',
    title: 'Contraintes principales',
    icon: Lock,
    accent: 'from-amber-500/15',
  },
  {
    key: 'deliverables',
    title: 'Livrables attendus',
    icon: PackageCheck,
    accent: 'from-emerald-500/15',
  },
]

export default function SummarySection({ project }) {
  return (
    <div>
      <SectionHeader
        eyebrow="Analyse intelligente"
        title="Résumé du sujet, dégrossi par EpiPilot"
        description="Les informations clés extraites du PDF, séparées de tout le bruit. Idéal pour aligner toute l'équipe en 2 minutes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {BLOCKS.map((b) => {
          const Icon = b.icon
          const content = project.summary[b.key]
          return (
            <Card key={b.key} className="p-6 relative overflow-hidden">
              <div
                className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl bg-gradient-to-br ${b.accent} to-transparent`}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
                    <Icon className="w-4 h-4 text-violet-300" />
                  </div>
                  <div className="text-[13px] font-medium">{b.title}</div>
                </div>
                {typeof content === 'string' ? (
                  <p className="text-[14px] leading-relaxed text-violet-100/90">
                    {content}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {content.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[13px] leading-relaxed"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        <span className="text-violet-100/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
