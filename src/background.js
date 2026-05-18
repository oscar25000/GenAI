// EpiPilot — service worker (MV3)
// Opens the dashboard from popup, persists last analysis, and stubs
// the bridge between content script and the AI analysis pipeline.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['epipilot_project'], (res) => {
    if (!res?.epipilot_project) {
      chrome.storage.local.set({
        epipilot_state: { firstRun: true, installedAt: Date.now() },
      })
    }
  })
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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

  return false
})
