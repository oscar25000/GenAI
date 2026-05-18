import {
  Clock,
  Gauge as GaugeIcon,
  ShieldAlert,
  CalendarDays,
  ArrowRight,
  Target,
  Sparkles,
} from 'lucide-react'
import { Card, Gauge, Pill, ProgressBar, SectionHeader } from './ui.jsx'

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export default function OverviewSection({ project, team, onJump }) {
  const remaining = daysUntil(project.deadline)
  const tasksDone = project.tasks.filter((t) => t.status === 'done').length
  const tasksInProgress = project.tasks.filter(
    (t) => t.status === 'in_progress',
  ).length

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong p-8">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-violet-400/10 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Pill tone="violet">
              <Sparkles className="w-3 h-3" /> Analyse IA terminée
            </Pill>
            <Pill tone="default">PDF · {project.sourcePdf}</Pill>
          </div>
          <h1 className="text-[34px] font-semibold tracking-tight leading-tight">
            {project.name}
            <span className="ml-3 gradient-text">
              prêt à être exécuté
            </span>
          </h1>
          <p className="mt-2 text-[14px] text-violet-200/70 max-w-2xl">
            {project.summary.goal}
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <HeroStat
              icon={<GaugeIcon className="w-3.5 h-3.5" />}
              label="Difficulté"
              value={`${project.difficulty}/10`}
            />
            <HeroStat
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
              label="Risque"
              value={`${project.riskScore}/100`}
            />
            <HeroStat
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Temps estimé"
              value={`${project.estimatedHours} h`}
            />
            <HeroStat
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label="Jours restants"
              value={`${remaining} j`}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => onJump('tasks')}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-medium shadow-glow hover:from-violet-400 hover:to-violet-600 transition flex items-center gap-2"
            >
              Voir les tâches <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onJump('planning')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 text-sm transition"
            >
              Ouvrir le planning
            </button>
            <button
              onClick={() => onJump('warnings')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 text-sm transition"
            >
              À ne pas oublier
            </button>
          </div>
        </div>
      </div>

      {/* Gauges + progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 flex items-center gap-6">
          <Gauge value={project.difficulty * 10} label="Difficulté" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
              Difficulté projet
            </div>
            <div className="text-[15px] font-medium mt-1">
              Projet ambitieux mais réalisable
            </div>
            <p className="text-[12px] text-violet-200/60 mt-1 max-w-[260px]">
              Complexité tirée par le moteur AREA et le client mobile.
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-6">
          <Gauge value={project.riskScore} label="Risque" color="#F59E0B" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
              Score de risque
            </div>
            <div className="text-[15px] font-medium mt-1">
              À surveiller cette semaine
            </div>
            <p className="text-[12px] text-violet-200/60 mt-1 max-w-[260px]">
              Mobile sous-estimé, dépendance backend. Voir l'onglet Risques.
            </p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
            Progression globale
          </div>
          <div className="mt-1 text-[28px] font-semibold tracking-tight">
            {project.progress}%
          </div>
          <ProgressBar value={project.progress} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Total" value={project.tasks.length} />
            <MiniStat label="En cours" value={tasksInProgress} />
            <MiniStat label="Terminées" value={tasksDone} />
          </div>
        </Card>
      </div>

      {/* Quick sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-300" />
              <div className="text-[13px] font-medium">Livrables attendus</div>
            </div>
            <button
              onClick={() => onJump('summary')}
              className="text-[11px] text-violet-300/70 hover:text-violet-100 flex items-center gap-1"
            >
              Détail <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ul className="space-y-2.5">
            {project.summary.deliverables.slice(0, 5).map((d, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[13px] text-violet-100/90">{d}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-medium">Charge équipe</div>
            <button
              onClick={() => onJump('team')}
              className="text-[11px] text-violet-300/70 hover:text-violet-100 flex items-center gap-1"
            >
              Équipe <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {team.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-medium"
                      style={{ background: m.color }}
                    >
                      {m.avatar}
                    </span>
                    {m.name}
                  </div>
                  <span className="text-violet-300/70">{m.hours} h</span>
                </div>
                <ProgressBar value={m.load} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function HeroStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-300/70">
        {icon}
        {label}
      </div>
      <div className="text-[20px] font-semibold tracking-tight mt-1">
        {value}
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] py-2">
      <div className="text-[18px] font-semibold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-violet-300/60">
        {label}
      </div>
    </div>
  )
}
