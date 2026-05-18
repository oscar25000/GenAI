import clsx from 'clsx'

export function Card({ className, children }) {
  return (
    <div className={clsx('glass rounded-2xl shadow-card', className)}>
      {children}
    </div>
  )
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-[13px] text-violet-200/60 mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub, accent }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
        {label}
      </div>
      <div
        className={clsx(
          'text-[28px] font-semibold tracking-tight mt-1',
          accent === 'violet' && 'gradient-text',
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[12px] text-violet-200/60 mt-0.5">{sub}</div>
      )}
    </Card>
  )
}

export function Pill({ children, tone = 'default', className }) {
  const tones = {
    default: 'bg-white/5 text-violet-100/80 border-white/10',
    violet: 'bg-violet-500/15 text-violet-200 border-violet-400/30',
    amber: 'bg-amber-400/10 text-amber-200 border-amber-400/30',
    red: 'bg-rose-500/10 text-rose-200 border-rose-400/30',
    emerald: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/30',
    blue: 'bg-sky-400/10 text-sky-200 border-sky-400/30',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border tracking-wide',
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
    violet: 'from-violet-400 to-violet-600',
    emerald: 'from-emerald-400 to-emerald-600',
    amber: 'from-amber-300 to-amber-500',
    red: 'from-rose-400 to-rose-600',
  }
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className={clsx('h-full bg-gradient-to-r', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Gauge({ value, label, color = '#8257FF' }) {
  // Circular gauge using SVG. value 0-100.
  const r = 38
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          fill="none"
        />
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
          <div className="text-[22px] font-semibold tracking-tight">{value}</div>
          {label && (
            <div className="text-[10px] uppercase tracking-wider text-violet-300/60">
              {label}
            </div>
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
