/* EpiPilot — content script for my.epitech.eu and intra.epitech.eu.
 *
 * Goal: spot the project cards on the listing page, drop an "Analyser"
 * pill on each one, and when the user clicks it, find the subject PDF,
 * hand it to the background service worker, and stream progress back
 * into a small overlay.
 *
 * Heuristic detection — the my.epitech.eu DOM isn't published, so we try
 * several selectors in priority order and fall back to anchor-based card
 * detection (find <a href="/projects/..."> and walk up to the nearest
 * card-sized container).
 *
 * MV3 content scripts can't `import`, so this file is vanilla JS and
 * lives in /public so Vite copies it verbatim.
 */
;(function () {
  if (window.__EPIPILOT_CONTENT__) return
  window.__EPIPILOT_CONTENT__ = true

  // ───────────────────────────────────────────────────────────── styles ──
  const STYLE = `
.epipilot-btn {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  font-size: 10.5px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  color: white;
  background: #2563EB;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease, opacity 140ms ease;
  user-select: none;
  opacity: 0;
  pointer-events: none;
}
.epipilot-has-btn:hover > .epipilot-btn,
.epipilot-btn:hover,
.epipilot-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
}
.epipilot-btn:hover { background: #1D4ED8; }
.epipilot-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.epipilot-btn svg { width: 10px; height: 10px; }

.epipilot-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483646;
  padding: 10px 14px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  color: #F4F1FF;
  background: rgba(17, 16, 26, 0.92);
  border: 1px solid rgba(130, 87, 255, 0.35);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 12px;
  box-shadow: 0 12px 40px -12px rgba(0,0,0,0.6), 0 0 24px -8px rgba(130, 87, 255, 0.35);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: epipilot-fade-in 200ms ease-out;
}
.epipilot-toast .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8257FF;
  box-shadow: 0 0 12px #8257FF;
}

.epipilot-overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(7, 6, 11, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 24px;
  animation: epipilot-fade-in 200ms ease-out;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
}
.epipilot-overlay {
  width: 100%;
  max-width: 480px;
  color: #F4F1FF;
  background: linear-gradient(180deg, rgba(42, 40, 64, 0.95) 0%, rgba(17, 16, 26, 0.95) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7), 0 0 40px -8px rgba(130, 87, 255, 0.3);
}
.epipilot-overlay-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.epipilot-overlay-logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8257FF, #5429D6);
  display: grid;
  place-items: center;
  box-shadow: 0 0 28px -4px rgba(130, 87, 255, 0.7);
}
.epipilot-overlay-logo svg { width: 16px; height: 16px; color: white; }
.epipilot-overlay h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.epipilot-overlay .sub {
  margin: 0;
  font-size: 11px;
  color: rgba(244, 241, 255, 0.5);
}
.epipilot-overlay .close {
  margin-left: auto;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(244, 241, 255, 0.7);
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.epipilot-overlay .close:hover { color: white; background: rgba(255,255,255,0.1); }
.epipilot-overlay .close svg { width: 12px; height: 12px; }

.epipilot-project-name {
  font-size: 13px;
  color: rgba(244, 241, 255, 0.85);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 14px;
}
.epipilot-project-name .label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(181, 156, 255, 0.6);
  display: block;
  margin-bottom: 2px;
}

.epipilot-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.epipilot-steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: rgba(244, 241, 255, 0.5);
  transition: color 200ms ease;
}
.epipilot-steps li.active { color: #F4F1FF; }
.epipilot-steps li.done { color: rgba(181, 156, 255, 0.85); }
.epipilot-steps li .marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
  display: grid;
  place-items: center;
  transition: all 200ms ease;
}
.epipilot-steps li.done .marker {
  background: linear-gradient(135deg, #8257FF, #5429D6);
  border-color: rgba(130, 87, 255, 0.5);
}
.epipilot-steps li.done .marker::after {
  content: '';
  width: 5px;
  height: 5px;
  background: white;
  border-radius: 50%;
}
.epipilot-steps li.active .marker {
  border-color: #8257FF;
  background: rgba(130, 87, 255, 0.15);
}
.epipilot-steps li.active .marker::after {
  content: '';
  width: 4px;
  height: 4px;
  background: #8257FF;
  border-radius: 50%;
  animation: epipilot-pulse 1.2s ease-in-out infinite;
}

.epipilot-actions {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.epipilot-actions button {
  font-size: 12px;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid transparent;
  transition: all 120ms ease;
}
.epipilot-actions .secondary {
  background: rgba(255,255,255,0.05);
  color: rgba(244, 241, 255, 0.85);
  border-color: rgba(255,255,255,0.1);
}
.epipilot-actions .secondary:hover { background: rgba(255,255,255,0.09); }
.epipilot-actions .primary {
  background: linear-gradient(135deg, #8257FF, #5429D6);
  color: white;
  border-color: rgba(130, 87, 255, 0.4);
  box-shadow: 0 4px 18px -4px rgba(130, 87, 255, 0.55);
  font-weight: 500;
}
.epipilot-actions .primary:hover { transform: translateY(-1px); }

.epipilot-error {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: rgb(253, 164, 175);
  font-size: 12px;
  line-height: 1.45;
}

@keyframes epipilot-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes epipilot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}
`

  const styleEl = document.createElement('style')
  styleEl.textContent = STYLE
  styleEl.dataset.epipilot = 'styles'
  document.documentElement.appendChild(styleEl)

  // ──────────────────────────────────────────────────────── SVG snippets ──
  const ICONS = {
    sparkles:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  }

  // ─────────────────────────────────────────── card detection heuristics ──
  const CARD_SELECTORS = [
    '[data-testid*="project-card" i]',
    '[data-testid*="ProjectCard" i]',
    '[data-testid*="project" i][data-testid*="card" i]',
    '[class*="ProjectCard"]',
    '[class*="project-card" i]',
    '[class*="ProjectListItem"]',
    '[class*="project-tile" i]',
    '[class*="ProjectTile" i]',
  ]

  function findProjectCards() {
    for (const sel of CARD_SELECTORS) {
      try {
        const els = document.querySelectorAll(sel)
        if (els.length > 0) return Array.from(els)
      } catch {
        /* invalid selector — skip */
      }
    }

    // Fallback: anchors pointing at project routes → walk up to a card-sized
    // ancestor. Tuned for typical card dimensions on listing pages.
    const anchors = document.querySelectorAll(
      'a[href*="/projects/"], a[href*="/project/"], a[href*="/module/"][href*="/project"]',
    )
    const cards = new Set()
    for (const a of anchors) {
      const card = findCardAncestor(a)
      if (card) cards.add(card)
    }
    return Array.from(cards)
  }

  function findCardAncestor(node) {
    let cur = node
    for (let i = 0; i < 8 && cur && cur !== document.body; i++) {
      const r = cur.getBoundingClientRect?.()
      if (
        r &&
        r.width > 220 &&
        r.height > 90 &&
        r.width < window.innerWidth * 0.95
      ) {
        return cur
      }
      cur = cur.parentElement
    }
    return null
  }

  function extractProjectName(card) {
    // Try common title carriers.
    const titleEl =
      card.querySelector('h1, h2, h3, h4, [class*="title" i], [class*="Title"]') ||
      card.querySelector('a[href*="/project"]')
    if (titleEl?.textContent) {
      return titleEl.textContent.trim().slice(0, 100)
    }
    return 'Projet Epitech'
  }

  function findPdfUrl(card) {
    // Look for a direct PDF link inside the card.
    const link =
      card.querySelector(
        'a[href$=".pdf"], a[href*=".pdf?"], a[href*=".pdf#"]',
      ) ||
      card.querySelector('a[href*="subject"], a[href*="sujet"]')
    if (link?.href) return link.href
    return null
  }

  // ─────────────────────────────────────────────── button injection ─────
  function injectButton(card) {
    if (card.querySelector(':scope > .epipilot-btn')) return false
    if (card.dataset.epipilotInjected === '1') return false
    card.dataset.epipilotInjected = '1'

    const computed = window.getComputedStyle(card)
    if (computed.position === 'static') {
      card.style.position = 'relative'
    }
    card.classList.add('epipilot-has-btn')

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'epipilot-btn'
    btn.innerHTML = `${ICONS.sparkles}<span>Analyser</span>`
    btn.title = 'Analyser ce projet avec EpiPilot'
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      handleAnalyzeClick(card)
    })
    card.appendChild(btn)

    // Align the button vertically with the project title so it reads as an
    // action attached to the project, not a floating chip. We do this once
    // at injection — good enough for the listing page layout.
    const title =
      card.querySelector('h1, h2, h3, h4') ||
      card.querySelector('[class*="title" i], [class*="Title"]') ||
      card.querySelector('a[href*="/project"]')
    if (title) {
      const titleRect = title.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const btnHeight = btn.offsetHeight || 22
      const center = titleRect.top - cardRect.top + titleRect.height / 2
      btn.style.top = `${Math.max(4, Math.round(center - btnHeight / 2))}px`
    }

    return true
  }

  function refreshButtons() {
    const cards = findProjectCards()
    let added = 0
    for (const c of cards) if (injectButton(c)) added += 1
    if (added > 0) showToast(`${added} projet${added > 1 ? 's' : ''} analysable${added > 1 ? 's' : ''} détecté${added > 1 ? 's' : ''}`)
    return cards.length
  }

  // ───────────────────────────────────────────────────────────── toast ──
  let toastTimer = null
  function showToast(text) {
    let toast = document.querySelector('.epipilot-toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.className = 'epipilot-toast'
      toast.innerHTML = `<span class="dot"></span><span class="msg"></span>`
      document.body.appendChild(toast)
    }
    toast.querySelector('.msg').textContent = `EpiPilot · ${text}`
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  // ─────────────────────────────────────────────────── overlay state ──
  let currentOverlay = null
  let currentStep = 0
  let pendingProject = null

  const STEP_LABELS = [
    'Récupération du PDF du sujet',
    'Envoi à Claude',
    'Identification du contexte et des objectifs',
    'Détection des livrables et contraintes',
    'Génération des tâches et du planning',
    'Analyse des risques et de la charge équipe',
  ]

  function openOverlay(projectName) {
    closeOverlay()
    currentStep = 0
    pendingProject = null

    const backdrop = document.createElement('div')
    backdrop.className = 'epipilot-overlay-backdrop'
    backdrop.innerHTML = `
      <div class="epipilot-overlay" role="dialog" aria-modal="true">
        <div class="epipilot-overlay-header">
          <div class="epipilot-overlay-logo">${ICONS.sparkles}</div>
          <div>
            <h3>Analyse en cours</h3>
            <p class="sub">EpiPilot · Claude Opus 4.7</p>
          </div>
          <button class="close" aria-label="Fermer">${ICONS.close}</button>
        </div>
        <div class="epipilot-project-name">
          <span class="label">Projet</span>
          <span class="name"></span>
        </div>
        <ul class="epipilot-steps"></ul>
        <div class="epipilot-error" hidden></div>
        <div class="epipilot-actions" hidden>
          <button class="secondary" data-action="close">Fermer</button>
          <button class="primary" data-action="open-dashboard">Ouvrir le dashboard</button>
        </div>
      </div>
    `
    backdrop.querySelector('.name').textContent = projectName
    backdrop.querySelector('.close').addEventListener('click', closeOverlay)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeOverlay()
    })
    backdrop.querySelectorAll('[data-action]').forEach((b) =>
      b.addEventListener('click', () => {
        const action = b.getAttribute('data-action')
        if (action === 'close') closeOverlay()
        if (action === 'open-dashboard') {
          chrome.runtime.sendMessage({ type: 'epipilot:open-dashboard' })
          closeOverlay()
        }
      }),
    )

    const stepsEl = backdrop.querySelector('.epipilot-steps')
    STEP_LABELS.forEach((label) => {
      const li = document.createElement('li')
      li.innerHTML = `<span class="marker"></span><span>${label}</span>`
      stepsEl.appendChild(li)
    })

    document.body.appendChild(backdrop)
    currentOverlay = backdrop
    setStep(0)
  }

  function setStep(n) {
    if (!currentOverlay) return
    currentStep = n
    const items = currentOverlay.querySelectorAll('.epipilot-steps li')
    items.forEach((el, i) => {
      el.classList.toggle('done', i < n)
      el.classList.toggle('active', i === n)
    })
  }

  function showOverlayError(message) {
    if (!currentOverlay) return
    const err = currentOverlay.querySelector('.epipilot-error')
    err.textContent = message
    err.hidden = false
    const actions = currentOverlay.querySelector('.epipilot-actions')
    actions.hidden = false
    actions.querySelector('.primary').textContent = 'Réessayer'
    actions.querySelector('.primary').dataset.action = 'close'
  }

  function showOverlayDone() {
    if (!currentOverlay) return
    setStep(STEP_LABELS.length)
    currentOverlay.querySelector('.epipilot-actions').hidden = false
  }

  function closeOverlay() {
    if (currentOverlay) {
      currentOverlay.remove()
      currentOverlay = null
    }
  }

  // ──────────────────────────────────────────────── analyze click flow ──
  async function handleAnalyzeClick(card) {
    const name = extractProjectName(card)
    openOverlay(name)

    const pdfUrl = findPdfUrl(card)
    if (!pdfUrl) {
      showOverlayError(
        "Aucun PDF de sujet trouvé sur cette carte. Ouvre le projet, puis clique sur le PDF depuis la page suivante (un futur update permettra l'analyse depuis la liste directement).",
      )
      return
    }

    setStep(0)
    try {
      await chrome.runtime.sendMessage({
        type: 'epipilot:analyze-url',
        pdfUrl,
        projectName: name,
      })
    } catch (err) {
      showOverlayError(
        'Le service worker ne répond pas. Recharge l\'extension dans chrome://extensions, puis recommence.',
      )
    }
  }

  // ───────────────────────────────────── messages from background SW ──
  const STAGE_TO_STEP = [
    { match: /Préparation/i, step: 1 },
    { match: /Envoi du PDF|Envoi à Claude/i, step: 1 },
    { match: /contexte|objectifs/i, step: 2 },
    { match: /livrables|contraintes/i, step: 3 },
    { match: /tâches|planning/i, step: 4 },
    { match: /risques|charge/i, step: 5 },
    { match: /Structuration|terminée/i, step: 6 },
  ]

  chrome.runtime.onMessage.addListener((msg) => {
    if (!currentOverlay) return
    if (msg?.type === 'epipilot:progress') {
      const match = STAGE_TO_STEP.find((s) => s.match.test(msg.stage || ''))
      if (match) setStep(match.step)
    } else if (msg?.type === 'epipilot:done') {
      pendingProject = msg.project
      showOverlayDone()
    } else if (msg?.type === 'epipilot:error') {
      showOverlayError(translateError(msg.code))
    }
  })

  function translateError(code) {
    if (!code) return 'Erreur inconnue.'
    if (code === 'API_KEY_MISSING')
      return "Pas de clé API. Ouvre le dashboard EpiPilot et configure-la dans Settings."
    if (code === 'API_KEY_INVALID') return 'Clé API refusée.'
    if (code === 'RATE_LIMITED') return 'Limite Anthropic atteinte. Réessaie dans une minute.'
    if (code === 'NO_OUTPUT') return "Claude n'a pas retourné de réponse exploitable."
    if (code === 'PARSE_FAILED') return 'Impossible de parser la réponse JSON.'
    if (code.startsWith('FETCH_FAILED')) return `Téléchargement du PDF impossible (${code.replace('FETCH_FAILED:', '').trim()}).`
    if (code.startsWith('BAD_REQUEST')) return `Requête refusée : ${code.replace('BAD_REQUEST:', '').trim()}`
    return code
  }

  // ──────────────────────────────────────── DOM ready + SPA observer ──
  function init() {
    refreshButtons()
    const observer = new MutationObserver(
      debounce(() => {
        refreshButtons()
      }, 250),
    )
    observer.observe(document.body, { childList: true, subtree: true })
  }

  function debounce(fn, ms) {
    let t = null
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn(...args), ms)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
