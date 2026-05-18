import { useMemo, useState } from 'react'
import {
  Github,
  FileDown,
  Trello,
  Calendar,
  StickyNote,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { Card, Pill, SectionHeader } from './ui.jsx'

const TARGETS = [
  {
    id: 'github',
    icon: Github,
    title: 'GitHub Issues',
    desc: 'Une issue par tâche, labels par catégorie et priorité.',
  },
  {
    id: 'markdown',
    icon: FileText,
    title: 'Markdown',
    desc: 'Plan complet exporté en .md prêt à coller dans le repo.',
  },
  {
    id: 'notion',
    icon: StickyNote,
    title: 'Notion',
    desc: 'Database de tâches + page de synthèse du projet.',
  },
  {
    id: 'trello',
    icon: Trello,
    title: 'Trello',
    desc: 'Board avec colonnes À faire / En cours / Terminé.',
  },
  {
    id: 'pdf',
    icon: FileDown,
    title: 'PDF',
    desc: 'Document récap pour les coachs et la soutenance.',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Google Calendar',
    desc: 'Sprints + jalons + deadline finale exportés en .ics.',
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
  for (const t of project.tasks) {
    lines.push(
      `- [ ] **${t.title}** _(${t.category}, ${t.priority}, ${t.hours}h)_ — ${t.description}`,
    )
  }
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
  const [copied, setCopied] = useState(null)
  const markdown = useMemo(() => buildMarkdown(project), [project])

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied('md')
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  function download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Sortir du dashboard"
        title="Exporter ton plan partout"
        description="EpiPilot pousse ton plan dans les outils que ton équipe utilise déjà — sans recopier à la main."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {TARGETS.map((t) => {
          const Icon = t.icon
          return (
            <Card
              key={t.id}
              className="p-5 hover:border-violet-400/30 transition group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 grid place-items-center">
                  <Icon className="w-4 h-4 text-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[14px] font-medium">{t.title}</div>
                    <Pill>Prêt</Pill>
                  </div>
                  <p className="text-[12px] text-violet-200/70 mt-1 leading-relaxed">
                    {t.desc}
                  </p>
                  <button
                    onClick={() => {
                      if (t.id === 'markdown')
                        download('epipilot-plan.md', markdown, 'text/markdown')
                      else
                        download(
                          `epipilot-${t.id}.json`,
                          JSON.stringify(project, null, 2),
                          'application/json',
                        )
                    }}
                    className="mt-3 w-full px-3 py-1.5 rounded-lg text-[11.5px] font-medium bg-gradient-to-br from-violet-500/20 to-violet-700/10 hover:from-violet-500/30 hover:to-violet-700/20 border border-violet-400/20 transition"
                  >
                    Exporter
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-medium">Aperçu Markdown</div>
            <div className="text-[11px] text-violet-300/60">
              Copie-colle directement dans le README ou Notion.
            </div>
          </div>
          <button
            onClick={copyMarkdown}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 text-[11.5px] flex items-center gap-1.5 transition"
          >
            {copied === 'md' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" /> Copié
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copier
              </>
            )}
          </button>
        </div>
        <pre className="bg-ink-950/60 border border-white/5 rounded-xl p-4 text-[11.5px] leading-relaxed text-violet-100/80 overflow-x-auto max-h-[420px] scrollbar-thin">
          {markdown}
        </pre>
      </Card>
    </div>
  )
}
