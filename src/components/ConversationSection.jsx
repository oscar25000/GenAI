import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Send,
  Sparkles,
  CircleDashed,
  CircleCheck,
  Loader2,
  ArrowRight,
  RefreshCcw,
  User,
  FileText,
  Upload,
} from 'lucide-react'
import clsx from 'clsx'
import { Card, Pill, SectionHeader } from './ui.jsx'
import { SECTIONS } from '../lib/projectTools.js'

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

function sendBg(message) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({ ok: false, code: 'NO_CHROME' })
      return
    }
    try {
      chrome.runtime.sendMessage(message, (res) => {
        resolve(res || { ok: false })
      })
    } catch {
      resolve({ ok: false, code: 'SEND_FAILED' })
    }
  })
}

export default function ConversationSection({ onOpenFullDashboard }) {
  const [conversation, setConversation] = useState(null)
  const [progressStage, setProgressStage] = useState('')
  const [bootError, setBootError] = useState(null)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Initial load.
  useEffect(() => {
    sendBg({ type: 'epipilot:conv-get' }).then((res) => {
      if (res?.conversation) setConversation(res.conversation)
    })
  }, [])

  // Listen to background broadcasts.
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return
    const handler = (msg) => {
      if (msg?.type === 'epipilot:conv-status') {
        setProgressStage(
          msg.status === 'fetching' ? 'Téléchargement du PDF…' : '',
        )
        setBootError(null)
      } else if (msg?.type === 'epipilot:conv-progress') {
        setProgressStage(msg.stage || '')
      } else if (msg?.type === 'epipilot:conv-tool') {
        setConversation((c) =>
          c ? { ...c, project: msg.project } : c,
        )
      } else if (msg?.type === 'epipilot:conv-update') {
        setConversation(msg.conversation)
        setProgressStage('')
      } else if (msg?.type === 'epipilot:conv-error') {
        if (msg.conversation) setConversation(msg.conversation)
        setProgressStage('')
        setBootError(msg.code || 'UNKNOWN')
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversation?.messages?.length, progressStage])

  const messages = conversation?.messages || []
  const project = conversation?.project
  const status = conversation?.status || 'idle'
  const thinking = status === 'thinking' || progressStage !== ''

  function handleSend() {
    const text = draft.trim()
    if (!text || thinking) return
    setDraft('')
    sendBg({ type: 'epipilot:conv-send', text })
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleNewConversation() {
    if (!confirm('Effacer la conversation en cours ?')) return
    sendBg({ type: 'epipilot:conv-clear' }).then(() => {
      setConversation(null)
    })
  }

  if (!conversation) {
    if (bootError) return <BootErrorState code={bootError} />
    if (progressStage) return <BootingState stage={progressStage} />
    return <UploadPrompt />
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Conversation guidée"
        title={`Construis ton plan avec EpiPilot`}
        description={`Sujet : ${conversation.projectName || conversation.project?.name || 'projet Epitech'}. Réponds aux questions pour faire émerger l'architecture, l'équipe et le planning.`}
        action={
          <button
            onClick={handleNewConversation}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/[0.09] border border-white/10 text-[12px] flex items-center gap-2 transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Nouvelle conversation
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Chat column */}
        <Card className="flex flex-col h-[calc(100vh-260px)] min-h-[520px] overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-4"
          >
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {thinking && <TypingIndicator stage={progressStage} />}
            {status === 'error' && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 px-4 py-3 text-[12.5px]">
                Erreur : {conversation.lastError || 'inconnue'}. Essaie de renvoyer un message.
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-3.5">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Écris ta réponse à EpiPilot…"
                rows={1}
                disabled={thinking}
                className="flex-1 resize-none max-h-[120px] bg-white/[0.04] border border-white/10 focus:border-violet-400/40 transition rounded-xl px-3.5 py-2.5 text-[13px] text-violet-50 placeholder:text-violet-300/30 focus:outline-none scrollbar-thin disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={thinking || !draft.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-glow flex items-center gap-1.5 text-[12px] font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                Envoyer
              </button>
            </div>
          </div>
        </Card>

        {/* Project state side panel */}
        <ProjectStatePanel
          project={project}
          onOpenFullDashboard={onOpenFullDashboard}
        />
      </div>
    </div>
  )
}

function UploadPrompt() {
  const [pending, setPending] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    sendBg({ type: 'epipilot:get-pending-upload' }).then((res) => {
      setPending(res?.pending || null)
    })
  }, [])

  async function handleFile(file) {
    if (!file) return
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setError('Le fichier doit être un PDF.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const base64 = await readFileAsBase64(file)
      const res = await sendBg({
        type: 'epipilot:start-from-upload',
        pdfBase64: base64,
        pdfFilename: file.name,
        projectName: pending?.projectName || file.name.replace(/\.pdf$/i, ''),
      })
      if (!res?.ok) {
        setError(res?.code || 'Erreur inconnue.')
        setUploading(false)
      }
    } catch (err) {
      setError(err?.message || 'Lecture du PDF impossible.')
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  if (uploading) {
    return (
      <Card className="p-10 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center mx-auto shadow-glow mb-4 animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[18px] font-semibold tracking-tight mb-2">
          PDF reçu — EpiPilot lit le sujet…
        </h3>
        <p className="text-[13px] text-violet-200/70 leading-relaxed flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Première analyse en cours
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-10 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center mx-auto shadow-glow mb-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[20px] font-semibold tracking-tight mb-2">
          {pending?.projectName
            ? `Importe le sujet de ${pending.projectName}`
            : 'Importe le PDF du sujet'}
        </h3>
        <p className="text-[13px] text-violet-200/70 leading-relaxed">
          Récupère le PDF du sujet depuis my.epitech.eu et glisse-le ici.
          EpiPilot le lit, te fait un résumé, puis te pose les bonnes questions
          pour construire le plan.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={clsx(
          'relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
          dragging
            ? 'border-violet-400 bg-violet-500/10'
            : 'border-white/10 hover:border-violet-400/40 hover:bg-white/[0.03]',
        )}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
            {dragging ? (
              <Upload className="w-4 h-4 text-violet-300" />
            ) : (
              <FileText className="w-4 h-4 text-violet-300/80" />
            )}
          </div>
          <div className="text-[13.5px] font-medium">
            {dragging ? 'Dépose le PDF' : 'Glisse le PDF ici, ou clique pour sélectionner'}
          </div>
          <div className="text-[11px] text-violet-300/50">
            Format accepté : PDF (jusqu'à 32 Mo)
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 px-4 py-2.5 text-[12.5px]">
          {error}
        </div>
      )}

      <div className="mt-5 text-center text-[11px] text-violet-300/40">
        Astuce : sur la page projet de my.epitech.eu, fais un clic-droit sur le
        PDF du sujet → Enregistrer sous, puis dépose-le ici.
      </div>
    </Card>
  )
}

function BootingState({ stage }) {
  return (
    <Card className="p-10 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center mx-auto shadow-glow mb-4 animate-pulse">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-[18px] font-semibold tracking-tight mb-2">
        Démarrage de la conversation…
      </h3>
      <p className="text-[13px] text-violet-200/70 leading-relaxed flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {stage || 'Préparation…'}
      </p>
    </Card>
  )
}

const ERROR_LABELS = {
  API_KEY_MISSING:
    "Pas de clé API Anthropic. Ouvre les Settings et colle ta clé depuis console.anthropic.com.",
  API_KEY_INVALID: 'Clé API refusée par Anthropic. Vérifie qu\'elle est valide.',
  RATE_LIMITED: 'Limite Anthropic atteinte. Réessaie dans une minute.',
}

function describeError(code) {
  if (!code) return 'Erreur inconnue.'
  if (ERROR_LABELS[code]) return ERROR_LABELS[code]
  if (code.startsWith('FETCH_FAILED')) {
    return `Téléchargement du PDF impossible — ${code.replace('FETCH_FAILED:', '').trim()}. Le viewer my.epitech.eu utilise une URL signée temporaire qui a peut-être expiré ou que l'extension n'a pas la permission de récupérer.`
  }
  if (code.startsWith('BAD_REQUEST')) {
    return `Requête refusée par Claude — ${code.replace('BAD_REQUEST:', '').trim()}`
  }
  return code
}

function BootErrorState({ code }) {
  return (
    <Card className="p-8 max-w-xl mx-auto border-rose-400/30 bg-rose-500/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/30 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4 text-rose-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight mb-1">
            Impossible de démarrer la conversation
          </h3>
          <p className="text-[12.5px] text-violet-200/80 leading-relaxed">
            {describeError(code)}
          </p>
          <p className="text-[11px] text-violet-300/50 mt-3 font-mono">
            Code : {code}
          </p>
        </div>
      </div>
    </Card>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const text =
    typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('\n')
        : ''
  if (!text) return null

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={clsx(
          'shrink-0 w-7 h-7 rounded-lg grid place-items-center',
          isUser
            ? 'bg-white/5 border border-white/10 text-violet-200/80'
            : 'bg-gradient-to-br from-violet-500 to-violet-700 shadow-glow',
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
      </div>
      <div
        className={clsx(
          'max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-violet-500/15 border border-violet-400/25 text-violet-50 rounded-tr-md'
            : 'bg-white/[0.04] border border-white/5 text-violet-50 rounded-tl-md',
        )}
      >
        {text}
      </div>
    </div>
  )
}

function TypingIndicator({ stage }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="shrink-0 w-7 h-7 rounded-lg grid place-items-center bg-gradient-to-br from-violet-500 to-violet-700 shadow-glow">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-2.5 rounded-tl-md flex items-center gap-2.5">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-300/80 animate-pulse-dot" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-300/80 animate-pulse-dot"
            style={{ animationDelay: '120ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-300/80 animate-pulse-dot"
            style={{ animationDelay: '240ms' }}
          />
        </span>
        {stage && <span className="text-[11.5px] text-violet-300/70">{stage}</span>}
      </div>
    </div>
  )
}

function ProjectStatePanel({ project, onOpenFullDashboard }) {
  const status = useMemo(() => {
    if (!project) return SECTIONS.map((s) => ({ ...s, done: false, count: 0 }))
    return SECTIONS.map((s) => {
      const done = s.check(project)
      let count = 0
      if (s.id === 'team') count = project.team?.length || 0
      if (s.id === 'warnings') count = project.warnings?.length || 0
      if (s.id === 'tasks') count = project.tasks?.length || 0
      if (s.id === 'planning') count = project.planning?.length || 0
      if (s.id === 'risks') count = project.risks?.length || 0
      if (s.id === 'checklist') count = project.checklist?.length || 0
      return { ...s, done, count }
    })
  }, [project])

  const doneCount = status.filter((s) => s.done).length
  const allDone = doneCount === status.length

  return (
    <div className="space-y-4 sticky top-24">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60">
            Progression du plan
          </div>
          <Pill tone={allDone ? 'emerald' : 'violet'}>
            {doneCount}/{status.length}
          </Pill>
        </div>
        <ul className="space-y-2">
          {status.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5">
              {s.done ? (
                <CircleCheck className="w-4 h-4 text-violet-300 shrink-0" />
              ) : (
                <CircleDashed className="w-4 h-4 text-violet-300/30 shrink-0" />
              )}
              <span
                className={clsx(
                  'text-[12.5px] flex-1',
                  s.done ? 'text-violet-50' : 'text-violet-200/50',
                )}
              >
                {s.label}
              </span>
              {s.count > 0 && (
                <span className="text-[10.5px] text-violet-300/60 font-mono">
                  {s.count}
                </span>
              )}
            </li>
          ))}
        </ul>

        {allDone && (
          <button
            onClick={onOpenFullDashboard}
            className="mt-4 w-full px-3 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 transition shadow-glow flex items-center justify-center gap-2 text-[12.5px] font-medium"
          >
            Ouvrir le dashboard complet <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </Card>

      {project?.summary && (
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-2">
            Résumé
          </div>
          <div className="text-[15px] font-semibold tracking-tight mb-2">
            {project.name}
          </div>
          <p className="text-[12.5px] text-violet-200/75 leading-relaxed">
            {project.summary.goal}
          </p>
        </Card>
      )}

      {project?.team?.length > 0 && (
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-3">
            Équipe ({project.team.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.team.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
              >
                <span
                  className="w-4 h-4 rounded-full grid place-items-center text-[9px] font-semibold"
                  style={{ background: m.color }}
                >
                  {m.avatar}
                </span>
                <span className="text-[11.5px] text-violet-100">{m.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
