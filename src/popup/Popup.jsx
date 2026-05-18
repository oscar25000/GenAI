import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  FileText,
  Upload,
  ArrowUpRight,
  CircleCheck,
  Loader2,
  History,
  Zap,
} from 'lucide-react'
import { mockProject } from '../data/mockProject.js'

const STAGES = [
  'Extraction du texte du PDF…',
  'Identification du contexte et des objectifs…',
  'Détection des livrables et contraintes…',
  'Génération des tâches et du planning…',
  'Analyse des risques et de la charge équipe…',
]

function openDashboard() {
  const url =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('dashboard.html')
      : '/dashboard.html'
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank')
  }
}

function persist(project) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ epipilot_project: project })
  } else {
    try {
      localStorage.setItem('epipilot_project', JSON.stringify(project))
    } catch {}
  }
}

function loadStored(setLast) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['epipilot_project'], (res) => {
      if (res?.epipilot_project) setLast(res.epipilot_project)
    })
  } else {
    try {
      const raw = localStorage.getItem('epipilot_project')
      if (raw) setLast(JSON.parse(raw))
    } catch {}
  }
}

export default function Popup() {
  const [status, setStatus] = useState('idle') // idle | analyzing | done
  const [stage, setStage] = useState(0)
  const [last, setLast] = useState(null)
  const fileInput = useRef(null)

  useEffect(() => {
    loadStored(setLast)
  }, [])

  function startAnalysis(fileName) {
    setStatus('analyzing')
    setStage(0)
    let i = 0
    const step = () => {
      i += 1
      if (i < STAGES.length) {
        setStage(i)
        setTimeout(step, 650)
      } else {
        const project = {
          ...mockProject,
          sourcePdf: fileName || mockProject.sourcePdf,
          importedAt: new Date().toISOString(),
        }
        persist(project)
        setLast(project)
        setStatus('done')
      }
    }
    setTimeout(step, 650)
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    startAnalysis(f.name)
  }

  return (
    <div className="w-[380px] min-h-[520px] app-bg text-violet-50 p-5 flex flex-col gap-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">EpiPilot</div>
            <div className="text-[11px] text-violet-300/70">Copilote projet Epitech</div>
          </div>
        </div>
        <button
          onClick={openDashboard}
          className="text-[11px] flex items-center gap-1 text-violet-300/80 hover:text-violet-100 transition"
        >
          Dashboard <ArrowUpRight className="w-3 h-3" />
        </button>
      </header>

      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-1">
          Sujet à analyser
        </div>
        <p className="text-sm text-violet-100/90 leading-snug">
          Importe le PDF du sujet Epitech ou détecte-le depuis l'intra.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={status === 'analyzing'}
            className="group relative w-full rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all px-4 py-3 text-sm font-medium shadow-glow flex items-center justify-center gap-2"
          >
            {status === 'analyzing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyser le sujet
              </>
            )}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={status === 'analyzing'}
            className="w-full rounded-xl border border-white/10 hover:border-violet-400/40 bg-white/5 hover:bg-white/[0.07] transition px-4 py-2.5 text-xs flex items-center justify-center gap-2 text-violet-100/90"
          >
            <Upload className="w-3.5 h-3.5" />
            Importer un PDF
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Status */}
      <div className="glass rounded-2xl p-4 shadow-card min-h-[120px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
            Statut
          </div>
          <StatusBadge status={status} />
        </div>

        {status === 'idle' && (
          <p className="text-sm text-violet-100/70 leading-snug">
            Prêt. Lance une analyse pour générer ton plan de projet.
          </p>
        )}

        {status === 'analyzing' && (
          <ul className="space-y-2 mt-1">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-xs">
                {i < stage ? (
                  <CircleCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                ) : i === stage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-300 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/15 shrink-0" />
                )}
                <span
                  className={
                    i <= stage ? 'text-violet-100' : 'text-violet-100/40'
                  }
                >
                  {s}
                </span>
              </li>
            ))}
          </ul>
        )}

        {status === 'done' && last && (
          <div className="space-y-2">
            <p className="text-sm text-violet-100/90 leading-snug">
              Analyse terminée. Plan de projet prêt.
            </p>
            <button
              onClick={openDashboard}
              className="w-full mt-1 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 hover:border-violet-400/40 transition px-3 py-2 text-xs font-medium flex items-center justify-center gap-2"
            >
              Ouvrir le dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Last project */}
      {last && (
        <div className="glass rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-violet-300/60 flex items-center gap-1.5">
              <History className="w-3 h-3" />
              Dernier projet analysé
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-violet-500/15 border border-violet-400/20 grid place-items-center">
              <FileText className="w-4 h-4 text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{last.name}</div>
              <div className="text-[11px] text-violet-300/70 truncate">
                {last.sourcePdf}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-violet-300/60">
                <span>Diff. {last.difficulty}/10</span>
                <span className="w-1 h-1 rounded-full bg-violet-300/40" />
                <span>{last.tasks.length} tâches</span>
                <span className="w-1 h-1 rounded-full bg-violet-300/40" />
                <span>Risque {last.riskScore}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-1 text-center text-[10px] text-violet-300/40">
        EpiPilot · v0.1 · Transforme ton sujet en plan de projet.
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'idle')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-violet-300/70">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-300/60" /> En attente
      </span>
    )
  if (status === 'analyzing')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-violet-300">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-dot" />
        En cours
      </span>
    )
  return (
    <span className="text-[10px] flex items-center gap-1.5 text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Terminé
    </span>
  )
}
