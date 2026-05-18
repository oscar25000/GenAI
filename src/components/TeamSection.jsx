import { UserPlus, Trash2 } from 'lucide-react'
import { Card, Pill, ProgressBar, SectionHeader } from './ui.jsx'

export default function TeamSection({ project, team }) {
  return (
    <div>
      <SectionHeader
        eyebrow="Auto-assignation IA"
        title="Équipe & compétences"
        description="EpiPilot a réparti les tâches selon les compétences déclarées. Tu peux ajuster manuellement à tout moment."
        action={
          <button className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 text-[12px] flex items-center gap-2 transition">
            <UserPlus className="w-3.5 h-3.5" /> Ajouter un membre
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {team.map((m) => {
          const tasks = project.tasks.filter((t) => t.assignee === m.id)
          return (
            <Card key={m.id} className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl grid place-items-center text-[15px] font-semibold shadow-glow"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}, #2A1576)`,
                  }}
                >
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[16px] font-medium">{m.name}</div>
                      <div className="text-[11.5px] text-violet-300/60">
                        {tasks.length} tâches · {m.hours}h estimées
                      </div>
                    </div>
                    <button className="text-violet-300/40 hover:text-rose-300 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.skills.map((s) => (
                      <Pill key={s} tone="violet">
                        {s}
                      </Pill>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-violet-300/60">Charge relative</span>
                      <span className="text-violet-200/90">{m.load}%</span>
                    </div>
                    <ProgressBar
                      value={m.load}
                      tone={m.load > 35 ? 'amber' : 'violet'}
                    />
                  </div>

                  <div className="mt-4 space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-[11.5px] text-violet-100/80 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5"
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="text-violet-300/60 shrink-0 ml-2">
                          {t.hours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
