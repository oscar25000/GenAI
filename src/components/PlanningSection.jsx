import { Flag } from 'lucide-react'
import { Pill, CATEGORY_TONE } from './ui.jsx'

export default function PlanningSection({ project }) {
  const deadline = new Date(project.deadline).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Roadmap générée</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Planning de travail</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          Découpage hebdomadaire calculé à partir de la deadline du <strong className="text-slate-700 font-semibold">{deadline}</strong>.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {project.planning.map((sprint, idx) => {
          const tasks = sprint.taskIds
            .map((id) => project.tasks.find((t) => t.id === id))
            .filter(Boolean)

          return (
            <div key={sprint.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Sprint header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-slate-900 grid place-items-center text-white text-[12px] font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-slate-900">{sprint.label}</span>
                    <span className="text-[12px] text-slate-400">{sprint.range}</span>
                    <span className="text-[12px] text-slate-500 italic">{sprint.theme}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {sprint.milestones.map((m, i) => (
                    <Pill key={i} tone="amber">
                      <Flag className="w-2.5 h-2.5" /> {m}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-slate-50">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-[13px] text-slate-700 flex-1">{t.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill tone={CATEGORY_TONE[t.category]}>{t.category}</Pill>
                      <span className="text-[11px] text-slate-400">{t.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
