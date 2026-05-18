import { useMemo, useState } from 'react'
import {
  LayoutGrid,
  List,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import {
  CATEGORY_TONE,
  Card,
  Pill,
  PRIORITY_TONE,
  SectionHeader,
} from './ui.jsx'

const COLUMNS = [
  { id: 'todo', label: 'À faire', icon: Circle },
  { id: 'in_progress', label: 'En cours', icon: Loader2 },
  { id: 'done', label: 'Terminé', icon: CheckCircle2 },
]

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function TasksSection({ project, team, onUpdateTask }) {
  const [view, setView] = useState('kanban')
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const categories = useMemo(
    () => Array.from(new Set(project.tasks.map((t) => t.category))),
    [project.tasks],
  )

  const filtered = useMemo(() => {
    return project.tasks
      .filter((t) =>
        filterMember === 'all' ? true : t.assignee === filterMember,
      )
      .filter((t) =>
        filterCategory === 'all' ? true : t.category === filterCategory,
      )
      .filter((t) =>
        filterPriority === 'all' ? true : t.priority === filterPriority,
      )
      .sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 9) -
          (PRIORITY_ORDER[b.priority] ?? 9),
      )
  }, [project.tasks, filterMember, filterCategory, filterPriority])

  const grouped = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = filtered.filter((t) => t.status === col.id)
      return acc
    }, {})
  }, [filtered])

  function memberById(id) {
    return team.find((m) => m.id === id)
  }

  return (
    <div>
      <SectionHeader
        eyebrow={`${project.tasks.length} tâches générées par IA`}
        title="Plan d'action concret"
        description="Tâches déduites du sujet, priorisées, estimées et auto-assignées selon les compétences de l'équipe."
        action={
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <ViewToggle
              active={view === 'kanban'}
              onClick={() => setView('kanban')}
              icon={LayoutGrid}
              label="Kanban"
            />
            <ViewToggle
              active={view === 'list'}
              onClick={() => setView('list')}
              icon={List}
              label="Liste"
            />
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Select
          label="Membre"
          value={filterMember}
          onChange={setFilterMember}
          options={[
            { value: 'all', label: 'Toute l\'équipe' },
            ...team.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
        <Select
          label="Catégorie"
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: 'all', label: 'Toutes' },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          label="Priorité"
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'critical', label: 'Critique' },
            { value: 'high', label: 'Haute' },
            { value: 'medium', label: 'Moyenne' },
            { value: 'low', label: 'Basse' },
          ]}
        />
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const Icon = col.icon
            return (
              <div key={col.id} className="flex flex-col min-h-[60vh]">
                <div className="flex items-center gap-2 px-1 mb-3">
                  <Icon
                    className={clsx(
                      'w-3.5 h-3.5',
                      col.id === 'done' && 'text-emerald-300',
                      col.id === 'in_progress' && 'text-violet-300 animate-spin',
                      col.id === 'todo' && 'text-violet-300/60',
                    )}
                  />
                  <div className="text-[12px] font-medium text-violet-100/90">
                    {col.label}
                  </div>
                  <div className="text-[11px] text-violet-300/60">
                    {grouped[col.id].length}
                  </div>
                </div>
                <div className="flex-1 space-y-3 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  {grouped[col.id].map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      member={memberById(t.assignee)}
                      onCycle={() =>
                        onUpdateTask(t.id, {
                          status:
                            t.status === 'todo'
                              ? 'in_progress'
                              : t.status === 'in_progress'
                                ? 'done'
                                : 'todo',
                        })
                      }
                    />
                  ))}
                  {grouped[col.id].length === 0 && (
                    <div className="text-[11px] text-violet-300/40 text-center py-6">
                      Rien ici
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 text-[10.5px] uppercase tracking-wider text-violet-300/60 border-b border-white/5">
            <div className="col-span-5">Tâche</div>
            <div className="col-span-2">Catégorie</div>
            <div className="col-span-1">Priorité</div>
            <div className="col-span-1">Diff.</div>
            <div className="col-span-1">Estim.</div>
            <div className="col-span-2">Assigné</div>
          </div>
          {filtered.map((t) => {
            const m = memberById(t.assignee)
            return (
              <div
                key={t.id}
                className="grid grid-cols-12 px-5 py-3 text-[12.5px] items-center hover:bg-white/[0.02] transition border-b border-white/5 last:border-0"
              >
                <div className="col-span-5">
                  <div className="font-medium text-violet-50">{t.title}</div>
                  <div className="text-[11px] text-violet-300/60 truncate">
                    {t.description}
                  </div>
                </div>
                <div className="col-span-2">
                  <Pill tone={CATEGORY_TONE[t.category]}>{t.category}</Pill>
                </div>
                <div className="col-span-1">
                  <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                </div>
                <div className="col-span-1 text-violet-200/80">
                  {t.difficulty}/10
                </div>
                <div className="col-span-1 text-violet-200/80">{t.hours}h</div>
                <div className="col-span-2">
                  {m && (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-medium"
                        style={{ background: m.color }}
                      >
                        {m.avatar}
                      </span>
                      <span className="text-violet-100/90">{m.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function ViewToggle({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-lg text-[11.5px] flex items-center gap-1.5 transition',
        active
          ? 'bg-violet-500/20 text-violet-100 border border-violet-400/30'
          : 'text-violet-200/70 hover:text-violet-50',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11.5px]">
      <span className="text-violet-300/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-violet-100 focus:outline-none"
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="bg-ink-800 text-violet-100"
          >
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TaskCard({ task, member, onCycle }) {
  return (
    <div className="rounded-xl bg-ink-800/80 border border-white/5 p-3.5 hover:border-violet-400/30 transition group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Pill tone={CATEGORY_TONE[task.category]}>{task.category}</Pill>
        <Pill tone={PRIORITY_TONE[task.priority]}>{task.priority}</Pill>
      </div>
      <div className="text-[13px] font-medium leading-snug text-violet-50">
        {task.title}
      </div>
      <div className="text-[11.5px] text-violet-300/70 mt-1 leading-relaxed">
        {task.description}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3 text-violet-200/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {task.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" /> {task.difficulty}/10
          </span>
        </div>
        {member && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-medium"
              style={{ background: member.color }}
              title={member.name}
            >
              {member.avatar}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onCycle}
        className="mt-3 w-full text-[10.5px] uppercase tracking-wider text-violet-300/60 hover:text-violet-200 opacity-0 group-hover:opacity-100 transition"
      >
        → faire avancer le statut
      </button>
    </div>
  )
}
