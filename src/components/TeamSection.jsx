import { ProgressBar } from './ui.jsx'

export default function TeamSection({ project, team }) {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Auto-assignation IA</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Équipe & compétences</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          Epilot a réparti les tâches selon les compétences déclarées. Tu peux ajuster manuellement à tout moment.
        </p>
      </div>

      {/* Team table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="grid grid-cols-[200px_80px_1fr_200px] px-6 py-3 border-b border-slate-100 bg-slate-50">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Membre</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Tâches</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Charge</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Compétences</div>
        </div>
        {team.map((m, i) => {
          const tasks = project.tasks.filter((t) => t.assignee === m.id)
          return (
            <div
              key={m.id}
              className={`grid grid-cols-[200px_80px_1fr_200px] px-6 py-4 gap-4 items-center hover:bg-slate-50 transition-colors ${i < team.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl grid place-items-center text-[14px] font-bold shrink-0 text-white"
                  style={{ background: m.color }}
                >
                  {m.avatar}
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-slate-900">{m.name}</div>
                  <div className="text-[11px] text-slate-400">{m.hours}h estimées</div>
                </div>
              </div>
              <div className="text-[15px] font-bold text-slate-900">{tasks.length}</div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-slate-500">{m.load}%</span>
                </div>
                <ProgressBar value={m.load} tone={m.load > 35 ? 'amber' : 'violet'} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.skills.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task assignments per member */}
      {team.map((m) => {
        const tasks = project.tasks.filter((t) => t.assignee === m.id)
        if (!tasks.length) return null
        return (
          <div key={m.id} className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-6 h-6 rounded-lg grid place-items-center text-[11px] font-bold shrink-0 text-white"
                style={{ background: m.color }}
              >
                {m.avatar}
              </div>
              <span className="text-[13px] font-bold text-slate-800">{m.name}</span>
              <span className="text-[12px] text-slate-400">{tasks.length} tâches</span>
            </div>
            <div className="space-y-1">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                >
                  <span className="text-[13px] text-slate-700">{t.title}</span>
                  <span className="text-[12px] text-slate-400 shrink-0 ml-4">{t.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
