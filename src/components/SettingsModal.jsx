import { useEffect, useState } from 'react'
import {
  X,
  KeyRound,
  Cpu,
  Users,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { DEFAULT_TEAM, getSettings, saveSettings } from '../lib/storage.js'

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Le plus capable (recommandé)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', desc: 'Bon ratio rapidité / intelligence' },
  { id: 'gpt-4.1', label: 'GPT-4.1', desc: 'Long contexte, raisonnement renforcé' },
]

const PRESET_COLORS = ['#8257FF', '#6A3BF5', '#B59CFF', '#9B7BFF', '#F59E0B', '#EC4899', '#10B981', '#3B82F6']

export default function SettingsModal({ open, onClose, onSaved }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o')
  const [enableThinking, setEnableThinking] = useState(false)
  const [team, setTeam] = useState(DEFAULT_TEAM)
  const [showKey, setShowKey] = useState(false)
  const [savedMark, setSavedMark] = useState(false)

  useEffect(() => {
    if (!open) return
    getSettings().then((s) => {
      setApiKey(s.apiKey || '')
      setModel(s.model || 'gpt-4o')
      setEnableThinking(Boolean(s.enableThinking))
      setTeam(s.team?.length ? s.team : DEFAULT_TEAM)
    })
  }, [open])

  async function handleSave() {
    await saveSettings({ apiKey: apiKey.trim(), model, team, enableThinking })
    setSavedMark(true)
    setTimeout(() => setSavedMark(false), 1500)
    onSaved?.()
  }

  function updateMember(idx, patch) {
    setTeam((t) => t.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }

  function addMember() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    setTeam((t) => [
      ...t,
      {
        id: `m${Date.now().toString(36).slice(-4)}`,
        name: 'Nouveau membre',
        avatar: letters[Math.floor(Math.random() * letters.length)],
        color: PRESET_COLORS[t.length % PRESET_COLORS.length],
        skills: [],
      },
    ])
  }

  function removeMember(idx) {
    setTeam((t) => t.filter((_, i) => i !== idx))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin glass-strong rounded-3xl shadow-card">
        <div className="sticky top-0 backdrop-blur-xl bg-ink-900/70 border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Paramètres EpiPilot</div>
              <div className="text-[11px] text-violet-300/60">Clé API · modèle · équipe</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-violet-200/70 hover:text-violet-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-7">
          <section>
            <SectionTitle icon={KeyRound} title="Clé API OpenAI" />
            <p className="text-[12px] text-violet-200/60 mb-3 leading-relaxed">
              Ta clé est stockée localement (chrome.storage.local). Elle ne quitte ton navigateur que pour appeler api.openai.com.
              Génère-la sur{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline inline-flex items-center gap-1"
              >
                platform.openai.com <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-violet-400/40 transition">
                <KeyRound className="w-3.5 h-3.5 text-violet-300/60 shrink-0" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  className="flex-1 bg-transparent text-[13px] text-violet-50 placeholder:text-violet-300/30 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="p-1 text-violet-300/60 hover:text-violet-100 transition"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle icon={Cpu} title="Modèle OpenAI" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    model === m.id
                      ? 'border-violet-400/40 bg-violet-500/10'
                      : 'border-white/5 bg-white/[0.03] hover:border-violet-400/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-medium">{m.label}</div>
                    {model === m.id && <Check className="w-3.5 h-3.5 text-violet-300" />}
                  </div>
                  <div className="text-[11px] text-violet-200/60">{m.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={Users} title="Équipe" inline />
              <button
                onClick={addMember}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/[0.09] border border-white/10 text-[11px] flex items-center gap-1.5 transition"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            <p className="text-[12px] text-violet-200/60 mb-3 leading-relaxed">
              Les compétences servent à l'auto-assignation des tâches par l'IA. Une compétence par ligne ou séparées par des virgules.
            </p>
            <div className="space-y-2">
              {team.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-violet-400/20 transition"
                >
                  <div className="flex items-start gap-3">
                    <ColorAvatar
                      avatar={m.avatar}
                      color={m.color}
                      onPick={(c) => updateMember(idx, { color: c })}
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        value={m.name}
                        onChange={(e) => updateMember(idx, { name: e.target.value })}
                        placeholder="Nom"
                        className="bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2 text-[13px] text-violet-50 placeholder:text-violet-300/30 focus:outline-none focus:border-violet-400/40 transition"
                      />
                      <input
                        value={m.id}
                        onChange={(e) => updateMember(idx, { id: e.target.value.replace(/\s+/g, '-').toLowerCase() })}
                        placeholder="id"
                        className="bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2 text-[13px] text-violet-50 placeholder:text-violet-300/30 focus:outline-none focus:border-violet-400/40 transition font-mono"
                      />
                      <input
                        value={(m.skills || []).join(', ')}
                        onChange={(e) =>
                          updateMember(idx, {
                            skills: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="frontend, design, mobile…"
                        className="md:col-span-2 bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2 text-[12.5px] text-violet-50 placeholder:text-violet-300/30 focus:outline-none focus:border-violet-400/40 transition"
                      />
                    </div>
                    <button
                      onClick={() => removeMember(idx)}
                      className="p-2 rounded-lg text-violet-300/40 hover:text-rose-300 hover:bg-rose-400/5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 backdrop-blur-xl bg-ink-900/70 border-t border-white/5 px-6 py-4 flex items-center justify-between rounded-b-3xl">
          <div className="text-[11px] text-violet-300/60">
            {apiKey
              ? 'Une clé est définie. Les analyses utiliseront OpenAI.'
              : "Aucune clé : EpiPilot tournera en mode démo (données mock)."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[12px] transition"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 transition text-[12px] font-medium shadow-glow flex items-center gap-2"
            >
              {savedMark ? <Check className="w-3.5 h-3.5" /> : null}
              {savedMark ? 'Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, inline }) {
  return (
    <div className={`flex items-center gap-2 ${inline ? '' : 'mb-1'}`}>
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
        <Icon className="w-3.5 h-3.5 text-violet-300" />
      </div>
      <div className="text-[13px] font-medium">{title}</div>
    </div>
  )
}

function ColorAvatar({ avatar, color, onPick }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-10 h-10 rounded-xl grid place-items-center text-[14px] font-semibold shadow-glow"
        style={{ background: `linear-gradient(135deg, ${color}, #2A1576)` }}
        title="Changer la couleur"
      >
        {avatar}
      </button>
      {open && (
        <div className="absolute z-20 top-12 left-0 p-2 rounded-xl glass-strong shadow-card grid grid-cols-4 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onPick(c)
                setOpen(false)
              }}
              className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
