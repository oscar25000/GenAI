import { Flag, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import { Card, Pill, SectionHeader, CATEGORY_TONE } from './ui.jsx'

export default function PlanningSection({ project }) {
  return (
    <div>
      <SectionHeader
        eyebrow="Roadmap générée"
        title="Planning de travail réaliste"
        description="Découpage hebdomadaire calculé à partir de la deadline, du nombre de membres et de la charge estimée. Ajustable au besoin."
        action={
          <Pill tone="violet">
            <CalendarIcon className="w-3 h-3" /> Deadline ·{' '}
            {new Date(project.deadline).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
            })}
          </Pill>
        }
      />

      <div className="relative">
        <div className="absolute left-[26px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-400/40 via-violet-500/20 to-transparent" />

        <div className="space-y-6">
          {project.planning.map((sprint, idx) => {
            const tasks = sprint.taskIds
              .map((id) => project.tasks.find((t) => t.id === id))
              .filter(Boolean)
            return (
              <div key={sprint.id} className="relative pl-16">
                <div className="absolute left-0 top-2 w-[52px] flex justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-violet-700/10 border border-violet-400/30 grid place-items-center shadow-glow text-[13px] font-semibold">
                    {idx + 1}
                  </div>
                </div>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
                        {sprint.range}
                      </div>
                      <div className="text-[16px] font-semibold tracking-tight mt-0.5">
                        {sprint.label}
                      </div>
                      <p className="text-[12.5px] text-violet-200/70 mt-1">
                        {sprint.theme}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sprint.milestones.map((m, i) => (
                        <Pill key={i} tone="violet">
                          <Flag className="w-3 h-3" /> {m}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <ChevronRight className="w-3 h-3 text-violet-300/60" />
                        <span className="text-[12.5px] flex-1 truncate">
                          {t.title}
                        </span>
                        <Pill tone={CATEGORY_TONE[t.category]}>
                          {t.category}
                        </Pill>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
