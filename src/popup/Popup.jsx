import { useEffect, useRef, useState } from 'react'
import {
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
  API_KEY_MISSING: "Aucune clé API renseignée. Ouvre les Settings pour en ajouter une.",
  API_KEY_INVALID: "Clé API refusée. Vérifie qu'elle est valide.",
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
  const [status, setStatus] = useState('idle')
  const [stages, setStages] = useState([])
  const [currentStage, setCurrentStage] = useState(0)
  const [last, setLast] = useState(null)
  const [hasKey, setHasKey] = useState(false)
  const [model, setModel] = useState('gpt-5.4-mini')
  const [errorMsg, setErrorMsg] = useState('')
  const [mode, setMode] = useState('mock')
  const fileInput = useRef(null)

  useEffect(() => {
    getSettings().then((s) => {
      setHasKey(Boolean(s.apiKey))
      setModel(s.model || 'gpt-5.4-mini')
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
          .sendMessage({ type: 'epipilot:analyze', pdfBase64: base64, pdfFilename: file.name })
          .catch(() => {
            setStatus('error')
            setErrorMsg("Le service worker ne répond pas. Recharge l'extension.")
          })
      } else {
        setStatus('error')
        setErrorMsg("chrome.runtime indisponible — exécute en mode extension.")
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
    <div className="w-[380px] min-h-[540px] bg-[#f8fafc] text-slate-900 p-4 flex flex-col gap-3 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="leading-tight">
            <img src="/icons/logo.png" alt="Epilot" className="h-10 w-auto max-w-[130px] object-contain object-left" />
            <div className="text-[10px] text-slate-400">Gestion de projet</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openDashboardWithSettings}
            title="Paramètres"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openDashboard}
            className="text-[11px] flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Dashboard <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      <ModeBadge hasKey={hasKey} model={model} />

      {/* Upload card */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
          Sujet à analyser
        </div>
        <p className="text-[12.5px] text-slate-500 leading-snug mb-4">
          Importe le PDF du sujet Epitech pour générer un plan complet.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={status === 'analyzing'}
            className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
          >
            {status === 'analyzing' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
            ) : (
              <><Zap className="w-4 h-4" /> Analyser le sujet</>
            )}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={status === 'analyzing'}
            className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-semibold text-slate-600 flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> Importer un PDF
          </button>
          <input ref={fileInput} type="file" accept="application/pdf" onChange={onFile} className="hidden" />
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl shadow-sm p-4 min-h-[130px]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Statut</div>
          <StatusBadge status={status} />
        </div>

        {status === 'idle' && (
          <p className="text-[12.5px] text-slate-500 leading-snug">
            {hasKey
              ? 'Prêt. Lance une analyse IA via OpenAI.'
              : 'Mode démo : clique sur Analyser pour générer un plan exemple. Ajoute ta clé OpenAI dans les Settings pour la vraie analyse.'}
          </p>
        )}

        {status === 'analyzing' && (
          <ul className="space-y-1.5 mt-1">
            {(mode === 'live' ? stages : MOCK_STAGES).map((s, i) => {
              const done = mode === 'live' ? i < currentStage - 1 : i < currentStage
              const active = mode === 'live' ? i === currentStage - 1 : i === currentStage
              return (
                <li key={`${s}-${i}`} className="flex items-center gap-2 text-[12px]">
                  {done ? (
                    <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />
                  )}
                  <span className={done || active ? 'text-slate-800 font-semibold' : 'text-slate-400'}>{s}</span>
                </li>
              )
            })}
          </ul>
        )}

        {status === 'done' && last && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-slate-700 font-semibold">Analyse terminée. Plan de projet prêt.</p>
            <button
              onClick={openDashboard}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors px-3 py-2 text-[12px] font-semibold text-white flex items-center justify-center gap-2"
            >
              Ouvrir le dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-red-600 leading-snug">{errorMsg}</p>
            <button
              onClick={openDashboardWithSettings}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-2 text-[12px] font-semibold text-slate-700 flex items-center justify-center gap-2"
            >
              Ouvrir les Settings
            </button>
          </div>
        )}
      </div>

      {/* Last project */}
      {last && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-2.5 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            <History className="w-3 h-3" /> Dernier projet analysé
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-50 grid place-items-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-slate-900 truncate">{last.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{last.sourcePdf}</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                <span>Diff. {last.difficulty}/10</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{last.tasks?.length || 0} tâches</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Risque {last.riskScore}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto text-center text-[10px] text-slate-400">
        Epilot · v0.1 · Transforme ton sujet en plan de projet.
      </div>
    </div>
  )
}

function ModeBadge({ hasKey, model }) {
  return (
    <div
      className={`flex items-center gap-2 text-[10.5px] font-semibold px-3 py-1.5 rounded-full w-fit ${
        hasKey
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      <KeyRound className="w-3 h-3" />
      {hasKey ? `Mode IA · OpenAI ${model}` : 'Mode démo · données mock'}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'idle')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-slate-400 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> En attente
      </span>
    )
  if (status === 'analyzing')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-indigo-600 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot" /> En cours
      </span>
    )
  if (status === 'error')
    return (
      <span className="text-[10px] flex items-center gap-1.5 text-red-600 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Erreur
      </span>
    )
  return (
    <span className="text-[10px] flex items-center gap-1.5 text-emerald-600 font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Terminé
    </span>
  )
}
