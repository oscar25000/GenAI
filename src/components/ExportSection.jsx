import { useMemo, useState } from 'react'
import { FileText, Copy, Check, Download } from 'lucide-react'

/* ── Brand logos (inline SVG) ── */
function GitHubLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function JiraLogo() {
  return (
    <svg viewBox="-0.5 -0.5 13.5 18.5" className="w-5 h-5" fill="currentColor">
      <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215l2.56 2.559V14.728l-2.56-2.56v-2.56h3.78v6.4a5.218 5.218 0 005.218 5.218zm.857-3.83L9.87 5.124A5.218 5.218 0 004.655-.09v2.56l2.56 2.56v6.4h3.777V4.695z" />
    </svg>
  )
}

function NotionLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  )
}

function TrelloLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-7.2c0 .795-.645 1.44-1.44 1.44H15c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v6.42z" />
    </svg>
  )
}

function GoogleCalendarLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="1" y="3" width="22" height="20" rx="2" fill="white" />
      <rect x="1" y="3" width="22" height="5.5" rx="2" fill="#4285F4" />
      <rect x="1" y="6" width="22" height="2.5" fill="#4285F4" />
      <path d="M5 14h3v2H5zm0 4h3v2H5zm5-4h4v2h-4zm0 4h4v2h-4zm6-4h3v2h-3z" fill="#34A853" />
      <path d="M16 14h3v2h-3z" fill="#FBBC04" />
      <path d="M5 14h3v2H5z" fill="#EA4335" />
      <rect x="1" y="3" width="22" height="20" rx="2" stroke="#dadce0" strokeWidth="1" fill="none" />
      <line x1="1" y1="8.5" x2="23" y2="8.5" stroke="#dadce0" strokeWidth="0.5" />
      <rect x="7" y="1" width="2" height="4" rx="1" fill="#4285F4" />
      <rect x="15" y="1" width="2" height="4" rx="1" fill="#4285F4" />
    </svg>
  )
}

/* ── Data ── */
const PROJECT_TOOLS = [
  {
    id: 'github',
    Logo: GitHubLogo,
    title: 'GitHub Issues',
    bg: 'bg-[#24292e]',
    features: ['Une issue par tâche', 'Labels catégorie & priorité', 'Milestones par sprint'],
  },
  {
    id: 'jira',
    Logo: JiraLogo,
    title: 'Jira',
    bg: 'bg-[#0052CC]',
    features: ['Backlog complet priorisé', 'Sprints pré-configurés', 'Story points estimés'],
  },
  {
    id: 'notion',
    Logo: NotionLogo,
    title: 'Notion',
    bg: 'bg-[#000000]',
    features: ['Database de tâches', 'Page de synthèse', 'Tableau de bord équipe'],
  },
  {
    id: 'trello',
    Logo: TrelloLogo,
    title: 'Trello',
    bg: 'bg-[#0079BF]',
    features: ['Board To do / En cours / Done', 'Cards par tâche', 'Étiquettes par catégorie'],
  },
  {
    id: 'calendar',
    Logo: GoogleCalendarLogo,
    title: 'Google Calendar',
    bg: 'bg-white border border-slate-200',
    textColor: 'text-slate-700',
    features: ['Sprints comme événements', 'Jalons & milestones', 'Deadline finale'],
  },
]

const DOCUMENTS = [
  {
    id: 'markdown',
    icon: FileText,
    title: 'Markdown',
    ext: '.md',
    mime: 'text/markdown',
    desc: 'Plan complet prêt à coller dans le README ou Notion. Inclut les tâches, le planning et la checklist.',
    canCopy: true,
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'PDF',
    ext: '.pdf',
    mime: 'application/json',
    desc: "Document de présentation pour les coachs et la soutenance. Synthèse exécutive du projet.",
    canCopy: false,
  },
]

function buildMarkdown(project) {
  const lines = []
  lines.push(`# ${project.name}`)
  lines.push('')
  lines.push(`> ${project.summary.goal}`)
  lines.push('')
  lines.push(`**Deadline** · ${new Date(project.deadline).toLocaleDateString('fr-FR')}  `)
  lines.push(`**Difficulté** · ${project.difficulty}/10  `)
  lines.push(`**Risque** · ${project.riskScore}/100  `)
  lines.push(`**Temps estimé** · ${project.estimatedHours}h`)
  lines.push('')
  lines.push('## Livrables')
  for (const d of project.summary.deliverables) lines.push(`- ${d}`)
  lines.push('')
  lines.push('## À ne pas oublier')
  for (const w of project.warnings)
    lines.push(`- **[${w.severity}]** ${w.title} — ${w.detail}`)
  lines.push('')
  lines.push('## Tâches')
  for (const t of project.tasks)
    lines.push(`- [ ] **${t.title}** _(${t.category}, ${t.priority}, ${t.hours}h)_ — ${t.description}`)
  lines.push('')
  lines.push('## Planning')
  for (const s of project.planning) {
    lines.push(`### ${s.label} · ${s.range}`)
    lines.push(`_${s.theme}_`)
    for (const m of s.milestones) lines.push(`- 🚩 ${m}`)
    lines.push('')
  }
  lines.push('## Checklist finale')
  for (const c of project.checklist)
    lines.push(`- [${c.done ? 'x' : ' '}] ${c.label}`)
  return lines.join('\n')
}

export default function ExportSection({ project }) {
  const [copied, setCopied] = useState(false)
  const markdown = useMemo(() => buildMarkdown(project), [project])

  function download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Sortir du dashboard</div>
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Exporter ton plan</h1>
        <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
          EpiPilot formate ton plan pour les outils que ton équipe utilise déjà.
        </p>
      </div>

      {/* Project tools */}
      <div>
        <h2 className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-4">Outils de gestion de projet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_TOOLS.map((t) => {
            const { Logo } = t
            return (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 hover:shadow transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${t.bg} grid place-items-center shrink-0 ${t.textColor || 'text-white'}`}>
                    <Logo />
                  </div>
                  <div className="text-[15px] font-bold text-slate-900">{t.title}</div>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12.5px] text-slate-600">
                      <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => download(`epipilot-${t.id}.json`, JSON.stringify(project, null, 2), 'application/json')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[12.5px] font-semibold text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Exporter vers {t.title}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-4">Documents & rapports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCUMENTS.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm p-6 flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[15px] font-bold text-slate-900">{d.title}</div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{d.ext}</span>
                  </div>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed mb-4">{d.desc}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        d.id === 'markdown'
                          ? download('epipilot-plan.md', markdown, d.mime)
                          : download(`epipilot-${d.id}.json`, JSON.stringify(project, null, 2), d.mime)
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[12px] font-semibold text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Télécharger
                    </button>
                    {d.canCopy && (
                      <button
                        onClick={copyMarkdown}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12px] font-semibold text-slate-700 transition-colors"
                      >
                        {copied
                          ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copié</>
                          : <><Copy className="w-3.5 h-3.5" /> Copier le texte</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Markdown preview */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="text-[14px] font-bold text-slate-900">Aperçu Markdown</div>
            <div className="text-[12px] text-slate-400 mt-0.5">Exactement ce qui sera dans le fichier .md</div>
          </div>
          <button
            onClick={copyMarkdown}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12px] font-semibold text-slate-700 transition-colors"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
          </button>
        </div>
        <pre className="px-6 py-5 text-[11.5px] leading-relaxed text-slate-600 overflow-x-auto max-h-[400px] scrollbar-thin font-mono bg-slate-50">
          {markdown}
        </pre>
      </div>

    </div>
  )
}
