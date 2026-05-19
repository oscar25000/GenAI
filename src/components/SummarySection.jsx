import { Lock, PackageCheck, Hammer, Clock, Gauge, ShieldAlert, CalendarDays } from 'lucide-react'

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export default function SummarySection({ project }) {
  const remaining = daysUntil(project.deadline)
  const deadline = new Date(project.deadline).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const whatToBuild = Array.isArray(project.summary.whatToBuild)
    ? project.summary.whatToBuild
    : [project.summary.whatToBuild]
  const constraints = Array.isArray(project.summary.constraints)
    ? project.summary.constraints
    : [project.summary.constraints]

  return (
    <div className="space-y-8">

      {/* Hero — goal statement */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex">
          <div className="w-1 bg-indigo-600 shrink-0" />
          <div className="px-8 py-8">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
              Objectif du projet
            </div>
            <h1 className="text-[26px] font-bold text-slate-900 leading-snug mb-3">
              {project.name}
            </h1>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-3xl">
              {project.summary.goal}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
        <KpiCell icon={Gauge} label="Difficulté" value={`${project.difficulty}/10`} color="text-indigo-600" />
        <KpiCell icon={ShieldAlert} label="Risque" value={`${project.riskScore}/100`} color="text-amber-500" />
        <KpiCell icon={Clock} label="Charge totale" value={`${project.estimatedHours}h`} color="text-slate-600" />
        <KpiCell icon={CalendarDays} label="Jours restants" value={`${remaining} j`} sub={deadline} color="text-emerald-600" />
      </div>

      {/* What to build + Constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* What to build */}
        <div className="bg-white rounded-2xl shadow-sm p-7">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 grid place-items-center shrink-0">
              <Hammer className="w-4 h-4 text-white" />
            </div>
            <div className="text-[14px] font-bold text-slate-900">Ce qu'il faut construire</div>
          </div>
          <ol className="space-y-4">
            {whatToBuild.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="shrink-0 text-[22px] font-black text-slate-100 leading-none w-8 text-right tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13.5px] text-slate-700 leading-snug pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Constraints */}
        <div className="bg-white rounded-2xl shadow-sm p-7">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-amber-500 grid place-items-center shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div className="text-[14px] font-bold text-slate-900">Contraintes techniques</div>
          </div>
          <ul className="space-y-3">
            {constraints.map((item, i) => (
              <li key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[13.5px] text-slate-700 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Deliverables — editorial numbered list */}
      <div className="bg-white rounded-2xl shadow-sm p-7">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 grid place-items-center shrink-0">
            <PackageCheck className="w-4 h-4 text-white" />
          </div>
          <div className="text-[14px] font-bold text-slate-900">Livrables attendus</div>
          <span className="ml-auto text-[11px] text-slate-400 font-semibold">{project.summary.deliverables.length} éléments</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
          {project.summary.deliverables.map((d, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0">
              <span className="shrink-0 text-[28px] font-black text-slate-100 leading-none tabular-nums w-10 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[13.5px] text-slate-700 leading-snug pt-2">{d}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function KpiCell({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="px-7 py-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
      </div>
      <div className="text-[28px] font-bold text-slate-900 leading-none">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1.5">{sub}</div>}
    </div>
  )
}
