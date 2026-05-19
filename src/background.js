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

// "Armed" capture: a content script told us "I'm about to trigger a PDF
// in this tab — when it arrives, start a session." We need this because
// my.epitech.eu navigates the current tab to the OVH PDF URL on click,
// killing the content script before it can react.
let armedCapture = null // { tabId, projectName, expiresAt }

function recordPdfUrl(tabId, url) {
  if (tabId == null || tabId < 0) return
  const entry = { url, timestamp: Date.now() }
  pdfUrlsByTab.set(tabId, entry)
  mostRecentPdf = { ...entry, tabId }
}

function looksLikePdf(url, headers) {
  if (/\.pdf(?:[?#]|$)/i.test(url)) return true
  if (/filename%3D[^&]*\.pdf/i.test(url)) return true
  const ct = headers?.find((h) => h.name.toLowerCase() === 'content-type')?.value
  return Boolean(ct && /application\/pdf/i.test(ct))
}

function consumeArmedCapture(tabId, url) {
  if (!armedCapture) return false
  if (armedCapture.tabId !== tabId) return false
  if (Date.now() > armedCapture.expiresAt) {
    armedCapture = null
    return false
  }
  const projectName = armedCapture.projectName
  armedCapture = null
  // Open the dashboard in a fresh tab and run the analysis.
  const dashUrl = chrome.runtime.getURL('dashboard.html#conversation')
  chrome.tabs.create({ url: dashUrl }, () => {
    startConversation({ pdfUrl: url, projectName }).catch((err) => {
      broadcast({
        type: 'epipilot:conv-error',
        code: err?.message || 'UNKNOWN',
      })
    })
  })
  return true
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId == null || details.tabId < 0) return
    if (!looksLikePdf(details.url, details.responseHeaders)) return
    recordPdfUrl(details.tabId, details.url)
    consumeArmedCapture(details.tabId, details.url)
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'],
)

chrome.tabs.onRemoved.addListener((tabId) => {
  pdfUrlsByTab.delete(tabId)
  if (armedCapture?.tabId === tabId) armedCapture = null
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
  broadcast({ type: 'epipilot:conv-status', status: 'fetching' })
  const base64 = await fetchPdfAsBase64(pdfUrl)
  const filename = pdfUrl.split('/').pop()?.split('?')[0] || 'subject.pdf'
  await startConversationFromBase64({
    pdfBase64: base64,
    pdfFilename: filename,
    projectName,
  })
}

async function startConversationFromBase64({ pdfBase64, pdfFilename, projectName }) {
  const settings = await getSettings()
  if (!settings.apiKey) throw new Error('API_KEY_MISSING')

  const project = emptyProject(projectName)
  project.sourcePdf = pdfFilename || 'subject.pdf'

  const firstUserMessage = `Sujet à analyser : ${projectName || 'projet Epitech'}.

Lis le PDF, produis un résumé clair avec set_summary, puis démarre la conversation pour construire le plan ensemble. Commence par te présenter brièvement et présente le résumé.`

  const conversation = {
    messages: [{ role: 'user', content: firstUserMessage }],
    project,
    pdfBase64,
    pdfFilename: pdfFilename || 'subject.pdf',
    projectName,
    status: 'thinking',
    createdAt: new Date().toISOString(),
  }
  await saveConversation(conversation)
  broadcast({
    type: 'epipilot:conv-update',
    conversation: conversationForBroadcast(conversation),
  })

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

  if (msg?.type === 'epipilot:open-upload') {
    // Stash the project name and open the dashboard. The conversation UI
    // will read the pending upload flag and prompt for the PDF.
    const url = chrome.runtime.getURL('dashboard.html#conversation')
    chrome.storage.local.set({
      epipilot_pending_upload: {
        projectName: msg.projectName || '',
        timestamp: Date.now(),
      },
    })
    chrome.tabs.create({ url })
    sendResponse({ ok: true })
    return true
  }

  if (msg?.type === 'epipilot:get-pending-upload') {
    chrome.storage.local.get(['epipilot_pending_upload'], (res) => {
      const p = res?.epipilot_pending_upload
      if (!p) {
        sendResponse({ pending: null })
        return
      }
      const fresh = Date.now() - (p.timestamp || 0) < 30 * 60_000
      sendResponse({ pending: fresh ? p : null })
    })
    return true
  }

  if (msg?.type === 'epipilot:start-from-upload') {
    ;(async () => {
      try {
        await startConversationFromBase64({
          pdfBase64: msg.pdfBase64,
          pdfFilename: msg.pdfFilename,
          projectName: msg.projectName,
        })
        chrome.storage.local.remove(['epipilot_pending_upload'])
        sendResponse({ ok: true })
      } catch (err) {
        broadcast({
          type: 'epipilot:conv-error',
          code: err?.message || 'UNKNOWN',
        })
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

  if (msg?.type === 'epipilot:arm-pdf-capture') {
    const tabId = sender?.tab?.id
    if (tabId == null) {
      sendResponse({ ok: false, code: 'NO_TAB' })
      return true
    }
    armedCapture = {
      tabId,
      projectName: msg.projectName || null,
      expiresAt: Date.now() + (msg.ttlSeconds || 30) * 1000,
    }
    sendResponse({ ok: true, tabId })
    return true
  }

  if (msg?.type === 'epipilot:disarm-pdf-capture') {
    armedCapture = null
    sendResponse({ ok: true })
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
