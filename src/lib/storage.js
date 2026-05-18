// Chrome storage helpers — also fall back to localStorage when running
// outside of an extension context (e.g. `vite preview`).

const KEYS = {
  apiKey: 'epipilot.apiKey',
  model: 'epipilot.model',
  team: 'epipilot.team',
  project: 'epipilot_project',
  enableThinking: 'epipilot.enableThinking',
}

const DEFAULT_TEAM = [
  { id: 'oscar', name: 'Oscar', avatar: 'O', color: '#8257FF', skills: ['cybersécurité', 'QA', 'documentation', 'DevOps'] },
  { id: 'kilian', name: 'Kilian', avatar: 'K', color: '#6A3BF5', skills: ['backend', 'API', 'base de données'] },
  { id: 'noah', name: 'Noah', avatar: 'N', color: '#B59CFF', skills: ['frontend', 'UI/UX', 'mobile'] },
  { id: 'emma', name: 'Emma', avatar: 'E', color: '#9B7BFF', skills: ['présentation', 'design', 'tests utilisateur'] },
]

const DEFAULTS = {
  [KEYS.model]: 'claude-opus-4-7',
  [KEYS.team]: DEFAULT_TEAM,
  [KEYS.enableThinking]: false,
}

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome?.storage?.local
}

export async function getSettings() {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(Object.values(KEYS), (res) => {
        resolve({
          apiKey: res[KEYS.apiKey] || '',
          model: res[KEYS.model] || DEFAULTS[KEYS.model],
          team: res[KEYS.team] || DEFAULTS[KEYS.team],
          enableThinking:
            typeof res[KEYS.enableThinking] === 'boolean'
              ? res[KEYS.enableThinking]
              : DEFAULTS[KEYS.enableThinking],
          project: res[KEYS.project] || null,
        })
      })
    })
  }
  try {
    return {
      apiKey: localStorage.getItem(KEYS.apiKey) || '',
      model: localStorage.getItem(KEYS.model) || DEFAULTS[KEYS.model],
      team: JSON.parse(localStorage.getItem(KEYS.team) || 'null') || DEFAULTS[KEYS.team],
      enableThinking: localStorage.getItem(KEYS.enableThinking) === 'true',
      project: JSON.parse(localStorage.getItem(KEYS.project) || 'null'),
    }
  } catch {
    return { apiKey: '', ...DEFAULTS, project: null }
  }
}

export async function saveSettings(patch) {
  const entries = {}
  if ('apiKey' in patch) entries[KEYS.apiKey] = patch.apiKey
  if ('model' in patch) entries[KEYS.model] = patch.model
  if ('team' in patch) entries[KEYS.team] = patch.team
  if ('enableThinking' in patch) entries[KEYS.enableThinking] = patch.enableThinking

  if (hasChromeStorage()) {
    return new Promise((resolve) => chrome.storage.local.set(entries, resolve))
  }
  for (const [k, v] of Object.entries(entries)) {
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
  }
}

export async function saveProject(project) {
  if (hasChromeStorage()) {
    return new Promise((resolve) =>
      chrome.storage.local.set({ [KEYS.project]: project }, resolve),
    )
  }
  try {
    localStorage.setItem(KEYS.project, JSON.stringify(project))
  } catch {}
}

export { DEFAULT_TEAM }
