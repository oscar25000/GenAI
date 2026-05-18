// EpiPilot — service worker (MV3)
// - Persists the last analysis to chrome.storage.local
// - Handles real Claude API calls so they survive the popup closing
// - Broadcasts progress events to any listener (popup, dashboard, content script)

import { analyzePdfWithClaude } from './lib/claudeClient.js'
import { getSettings, saveProject } from './lib/storage.js'

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['epipilot_project'], (res) => {
    if (!res?.epipilot_project) {
      chrome.storage.local.set({
        epipilot_state: { firstRun: true, installedAt: Date.now() },
      })
    }
  })
})

let inflight = null
let originatingTabId = null

function broadcast(message) {
  // Push to extension pages (popup, dashboard) — fire and forget.
  chrome.runtime.sendMessage(message).catch(() => {})

  // Also push to the tab that kicked off the analysis (content script overlay).
  if (originatingTabId != null) {
    chrome.tabs.sendMessage(originatingTabId, message).catch(() => {})
  }
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk),
    )
  }
  return btoa(binary)
}

async function fetchPdfAsBase64(pdfUrl) {
  let res
  try {
    res = await fetch(pdfUrl, { credentials: 'include' })
  } catch (err) {
    throw new Error(`FETCH_FAILED: ${err?.message || 'network'}`)
  }
  if (!res.ok) throw new Error(`FETCH_FAILED: HTTP ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  if (!/pdf|octet-stream/i.test(ct) && !/\.pdf($|[?#])/i.test(pdfUrl)) {
    throw new Error(`FETCH_FAILED: réponse non-PDF (${ct})`)
  }
  const buf = await res.arrayBuffer()
  return arrayBufferToBase64(buf)
}

async function runAnalysis({ pdfBase64, pdfFilename }) {
  if (inflight) return inflight

  const settings = await getSettings()
  if (!settings.apiKey) throw new Error('API_KEY_MISSING')

  inflight = (async () => {
    try {
      broadcast({ type: 'epipilot:progress', stage: 'Préparation de la requête…', step: 1 })

      const { project, usage } = await analyzePdfWithClaude({
        apiKey: settings.apiKey,
        model: settings.model,
        enableThinking: settings.enableThinking,
        pdfBase64,
        pdfFilename,
        team: settings.team,
        onProgress: (stage) =>
          broadcast({ type: 'epipilot:progress', stage }),
      })

      await saveProject(project)
      broadcast({ type: 'epipilot:done', project, usage })
      return { project, usage }
    } catch (err) {
      broadcast({
        type: 'epipilot:error',
        code: err?.message || 'UNKNOWN',
      })
      throw err
    } finally {
      inflight = null
      originatingTabId = null
    }
  })()

  return inflight
}

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
      .catch((err) =>
        sendResponse({ ok: false, code: err?.message || 'UNKNOWN' }),
      )
    return true
  }

  if (msg?.type === 'epipilot:analyze-url') {
    originatingTabId = sender?.tab?.id ?? null
    ;(async () => {
      try {
        broadcast({
          type: 'epipilot:progress',
          stage: 'Téléchargement du PDF…',
        })
        const base64 = await fetchPdfAsBase64(msg.pdfUrl)
        const filename =
          (msg.pdfUrl.split('/').pop()?.split('?')[0] ||
            (msg.projectName ? `${msg.projectName}.pdf` : 'subject.pdf'))
        const { project } = await runAnalysis({
          pdfBase64: base64,
          pdfFilename: filename,
        })
        sendResponse({ ok: true, project })
      } catch (err) {
        broadcast({
          type: 'epipilot:error',
          code: err?.message || 'UNKNOWN',
        })
        sendResponse({ ok: false, code: err?.message || 'UNKNOWN' })
      }
    })()
    return true
  }

  if (msg?.type === 'epipilot:analysis-status') {
    sendResponse({ inflight: Boolean(inflight) })
    return true
  }

  return false
})
