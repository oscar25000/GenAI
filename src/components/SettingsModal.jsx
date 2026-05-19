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
  Settings,
} from 'lucide-react'
import { DEFAULT_TEAM, getSettings, saveSettings } from '../lib/storage.js'

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Le plus capable (recommandé)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', desc: 'Bon ratio rapidité / intelligence' },
  { id: 'gpt-4.1', label: 'GPT-4.1', desc: 'Long contexte, raisonnement renforcé' },
]

const PRESET_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']

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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-white rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 grid place-items-center shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-slate-900">Paramètres Epilot</div>
              <div className="text-[11px] text-slate-400">Clé API · modèle · équipe</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-7">
          <section>
            <SectionTitle icon={KeyRound} title="Clé API OpenAI" />
            <p className="text-[12px] text-slate-500 mb-3 leading-relaxed mt-1.5">
              Ta clé est stockée localement (chrome.storage.local). Elle ne quitte ton navigateur que pour appeler api.openai.com.
              Génère-la sur{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                platform.openai.com <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="flex-1 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </section>

          <section>
            <SectionTitle icon={Cpu} title="Modèle OpenAI" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`text-left p-3.5 rounded-xl transition-all ${
                    model === m.id
                      ? 'bg-indigo-50 ring-2 ring-indigo-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-bold text-slate-900">{m.label}</div>
                    {model === m.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500">{m.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={Users} title="Équipe" inline />
              <button
                onClick={addMember}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
              Les compétences servent à l'auto-assignation des tâches par l'IA. Une compétence par ligne ou séparées par des virgules.
            </p>
            <div className="space-y-2">
              {team.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
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
                        className="bg-white rounded-xl px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                      <input
                        value={m.id}
                        onChange={(e) =>
                          updateMember(idx, { id: e.target.value.replace(/\s+/g, '-').toLowerCase() })
                        }
                        placeholder="id"
                        className="bg-white rounded-xl px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-mono"
                      />
                      <input
                        value={(m.skills || []).join(', ')}
                        onChange={(e) =>
                          updateMember(idx, {
                            skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="frontend, design, mobile…"
                        className="md:col-span-2 bg-white rounded-xl px-3 py-2 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => removeMember(idx)}
                      className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between rounded-b-3xl">
          <div className="text-[11px] text-slate-400">
            {apiKey
              ? 'Une clé est définie. Les analyses utiliseront OpenAI.'
              : 'Aucune clé : Epilot tournera en mode démo (données mock).'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12px] font-semibold text-slate-700 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-[12px] font-semibold text-white flex items-center gap-2"
            >
              {savedMark && <Check className="w-3.5 h-3.5" />}
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
      <div className="w-6 h-6 rounded-lg bg-slate-100 grid place-items-center">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="text-[13px] font-bold text-slate-800">{title}</div>
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
        className="w-9 h-9 rounded-xl grid place-items-center text-[14px] font-bold shrink-0 text-white"
        style={{ background: color }}
        title="Changer la couleur"
      >
        {avatar}
      </button>
      {open && (
        <div className="absolute z-20 top-11 left-0 p-2 rounded-2xl bg-white shadow-xl grid grid-cols-4 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onPick(c); setOpen(false) }}
              className="w-6 h-6 rounded-lg hover:scale-110 transition-transform shadow-sm"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
