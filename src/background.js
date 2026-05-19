// EpiPilot — service worker (MV3)
//
// Responsibilities:
//  - Persist last analysis and live conversation state in chrome.storage
//  - Drive the guided conversation: fetch PDF, run agentic chat loop, broadcast updates
//  - Open the dashboard from the content script's "Analyser" button

import { analyzePdfWithClaude, chatTurn } from './lib/claudeClient.js'
import {
  getSettings,
  saveProject,
  getConversation,
  saveConversation,
  clearConversation,
} from './lib/storage.js'

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['epipilot_project'], (res) => {
    if (!res?.epipilot_project) {
      chrome.storage.local.set({
        epipilot_state: { firstRun: true, installedAt: Date.now() },
      })
    }
  })
})

// ────────────────────────────────────── webRequest PDF interception ──
// my.epitech.eu uses a custom PDF viewer (PDF.js) that doesn't expose the
// PDF URL via <a href> / <iframe> / <embed>. Intercepting the network
// request that actually downloads the PDF is the only reliable way to
// capture its URL — and it has the bonus of working with auth cookies.

const pdfUrlsByTab = new Map() // tabId → { url, timestamp }
let mostRecentPdf = null // global fallback in case clicking opens a new tab

function recordPdfUrl(tabId, url) {
  if (tabId == null || tabId < 0) return
  const entry = { url, timestamp: Date.now() }
  pdfUrlsByTab.set(tabId, entry)
  mostRecentPdf = { ...entry, tabId }
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId == null || details.tabId < 0) return
    // 1) URL ends in .pdf (with optional query/hash)
    if (/\.pdf(?:[?#]|$)/i.test(details.url)) {
      recordPdfUrl(details.tabId, details.url)
      return
    }
    // 2) Content-Type says PDF (needs responseHeaders extra-info)
    const ct = details.responseHeaders?.find(
      (h) => h.name.toLowerCase() === 'content-type',
    )?.value
    if (ct && /application\/pdf/i.test(ct)) {
      recordPdfUrl(details.tabId, details.url)
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'],
)

chrome.tabs.onRemoved.addListener((tabId) => {
  pdfUrlsByTab.delete(tabId)
})

let inflight = null

function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {})
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function fetchPdfAsBase64(pdfUrl) {
  // Presigned URLs (X-Amz-Signature, etc.) reject requests with cookies on
  // some buckets due to strict CORS. Only send cookies for Epitech domains
  // where they may actually be needed.
  const isEpitech = /^https:\/\/[^/]*\.epitech\.eu\//.test(pdfUrl)
  const init = {
    credentials: isEpitech ? 'include' : 'omit',
  }
  let res
  try {
    res = await fetch(pdfUrl, init)
  } catch (err) {
    throw new Error(`FETCH_FAILED: ${err?.message || 'network'} (URL: ${pdfUrl.slice(0, 80)}…)`)
  }
  if (!res.ok) throw new Error(`FETCH_FAILED: HTTP ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  const looksLikePdf =
    /pdf|octet-stream/i.test(ct) ||
    /\.pdf($|[?#])/i.test(pdfUrl) ||
    /filename%3D[^&]*\.pdf/i.test(pdfUrl)
  if (!looksLikePdf) {
    throw new Error(`FETCH_FAILED: réponse non-PDF (content-type ${ct})`)
  }
  const buf = await res.arrayBuffer()
  return arrayBufferToBase64(buf)
}

function emptyProject(projectName) {
  return {
    id: `proj_${Date.now().toString(36)}`,
    name: projectName || 'Projet',
    sourcePdf: '',
    importedAt: new Date().toISOString(),
    deadline: '',
    durationDays: 0,
    difficulty: 0,
    riskScore: 0,
    estimatedHours: 0,
    progress: 0,
    summary: null,
    warnings: [],
    team: [],
    tasks: [],
    planning: [],
    risks: [],
    checklist: [],
  }
}

// ──────────────────────────────────────────────────────── one-shot analysis ──
// Retained for the popup's "Importer un PDF" flow when no conversation is active.

async function runAnalysis({ pdfBase64, pdfFilename }) {
  if (inflight) return inflight

  const settings = await getSettings()
  if (!settings.apiKey) throw new Error('API_KEY_MISSING')

  inflight = (async () => {
    try {
      broadcast({ type: 'epipilot:progress', stage: 'Préparation de la requête…' })
      const { project, usage } = await analyzePdfWithClaude({
        apiKey: settings.apiKey,
        model: settings.model,
        enableThinking: settings.enableThinking,
        pdfBase64,
        pdfFilename,
        team: settings.team,
        onProgress: (stage) => broadcast({ type: 'epipilot:progress', stage }),
      })
      await saveProject(project)
      broadcast({ type: 'epipilot:done', project, usage })
      return { project, usage }
    } catch (err) {
      broadcast({ type: 'epipilot:error', code: err?.message || 'UNKNOWN' })
      throw err
    } finally {
      inflight = null
    }
  })()

  return inflight
}

// ────────────────────────────────────────────────────────── conversation ──

async function startConversation({ pdfUrl, projectName }) {
  const settings = await getSettings()
  if (!settings.apiKey) throw new Error('API_KEY_MISSING')

  broadcast({ type: 'epipilot:conv-status', status: 'fetching' })
  const base64 = await fetchPdfAsBase64(pdfUrl)
  const filename = pdfUrl.split('/').pop()?.split('?')[0] || 'subject.pdf'

  const project = emptyProject(projectName)
  project.sourcePdf = filename

  const firstUserMessage = `Sujet à analyser : ${projectName || 'projet Epitech'}.

Lis le PDF, produis un résumé clair avec set_summary, puis démarre la conversation pour construire le plan ensemble. Commence par te présenter brièvement et présente le résumé.`

  const conversation = {
    messages: [{ role: 'user', content: firstUserMessage }],
    project,
    pdfBase64: base64,
    pdfFilename: filename,
    projectName,
    status: 'thinking',
    createdAt: new Date().toISOString(),
  }
  await saveConversation(conversation)
  broadcast({ type: 'epipilot:conv-update', conversation: conversationForBroadcast(conversation) })

  // Fire the first turn (no user input beyond the synthetic kickoff).
  await runNextTurn({ includePdf: true })
}

async function sendUserMessage(text) {
  const conv = await getConversation()
  if (!conv) throw new Error('NO_CONVERSATION')

  conv.messages.push({ role: 'user', content: text })
  conv.status = 'thinking'
  await saveConversation(conv)
  broadcast({ type: 'epipilot:conv-update', conversation: conversationForBroadcast(conv) })

  await runNextTurn({ includePdf: false })
}

async function runNextTurn({ includePdf }) {
  if (inflight) return inflight

  const settings = await getSettings()
  const conv = await getConversation()
  if (!conv) throw new Error('NO_CONVERSATION')

  inflight = (async () => {
    try {
      const { assistantText, project } = await chatTurn({
        apiKey: settings.apiKey,
        model: settings.model,
        enableThinking: settings.enableThinking,
        history: conv.messages,
        project: conv.project,
        pdfBase64: includePdf ? conv.pdfBase64 : null,
        onToolApplied: async (toolName, nextProject) => {
          conv.project = nextProject
          await saveConversation(conv)
          broadcast({
            type: 'epipilot:conv-tool',
            toolName,
            project: nextProject,
          })
        },
        onProgress: (stage) =>
          broadcast({ type: 'epipilot:conv-progress', stage }),
      })

      conv.messages.push({
        role: 'assistant',
        content: assistantText || '…',
      })
      conv.project = project
      conv.status = 'idle'
      await saveConversation(conv)
      await saveProject(project)
      broadcast({
        type: 'epipilot:conv-update',
        conversation: conversationForBroadcast(conv),
      })
    } catch (err) {
      conv.status = 'error'
      conv.lastError = err?.message || 'UNKNOWN'
      await saveConversation(conv)
      broadcast({
        type: 'epipilot:conv-error',
        code: conv.lastError,
        conversation: conversationForBroadcast(conv),
      })
    } finally {
      inflight = null
    }
  })()

  return inflight
}

// Strip pdfBase64 from the broadcast — it's heavy and not needed on the client.
function conversationForBroadcast(conv) {
  const { pdfBase64: _omit, ...rest } = conv
  return rest
}

// ─────────────────────────────────────────────────────── message router ──

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'epipilot:open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
    sendResponse({ ok: true })
    return true
  }

  if (msg?.type === 'epipilot:save-project') {
    chrome.storage.local.set({ epipilot_project: msg.project }, () => {
      sendResponse({ ok: true })
    })
    return true
  }

  if (msg?.type === 'epipilot:get-project') {
    chrome.storage.local.get(['epipilot_project'], (res) => {
      sendResponse({ project: res?.epipilot_project || null })
    })
    return true
  }

  if (msg?.type === 'epipilot:analyze') {
    runAnalysis({
      pdfBase64: msg.pdfBase64,
      pdfFilename: msg.pdfFilename,
    })
      .then((res) => sendResponse({ ok: true, project: res.project }))
      .catch((err) => sendResponse({ ok: false, code: err?.message || 'UNKNOWN' }))
    return true
  }

  if (msg?.type === 'epipilot:analyze-url') {
    ;(async () => {
      try {
        broadcast({ type: 'epipilot:progress', stage: 'Téléchargement du PDF…' })
        const base64 = await fetchPdfAsBase64(msg.pdfUrl)
        const filename =
          msg.pdfUrl.split('/').pop()?.split('?')[0] ||
          (msg.projectName ? `${msg.projectName}.pdf` : 'subject.pdf')
        const { project } = await runAnalysis({ pdfBase64: base64, pdfFilename: filename })
        sendResponse({ ok: true, project })
      } catch (err) {
        broadcast({ type: 'epipilot:error', code: err?.message || 'UNKNOWN' })
        sendResponse({ ok: false, code: err?.message || 'UNKNOWN' })
      }
    })()
    return true
  }

  if (msg?.type === 'epipilot:start-session') {
    // Content script kicked off — open the dashboard immediately, then begin
    // the conversation in the background.
    const url = chrome.runtime.getURL('dashboard.html#conversation')
    chrome.tabs.create({ url }, () => {
      startConversation({ pdfUrl: msg.pdfUrl, projectName: msg.projectName }).catch(
        (err) => {
          broadcast({ type: 'epipilot:conv-error', code: err?.message || 'UNKNOWN' })
        },
      )
    })
    sendResponse({ ok: true })
    return true
  }

  if (msg?.type === 'epipilot:conv-send') {
    sendUserMessage(msg.text)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, code: err?.message || 'UNKNOWN' }))
    return true
  }

  if (msg?.type === 'epipilot:conv-get') {
    getConversation().then((conv) => {
      sendResponse({ conversation: conv ? conversationForBroadcast(conv) : null })
    })
    return true
  }

  if (msg?.type === 'epipilot:conv-clear') {
    clearConversation().then(() => sendResponse({ ok: true }))
    return true
  }

  if (msg?.type === 'epipilot:analysis-status') {
    sendResponse({ inflight: Boolean(inflight) })
    return true
  }

  if (msg?.type === 'epipilot:find-pdf') {
    const tabId = sender?.tab?.id
    const tabEntry = tabId != null ? pdfUrlsByTab.get(tabId) : null
    if (tabEntry) {
      sendResponse({
        pdfUrl: tabEntry.url,
        timestamp: tabEntry.timestamp,
        source: 'tab',
      })
      return true
    }
    // Cross-tab fallback (clicking the tree node might open a new tab).
    if (mostRecentPdf && Date.now() - mostRecentPdf.timestamp < 30_000) {
      sendResponse({
        pdfUrl: mostRecentPdf.url,
        timestamp: mostRecentPdf.timestamp,
        source: 'global',
      })
      return true
    }
    sendResponse({ pdfUrl: null })
    return true
  }

  return false
})
