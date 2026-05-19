import clsx from 'clsx'

export function Card({ className, children }) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-sm', className)}>
      {children}
    </div>
  )
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-7">
      <div>
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[22px] font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="text-[13px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub }) {
  return (
    <Card className="p-5">
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</div>
      <div className="text-[26px] font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-[12px] text-slate-400 mt-0.5">{sub}</div>}
    </Card>
  )
}

export function Pill({ children, tone = 'default', className }) {
  const tones = {
    default: 'bg-slate-100 text-slate-600',
    violet: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium',
        tones[tone] || tones.default,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({ value, tone = 'violet' }) {
  const tones = {
    violet: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
  }
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Gauge({ value, label, color = '#4f46e5' }) {
  const r = 38
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative w-[110px] h-[110px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="#f1f5f9" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[20px] font-bold text-slate-900">{value}</div>
          {label && (
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">{label}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export const CATEGORY_TONE = {
  setup: 'violet',
  frontend: 'blue',
  backend: 'violet',
  database: 'violet',
  security: 'red',
  tests: 'emerald',
  qa: 'emerald',
  documentation: 'amber',
  devops: 'violet',
  mobile: 'blue',
  design: 'amber',
  soutenance: 'amber',
}

export const PRIORITY_TONE = {
  critical: 'red',
  high: 'amber',
  medium: 'violet',
  low: 'default',
}

export const SEVERITY_TONE = {
  critical: 'red',
  high: 'amber',
  medium: 'violet',
  low: 'default',
}
