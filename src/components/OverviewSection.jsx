import { ArrowRight, Sparkles } from 'lucide-react'
import { ProgressBar, Pill } from './ui.jsx'

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export default function OverviewSection({ project, team, onJump }) {
  const remaining = daysUntil(project.deadline)
  const tasksDone = project.tasks.filter((t) => t.status === 'done').length
  const tasksInProgress = project.tasks.filter((t) => t.status === 'in_progress').length
  const deadline = new Date(project.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Title */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Pill tone="violet"><Sparkles className="w-3 h-3" /> Analyse IA terminée</Pill>
        </div>
        <h1 className="text-[32px] font-bold text-slate-900 leading-tight tracking-tight">{project.name}</h1>
        <p className="mt-2 text-[15px] text-slate-500 max-w-2xl leading-relaxed">{project.summary.goal}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 bg-white rounded-2xl shadow-sm mb-10 overflow-hidden">
        <StatCell label="Progression" value={`${project.progress}%`} />
        <StatCell label="Difficulté" value={`${project.difficulty}/10`} />
        <StatCell label="Risque" value={`${project.riskScore}/100`} />
        <StatCell label="Jours restants" value={`${remaining}`} sub={deadline} />
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Avancement</span>
          <span className="text-[12px] text-slate-400">{tasksDone} terminées · {tasksInProgress} en cours · {project.tasks.length} total</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      {/* 2-col content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Deliverables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Livrables attendus</h2>
            <button
              onClick={() => onJump('summary')}
              className="text-[12px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-3">
            {project.summary.deliverables.slice(0, 6).map((d, i) => (
              <li key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold grid place-items-center">
                  {i + 1}
                </span>
                <span className="text-[13.5px] text-slate-700 leading-snug">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Team load */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Charge équipe</h2>
            <button
              onClick={() => onJump('team')}
              className="text-[12px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Détails <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {team.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: m.color }}
                    >
                      {m.avatar}
                    </span>
                    <span className="text-[13.5px] font-semibold text-slate-800">{m.name}</span>
                  </div>
                  <span className="text-[12px] text-slate-400">{m.hours}h · {m.load}%</span>
                </div>
                <ProgressBar value={m.load} tone={m.load > 35 ? 'amber' : 'violet'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap gap-3">
        <button
          onClick={() => onJump('tasks')}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[13px] font-semibold text-white transition-colors flex items-center gap-2"
        >
          Voir les tâches <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onJump('planning')}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-700 transition-colors"
        >
          Planning
        </button>
        <button
          onClick={() => onJump('warnings')}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-700 transition-colors"
        >
          Warnings
        </button>
        <button
          onClick={() => onJump('risks')}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-700 transition-colors"
        >
          Risques
        </button>
      </div>
    </div>
  )
}

function StatCell({ label, value, sub }) {
  return (
    <div className="px-8 py-6">
      <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{label}</div>
      <div className="text-[34px] font-bold text-slate-900 leading-none">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1.5">{sub}</div>}
    </div>
  )
}
