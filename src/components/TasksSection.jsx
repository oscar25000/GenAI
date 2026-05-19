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
import { CATEGORY_TONE, Card, Pill, PRIORITY_TONE } from './ui.jsx'

const COLUMNS = [
  { id: 'todo', label: 'À faire', icon: Circle },
  { id: 'in_progress', label: 'En cours', icon: Loader2 },
  { id: 'done', label: 'Terminé', icon: CheckCircle2 },
]

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function TasksSection({ project, team, onUpdateTask }) {
  const [view, setView] = useState('list')
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const categories = useMemo(
    () => Array.from(new Set(project.tasks.map((t) => t.category))),
    [project.tasks],
  )

  const filtered = useMemo(() => {
    return project.tasks
      .filter((t) => filterMember === 'all' ? true : t.assignee === filterMember)
      .filter((t) => filterCategory === 'all' ? true : t.category === filterCategory)
      .filter((t) => filterPriority === 'all' ? true : t.priority === filterPriority)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
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
      <div className="flex items-start justify-between gap-6 mb-7">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
            {project.tasks.length} tâches générées par IA
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Plan d'action concret</h1>
          <p className="mt-1 text-[14px] text-slate-500 leading-relaxed">
            Tâches déduites du sujet, priorisées, estimées et auto-assignées selon les compétences de l'équipe.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          <ViewToggle active={view === 'kanban'} onClick={() => setView('kanban')} icon={LayoutGrid} label="Kanban" />
          <ViewToggle active={view === 'list'} onClick={() => setView('list')} icon={List} label="Liste" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Select
          label="Membre"
          value={filterMember}
          onChange={setFilterMember}
          options={[
            { value: 'all', label: "Toute l'équipe" },
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
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Icon
                    className={clsx(
                      'w-3.5 h-3.5',
                      col.id === 'done' && 'text-emerald-500',
                      col.id === 'in_progress' && 'text-indigo-500 animate-spin',
                      col.id === 'todo' && 'text-slate-400',
                    )}
                  />
                  <div className="text-[12px] font-bold text-slate-700">{col.label}</div>
                  <div className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {grouped[col.id].length}
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 p-3 rounded-2xl bg-slate-50">
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
                    <div className="text-[11px] text-slate-400 text-center py-6">Rien ici</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase tracking-widest text-slate-400 font-semibold border-b border-slate-100 bg-slate-50">
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
                className="grid grid-cols-12 px-5 py-3 text-[12.5px] items-center hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="col-span-5">
                  <div className="font-bold text-slate-900">{t.title}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.description}</div>
                </div>
                <div className="col-span-2">
                  <Pill tone={CATEGORY_TONE[t.category]}>{t.category}</Pill>
                </div>
                <div className="col-span-1">
                  <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                </div>
                <div className="col-span-1 text-slate-500">{t.difficulty}/10</div>
                <div className="col-span-1 text-slate-500">{t.hours}h</div>
                <div className="col-span-2">
                  {m && (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 text-white"
                        style={{ background: m.color }}
                      >
                        {m.avatar}
                      </span>
                      <span className="text-slate-700 font-semibold">{m.name}</span>
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
        'px-3 py-1.5 rounded-lg text-[11.5px] flex items-center gap-1.5 font-semibold transition-colors',
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm text-[11.5px] cursor-pointer hover:shadow transition-shadow">
      <span className="text-slate-400 font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-slate-700 font-semibold focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TaskCard({ task, member, onCycle }) {
  return (
    <div className="rounded-xl bg-white shadow-sm p-3.5 hover:shadow transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Pill tone={CATEGORY_TONE[task.category]}>{task.category}</Pill>
        <Pill tone={PRIORITY_TONE[task.priority]}>{task.priority}</Pill>
      </div>
      <div className="text-[13px] font-bold text-slate-900 leading-snug">{task.title}</div>
      <div className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">{task.description}</div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {task.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" /> {task.difficulty}/10
          </span>
        </div>
        {member && (
          <span
            className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold shrink-0 text-white"
            style={{ background: member.color }}
            title={member.name}
          >
            {member.avatar}
          </span>
        )}
      </div>
      <button
        onClick={onCycle}
        className="mt-3 w-full text-[10.5px] font-semibold text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-wider"
      >
        → avancer le statut
      </button>
    </div>
  )
}
