/* Client-side orchestration for the "Export to Trello" flow.
   - Fetches the public API key from the local backend
   - Opens Trello's authorize page via chrome.identity.launchWebAuthFlow
   - Caches the user token in chrome.storage.local
   - Asks the backend to create the board + lists + labels + cards
   - Returns the resulting board URL */

const TOKEN_STORAGE_KEY = 'trello_token_v1'
const DEFAULT_BACKEND = 'http://localhost:3001'

async function getBackendUrl() {
  try {
    const { settings } = await chrome.storage.local.get('settings')
    if (settings?.backendUrl) return settings.backendUrl.replace(/\/$/, '')
  } catch {}
  return DEFAULT_BACKEND
}

async function fetchTrelloConfig(backend) {
  const res = await fetch(`${backend}/api/trello/config`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Backend a répondu ${res.status}`)
  }
  return res.json()
}

async function getCachedToken() {
  try {
    const obj = await chrome.storage.local.get(TOKEN_STORAGE_KEY)
    return obj[TOKEN_STORAGE_KEY] || null
  } catch {
    return null
  }
}

async function cacheToken(token) {
  try {
    await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: token })
  } catch {}
}

export async function clearTrelloToken() {
  try {
    await chrome.storage.local.remove(TOKEN_STORAGE_KEY)
  } catch {}
}

function launchTrelloAuth(apiKey) {
  return new Promise((resolve, reject) => {
    if (!chrome?.identity?.launchWebAuthFlow) {
      reject(new Error('chrome.identity indisponible (à lancer depuis l\'extension).'))
      return
    }
    const redirectUri = chrome.identity.getRedirectURL('trello')
    const authUrl = new URL('https://trello.com/1/authorize')
    authUrl.searchParams.set('key', apiKey)
    authUrl.searchParams.set('name', 'Epilot')
    authUrl.searchParams.set('scope', 'read,write')
    authUrl.searchParams.set('expiration', 'never')
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('callback_method', 'fragment')
    authUrl.searchParams.set('return_url', redirectUri)

    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!responseUrl) {
          reject(new Error('Aucune réponse de Trello'))
          return
        }
        const fragment = responseUrl.split('#')[1] || ''
        const params = new URLSearchParams(fragment)
        const token = params.get('token')
        if (!token) {
          reject(new Error('Token Trello introuvable dans la réponse'))
          return
        }
        resolve(token)
      },
    )
  })
}

async function postExport(backend, token, project) {
  const res = await fetch(`${backend}/api/trello/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, project }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Backend a répondu ${res.status}`)
  }
  return body
}

export async function exportToTrello(project, { onProgress } = {}) {
  const step = (label) => onProgress && onProgress(label)

  step('Contact du serveur Epilot…')
  const backend = await getBackendUrl()
  const { apiKey } = await fetchTrelloConfig(backend)

  let token = await getCachedToken()
  if (!token) {
    step('Autorisation Trello…')
    token = await launchTrelloAuth(apiKey)
    await cacheToken(token)
  }

  step('Création du board…')
  try {
    return await postExport(backend, token, project)
  } catch (err) {
    if (/401|unauthorized|invalid token/i.test(err.message)) {
      await clearTrelloToken()
      step('Token expiré, nouvelle autorisation…')
      token = await launchTrelloAuth(apiKey)
      await cacheToken(token)
      return await postExport(backend, token, project)
    }
    throw err
  }
}
