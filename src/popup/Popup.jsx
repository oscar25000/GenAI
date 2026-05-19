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
  KeyRound,
  Settings,
} from 'lucide-react'
import { mockProject } from '../data/mockProject.js'
import { getSettings, saveProject } from '../lib/storage.js'

const MOCK_STAGES = [
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

function openDashboardWithSettings() {
  const url =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('dashboard.html#settings')
      : '/dashboard.html#settings'
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank')
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = String(dataUrl).split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const ERROR_LABELS = {
  API_KEY_MISSING: "Aucune clé API renseignée. Ouvre les Settings dans le dashboard pour en ajouter une.",
  API_KEY_INVALID: 'Clé API refusée. Vérifie qu\'elle est valide.',
  RATE_LIMITED: 'Limite de requêtes atteinte. Réessaie dans une minute.',
  PDF_MISSING: 'Aucun PDF fourni.',
  TEAM_EMPTY: "L'équipe est vide. Configure-la dans les Settings.",
  NO_OUTPUT: "OpenAI n'a pas retourné de réponse exploitable.",
  PARSE_FAILED: 'Impossible de parser la réponse JSON.',
}

function describeError(code) {
  if (!code) return 'Erreur inconnue.'
  if (ERROR_LABELS[code]) return ERROR_LABELS[code]
  if (code.startsWith('BAD_REQUEST')) return `Requête refusée : ${code.replace('BAD_REQUEST: ', '')}`
  return code
}

export default function Popup() {
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [stages, setStages] = useState([])
  const [currentStage, setCurrentStage] = useState(0)
  const [last, setLast] = useState(null)
  const [hasKey, setHasKey] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [mode, setMode] = useState('mock') // 'live' or 'mock'
  const fileInput = useRef(null)

  useEffect(() => {
    getSettings().then((s) => {
      setHasKey(Boolean(s.apiKey))
      setLast(s.project)
    })
  }, [])

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return
    const handler = (msg) => {
      if (msg?.type === 'epipilot:progress') {
        setStages((prev) => [...prev, msg.stage])
        setCurrentStage((n) => n + 1)
      } else if (msg?.type === 'epipilot:done') {
        setLast(msg.project)
        setStatus('done')
      } else if (msg?.type === 'epipilot:error') {
        setStatus('error')
        setErrorMsg(describeError(msg.code))
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  function runMockAnalysis(fileName) {
    setStatus('analyzing')
    setMode('mock')
    setStages([])
    setCurrentStage(0)
    setErrorMsg('')

    let i = 0
    const step = () => {
      if (i < MOCK_STAGES.length) {
        setStages((prev) => [...prev, MOCK_STAGES[i]])
        setCurrentStage(i + 1)
        i += 1
        setTimeout(step, 650)
      } else {
        const project = {
          ...mockProject,
          sourcePdf: fileName || mockProject.sourcePdf,
          importedAt: new Date().toISOString(),
        }
        saveProject(project)
        setLast(project)
        setStatus('done')
      }
    }
    setTimeout(step, 400)
  }

  async function runLiveAnalysis(file) {
    setStatus('analyzing')
    setMode('live')
    setStages([])
    setCurrentStage(0)
    setErrorMsg('')

    try {
      const base64 = await readFileAsBase64(file)
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime
          .sendMessage({
            type: 'epipilot:analyze',
            pdfBase64: base64,
            pdfFilename: file.name,
          })
          .catch(() => {
            setStatus('error')
            setErrorMsg('Le service worker ne répond pas. Recharge l\'extension.')
          })
      } else {
        setStatus('error')
        setErrorMsg('chrome.runtime indisponible — exécute en mode extension.')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.message || 'Lecture du PDF impossible.')
    }
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (hasKey) runLiveAnalysis(f)
    else runMockAnalysis(f.name)
  }

  return (
    <div className="w-[380px] min-h-[540px] app-bg text-violet-50 p-5 flex flex-col gap-4 animate-fade-in">
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={openDashboardWithSettings}
            title="Paramètres"
            className="p-1.5 rounded-lg text-violet-300/80 hover:text-violet-100 hover:bg-white/5 transition"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openDashboard}
            className="text-[11px] flex items-center gap-1 text-violet-300/80 hover:text-violet-100 transition"
          >
            Dashboard <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      <ModeBadge hasKey={hasKey} />

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

      <div className="glass rounded-2xl p-4 shadow-card min-h-[140px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
            Statut
          </div>
          <StatusBadge status={status} />
        </div>

        {status === 'idle' && (
          <p className="text-sm text-violet-100/70 leading-snug">
            {hasKey
              ? 'Prêt. Lance une analyse IA via OpenAI.'
              : 'Démo : clique sur Analyser pour générer un plan mock. Ajoute ta clé OpenAI dans les Settings pour activer la vraie analyse.'}
          </p>
        )}

        {status === 'analyzing' && (
          <ul className="space-y-2 mt-1">
            {(mode === 'live' ? stages : MOCK_STAGES).map((s, i) => {
              const done =
                mode === 'live' ? i < currentStage - 1 : i < currentStage
              const active =
                mode === 'live' ? i === currentStage - 1 : i === currentStage
              return (
                <li key={`${s}-${i}`} className="flex items-center gap-2 text-xs">
                  {done ? (
                    <CircleCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-300 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-white/15 shrink-0" />
                  )}
                  <span className={done || active ? 'text-violet-100' : 'text-violet-100/40'}>
                    {s}
                  </span>
                </li>
              )
            })}
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

        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-rose-300/90 leading-snug">{errorMsg}</p>
            <button
              onClick={openDashboardWithSettings}
              className="w-full mt-1 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 hover:border-violet-400/40 transition px-3 py-2 text-xs font-medium flex items-center justify-center gap-2"
            >
              Ouvrir les Settings
            </button>
          </div>
        )}
      </div>

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
                <span>{last.tasks?.length || 0} tâches</span>
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

function ModeBadge({ hasKey }) {
  return (
    <div
      className={`flex items-center gap-2 text-[10.5px] px-3 py-1.5 rounded-full border w-fit ${
        hasKey
          ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200'
          : 'bg-amber-400/10 border-amber-400/30 text-amber-200'
      }`}
    >
      <KeyRound className="w-3 h-3" />
      {hasKey ? 'Mode IA · OpenAI GPT-4o' : 'Mode démo · données mock'}
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
  if (status === 'error')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Erreur
      </span>
    )
  return (
    <span className="text-[10px] flex items-center gap-1.5 text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Terminé
    </span>
  )
}
