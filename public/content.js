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
  if (window.__EPILOT_CONTENT__) return
  window.__EPILOT_CONTENT__ = true

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
.epilot-has-btn:hover > .epilot-btn,
.epilot-btn:hover,
.epilot-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
}
.epilot-btn:hover { background: #1D4ED8; }
.epilot-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.epilot-btn svg { width: 10px; height: 10px; }

.epilot-detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  margin: 14px 0;
  font-size: 13px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  color: white;
  background: linear-gradient(135deg, #8257FF 0%, #5429D6 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 24px -6px rgba(130, 87, 255, 0.55);
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.epilot-detail-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px -6px rgba(130, 87, 255, 0.7);
}
.epilot-detail-btn svg { width: 13px; height: 13px; }

.epilot-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483645;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  font-size: 13px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  color: white;
  background: linear-gradient(135deg, #8257FF 0%, #5429D6 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 14px 40px -10px rgba(130, 87, 255, 0.65), 0 0 0 1px rgba(130, 87, 255, 0.25);
  transition: transform 120ms ease, box-shadow 120ms ease;
  animation: epipilot-fade-in 250ms ease-out;
}
.epilot-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 44px -10px rgba(130, 87, 255, 0.8);
}
.epilot-fab svg { width: 14px; height: 14px; }
.epilot-fab .status {
  font-size: 10.5px;
  opacity: 0.7;
  font-weight: 400;
}

.epilot-toast {
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
.epilot-toast .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8257FF;
  box-shadow: 0 0 12px #8257FF;
}

.epilot-overlay-backdrop {
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
.epilot-overlay {
  width: 100%;
  max-width: 480px;
  color: #F4F1FF;
  background: linear-gradient(180deg, rgba(42, 40, 64, 0.95) 0%, rgba(17, 16, 26, 0.95) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7), 0 0 40px -8px rgba(130, 87, 255, 0.3);
}
.epilot-overlay-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.epilot-overlay-logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8257FF, #5429D6);
  display: grid;
  place-items: center;
  box-shadow: 0 0 28px -4px rgba(130, 87, 255, 0.7);
}
.epilot-overlay-logo svg { width: 16px; height: 16px; color: white; }
.epilot-overlay-logo img { width: 24px; height: 24px; object-fit: contain; }
.epilot-overlay h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.epilot-overlay .sub {
  margin: 0;
  font-size: 11px;
  color: rgba(244, 241, 255, 0.5);
}
.epilot-overlay .close {
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
.epilot-overlay .close:hover { color: white; background: rgba(255,255,255,0.1); }
.epilot-overlay .close svg { width: 12px; height: 12px; }

.epilot-project-name {
  font-size: 13px;
  color: rgba(244, 241, 255, 0.85);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 14px;
}
.epilot-project-name .label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(181, 156, 255, 0.6);
  display: block;
  margin-bottom: 2px;
}

.epilot-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.epilot-steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: rgba(244, 241, 255, 0.5);
  transition: color 200ms ease;
}
.epilot-steps li.active { color: #F4F1FF; }
.epilot-steps li.done { color: rgba(181, 156, 255, 0.85); }
.epilot-steps li .marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
  display: grid;
  place-items: center;
  transition: all 200ms ease;
}
.epilot-steps li.done .marker {
  background: linear-gradient(135deg, #8257FF, #5429D6);
  border-color: rgba(130, 87, 255, 0.5);
}
.epilot-steps li.done .marker::after {
  content: '';
  width: 5px;
  height: 5px;
  background: white;
  border-radius: 50%;
}
.epilot-steps li.active .marker {
  border-color: #8257FF;
  background: rgba(130, 87, 255, 0.15);
}
.epilot-steps li.active .marker::after {
  content: '';
  width: 4px;
  height: 4px;
  background: #8257FF;
  border-radius: 50%;
  animation: epipilot-pulse 1.2s ease-in-out infinite;
}

.epilot-actions {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.epilot-actions button {
  font-size: 12px;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid transparent;
  transition: all 120ms ease;
}
.epilot-actions .secondary {
  background: rgba(255,255,255,0.05);
  color: rgba(244, 241, 255, 0.85);
  border-color: rgba(255,255,255,0.1);
}
.epilot-actions .secondary:hover { background: rgba(255,255,255,0.09); }
.epilot-actions .primary {
  background: linear-gradient(135deg, #8257FF, #5429D6);
  color: white;
  border-color: rgba(130, 87, 255, 0.4);
  box-shadow: 0 4px 18px -4px rgba(130, 87, 255, 0.55);
  font-weight: 500;
}
.epilot-actions .primary:hover { transform: translateY(-1px); }

.epilot-error {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: rgb(253, 164, 175);
  font-size: 12px;
  line-height: 1.45;
}

@keyframes epilot-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes epilot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}
`

  const styleEl = document.createElement('style')
  styleEl.textContent = STYLE
  styleEl.dataset.epilot = 'styles'
  document.documentElement.appendChild(styleEl)

  // ──────────────────────────────────────────────────────── SVG snippets ──
  const ICONS = {
    sparkles:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  }
  const LOGO_ICON_URL = chrome.runtime.getURL('icons/icon-32.png')

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

  // Ask the background SW for any PDF URL it captured on this tab via
  // chrome.webRequest. This is the reliable fallback when the page uses a
  // custom PDF viewer that doesn't expose URLs in the DOM.
  function findPdfUrlFromNetwork({ sameTabOnly = false } = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { type: 'epipilot:find-pdf', sameTabOnly },
          (res) => {
            resolve(res?.pdfUrl || null)
          },
        )
      } catch {
        resolve(null)
      }
    })
  }

  async function resolvePdfUrl(root) {
    // On the detail page we accept the aggressive scanner.
    const inDom = findPdfUrlAggressive(root)
    if (inDom) return inDom
    const fromNet = await findPdfUrlFromNetwork()
    return fromNet
  }

  // ─────────────────────────── Mantine tree node lazy reveal ───────────
  // my.epitech.eu shows PDFs as treeitems with [data-value="*.pdf"] and the
  // actual presigned URL is fetched lazily on click. We simulate the click,
  // then poll the webRequest cache for the URL the browser just fetched.

  function findPdfTreeNode(root) {
    const all = Array.from(
      root.querySelectorAll(
        '[data-value$=".pdf" i], [data-file$=".pdf" i], [data-name$=".pdf" i]',
      ),
    )
    if (all.length === 0) return null
    // Prefer the file most likely to be the subject.
    const preferred = all.find((c) => {
      const v = (
        c.getAttribute('data-value') ||
        c.getAttribute('data-file') ||
        c.getAttribute('data-name') ||
        ''
      ).toLowerCase()
      return /project|subject|sujet/.test(v)
    })
    return preferred || all[0]
  }

  function findClickable(el) {
    const childTarget = el.querySelector?.(
      'button, a, [role="button"], span, [class*="label" i], [class*="node" i]',
    )
    if (childTarget) return childTarget

    let cur = el
    for (let i = 0; cur && i < 6; i++) {
      if (
        cur.matches?.(
          '[role="treeitem"], [role="button"], button, a, [tabindex]:not([tabindex="-1"])',
        )
      ) {
        return cur
      }
      cur = cur.parentElement
    }
    return el
  }

  function clickLikeUser(el) {
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
    }
    el.dispatchEvent(new PointerEvent('pointerdown', opts))
    el.dispatchEvent(new MouseEvent('mousedown', opts))
    el.dispatchEvent(new PointerEvent('pointerup', opts))
    el.dispatchEvent(new MouseEvent('mouseup', opts))
    el.dispatchEvent(new MouseEvent('click', opts))
  }

  function armPdfCapture(projectName, ttlSeconds = 30, options = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          {
            type: 'epipilot:arm-pdf-capture',
            projectName,
            ttlSeconds,
            openDashboard: options.openDashboard !== false,
            closeSourceTab: Boolean(options.closeSourceTab),
          },
          (res) => resolve(Boolean(res?.ok)),
        )
      } catch {
        resolve(false)
      }
    })
  }

  // Returns:
  //  { url }      — synchronous URL found, caller should trigger analysis now
  //  { deferred } — armed background capture + clicked tree node, background
  //                 will start the session when the navigation completes
  //  null         — nothing to do
  async function obtainPdfUrl({
    allowClick = true,
    projectName = null,
    captureOptions = {},
    sameTabPdfOnly = false,
  } = {}) {
    // 1) DOM scan (aggressive on detail page).
    let url = findPdfUrlAggressive(document.body)
    if (url) return { url }

    // 2) Already captured by webRequest on a previous load.
    url = await findPdfUrlFromNetwork({ sameTabOnly: sameTabPdfOnly })
    if (url) return { url }

    if (!allowClick) return null

    // 3) Lazy reveal: Mantine Tree node that navigates the tab on click.
    //    Arm the background capture FIRST so it can grab the URL even after
    //    the navigation kills this content script.
    const node = findPdfTreeNode(document.body)
    if (!node) return null

    await armPdfCapture(projectName, 30, captureOptions)
    const clickable = findClickable(node)
    try {
      clickLikeUser(clickable)
    } catch {
      try {
        clickable.click()
      } catch {
        return null
      }
    }
    return { deferred: true }
  }

  // Conservative — only matches things that ARE PDFs. Used on listing cards
  // to avoid false positives that would kick off a doomed analyze flow.
  function findPdfUrl(root) {
    // 1) Direct PDF anchor (must end in .pdf).
    let el = root.querySelector(
      'a[href$=".pdf"], a[href*=".pdf?"], a[href*=".pdf#"]',
    )
    if (el?.href) return el.href

    // 2) PDF viewers (iframe/embed/object).
    el =
      root.querySelector('iframe[src$=".pdf"], iframe[src*=".pdf?"], iframe[src*=".pdf#"]') ||
      root.querySelector('embed[src*=".pdf"], embed[type*="pdf" i]') ||
      root.querySelector('object[data*=".pdf"], object[type*="pdf" i]')
    if (el) {
      const v = el.src || el.data
      if (v) return new URL(v, window.location.origin).href
    }

    // 3) Data attributes ending in .pdf.
    const anyAnchor = root.querySelector(
      'a[data-href*=".pdf" i], a[data-url*=".pdf" i], a[data-file*=".pdf" i]',
    )
    if (anyAnchor) {
      const v =
        anyAnchor.getAttribute('data-href') ||
        anyAnchor.getAttribute('data-url') ||
        anyAnchor.getAttribute('data-file')
      if (v) return new URL(v, window.location.origin).href
    }
    return null
  }

  // Aggressive — adds an HTML scan for presigned S3 URLs / encoded URLs.
  // Used only on the detail page where false positives are acceptable
  // (we already know the user wants to analyze THIS project's PDF).
  function findPdfUrlAggressive(root) {
    const cheap = findPdfUrl(root)
    if (cheap) return cheap

    // Any anchor with .pdf in href.
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || ''
      if (/\.pdf(?:[?#]|$)/i.test(href)) {
        return new URL(href, window.location.origin).href
      }
    }
    return scanHtmlForPdfUrl(root.outerHTML || root.innerHTML || '')
  }

  function scanHtmlForPdfUrl(html) {
    if (!html) return null
    const decoded = html
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
    const patterns = [
      // Direct PDF link
      /https?:\/\/[^\s"'<>\\]+\.pdf(?:\?[^\s"'<>\\]*)?/i,
      // Presigned S3 (any cloud) ending in pdf within filename param
      /https?:\/\/[^\s"'<>\\]+filename%3D[^\s"'<>\\]*\.pdf[^\s"'<>\\]*/i,
      // Generic presigned with .pdf somewhere in the path
      /https?:\/\/[^\s"'<>\\]+\/[^\s"'<>\\]*\.pdf[^\s"'<>\\]*/i,
    ]
    for (const re of patterns) {
      const m = decoded.match(re)
      if (m) return m[0]
    }
    return null
  }

  // Returns a URL to the project detail page if the card contains one.
  // Used as fallback when no direct PDF is on the listing card — we navigate
  // there with ?epipilot=auto to continue the analysis from the detail page.
  function findProjectUrl(card) {
    // Prefer a link that clearly looks like a project route.
    const candidates = card.querySelectorAll('a[href]')
    let best = null
    for (const a of candidates) {
      const href = a.href || ''
      if (/\/project[s]?\/[^?#]+/.test(href)) return href
      if (/\/project[s]?\b/.test(href) && !best) best = href
      if (/\/module\/.*\/project/i.test(href)) return href
    }
    // If the card itself is an <a>, use it.
    if (card.tagName === 'A' && card.href && /project/i.test(card.href)) {
      return card.href
    }
    return best
  }

  // Is the current page a project detail page (vs the listing)?
  function isDetailPage() {
    const p = window.location.pathname
    // Heuristic: a path with /project/<something> beyond the listing root.
    if (/\/projects?\/[^/?#]+/.test(p)) return true
    if (/\/module\/.*\/project/i.test(p)) return true
    return false
  }

  function isListingPage() {
    const p = window.location.pathname
    return /\/projects?\/?$/.test(p) || /\/projects\?/.test(window.location.href)
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

  function openDashboardDirect(hash = '#conversation') {
    const url = `${chrome.runtime.getURL('dashboard.html')}${hash}`
    const opened = window.open(url, '_blank')
    if (!opened) {
      window.location.href = url
    }
  }

  // ─────────────────────────────────────────────────── overlay state ──
  let currentOverlay = null
  let currentStep = 0
  let pendingProject = null

  const STEP_LABELS = [
    'Récupération du PDF du sujet',
    'Envoi à OpenAI',
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
          <div class="epipilot-overlay-logo"><img src="${LOGO_ICON_URL}" alt="Epilot" /></div>
          <div>
            <h3>Analyse en cours</h3>
            <p class="sub">EpiPilot · OpenAI</p>
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
  // Listing UX: open the dashboard immediately, then let a hidden helper tab
  // visit the project page, click the generated PDF tree item, and let the
  // background webRequest listener capture the one-time PDF URL.
  async function handleAnalyzeClick(card) {
    const name = extractProjectName(card)
    const projectUrl = findProjectUrl(card)

    if (projectUrl) {
      showToast('Ouverture du dashboard…')
      openDashboardDirect()
      try {
        const res = await chrome.runtime.sendMessage({
          type: 'epipilot:start-from-project-page',
          projectUrl,
          projectName: name,
          openDashboard: false,
        })
        if (res?.ok) return
      } catch {
        /* SW not responding — fall back to manual upload */
      }
    }

    try {
      await chrome.storage.local.set({
        epipilot_pending_upload: {
          projectName: name,
          timestamp: Date.now(),
        },
      })
    } catch {
      /* storage unavailable — best effort */
    }
    showToast('Ouverture du dashboard…')
    openDashboardDirect()
    try {
      await chrome.runtime.sendMessage({
        type: 'epipilot:open-upload',
        projectName: name,
        openDashboard: false,
      })
    } catch {
      /* SW not responding — fall through */
    }
  }

  // ───────────────────────────────────── messages from background SW ──
  const STAGE_TO_STEP = [
    { match: /Préparation/i, step: 1 },
    { match: /Envoi du PDF|Envoi à OpenAI/i, step: 1 },
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
    if (code === 'RATE_LIMITED') return 'Limite OpenAI atteinte. Réessaie dans une minute.'
    if (code === 'NO_OUTPUT') return "OpenAI n'a pas retourné de réponse exploitable."
    if (code === 'PARSE_FAILED') return 'Impossible de parser la réponse JSON.'
    if (code.startsWith('FETCH_FAILED')) return `Téléchargement du PDF impossible (${code.replace('FETCH_FAILED:', '').trim()}).`
    if (code.startsWith('BAD_REQUEST')) return `Requête refusée : ${code.replace('BAD_REQUEST:', '').trim()}`
    return code
  }

  // ────────────────────────────────────── detail page support ──────────
  let detailBtnInjected = false
  let autoTriggered = false
  let fabEl = null

  function ensureFab() {
    if (fabEl && document.body.contains(fabEl)) return fabEl
    fabEl = document.createElement('button')
    fabEl.type = 'button'
    fabEl.className = 'epipilot-fab'
    fabEl.innerHTML = `${ICONS.sparkles}<span>Analyser avec EpiPilot</span><span class="status">recherche du PDF…</span>`
    fabEl.addEventListener('click', async () => {
      const name = extractProjectNameFromDetail()
      updateFabStatus('Récupération du PDF…')
      showToast('Ouverture du dashboard…')
      try {
        await chrome.runtime.sendMessage({
          type: 'epipilot:prepare-dashboard',
          projectName: name,
        })
      } catch {
        updateFabStatus('Erreur dashboard')
        return
      }

      const result = await obtainPdfUrl({
        allowClick: true,
        projectName: name,
        captureOptions: { openDashboard: false },
        sameTabPdfOnly: true,
      })
      if (result?.url) {
        triggerDetailAnalysis(result.url, name, { openDashboard: false })
      } else if (result?.deferred) {
        updateFabStatus('PDF capturé…')
      } else {
        updateFabStatus('PDF introuvable')
        chrome.runtime.sendMessage({
          type: 'epipilot:session-error',
          code: 'PDF_NOT_FOUND',
          projectName: name,
        }).catch(() => {})
      }
    })
    document.body.appendChild(fabEl)
    return fabEl
  }

  function updateFabStatus(text) {
    if (!fabEl) return
    const status = fabEl.querySelector('.status')
    if (!status) return
    if (typeof text === 'boolean') {
      status.textContent = text ? 'PDF détecté' : 'recherche du PDF…'
    } else {
      status.textContent = text
    }
  }

  function removeFab() {
    if (fabEl && fabEl.parentElement) fabEl.parentElement.removeChild(fabEl)
    fabEl = null
  }

  function extractProjectNameFromDetail() {
    const fromUrl = new URLSearchParams(window.location.search).get(
      'epipilot_name',
    )
    if (fromUrl) return fromUrl
    const title =
      document.querySelector('h1, h2, [class*="title" i]')?.textContent
    return title?.trim().slice(0, 100) || 'Projet Epitech'
  }

  function ensureDetailButton(pdfUrl) {
    if (detailBtnInjected) return
    // Find a sensible anchor : the PDF link itself, or the page header.
    const pdfLink =
      document.querySelector(
        'a[href$=".pdf"], a[href*=".pdf?"], a[href*=".pdf#"]',
      ) || document.querySelector('iframe[src*=".pdf"]')
    const anchor =
      pdfLink?.parentElement ||
      document.querySelector('h1, h2, [class*="title" i]') ||
      document.body
    if (!anchor) return

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'epipilot-detail-btn'
    btn.innerHTML = `${ICONS.sparkles}<span>Analyser ce projet avec EpiPilot</span>`
    btn.title = 'Analyser ce projet avec EpiPilot'
    btn.addEventListener('click', () => triggerDetailAnalysis(pdfUrl))
    // Insert right after the anchor element.
    anchor.parentElement?.insertBefore(btn, anchor.nextSibling)
    detailBtnInjected = true
    showToast('Projet détecté — clique sur Analyser ou attends l\'auto-lancement')
  }

  async function triggerDetailAnalysis(pdfUrl, providedName, options = {}) {
    const name = providedName || extractProjectNameFromDetail()
    showToast(options.openDashboard === false ? 'Analyse lancée dans le dashboard…' : 'Ouverture du dashboard…')
    try {
      await chrome.runtime.sendMessage({
        type:
          options.openDashboard === false
            ? 'epipilot:start-session-existing-dashboard'
            : 'epipilot:start-session',
        pdfUrl,
        projectName: name,
        closeSourceTab: Boolean(options.closeSourceTab),
      })
    } catch {
      if (options.openDashboard === false) {
        chrome.runtime.sendMessage({
          type: 'epipilot:session-error',
          code: 'BACKGROUND_UNAVAILABLE',
        }).catch(() => {})
      } else {
        openOverlay(name)
        showOverlayError(
          "Le service worker ne répond pas. Recharge l'extension.",
        )
      }
    }
  }

  async function refreshDetailPage() {
    ensureFab()

    // Quick non-clicking detection for the FAB status.
    const quick = await obtainPdfUrl({ allowClick: false, sameTabPdfOnly: true })
    const quickUrl = quick?.url || null
    updateFabStatus(Boolean(quickUrl))
    if (quickUrl) {
      ensureDetailButton(quickUrl)
    }

    if (autoTriggered) return Boolean(quickUrl)

    // URL-param trigger (legacy).
    const params = new URLSearchParams(window.location.search)
    const autoParam = params.get('epipilot')
    if (autoParam === 'auto') {
      autoTriggered = true
      const useExistingDashboard = params.get('epipilot_dashboard') === 'existing'
      const closeSourceTab = params.get('epipilot_close') === '1'
      const u = new URL(window.location.href)
      u.searchParams.delete('epipilot')
      u.searchParams.delete('epipilot_name')
      u.searchParams.delete('epipilot_dashboard')
      u.searchParams.delete('epipilot_close')
      window.history.replaceState({}, '', u.href)
      const name = extractProjectNameFromDetail()
      const analysisOptions = {
        openDashboard: !useExistingDashboard,
        closeSourceTab,
      }
      ;(async () => {
        if (quickUrl) {
          triggerDetailAnalysis(quickUrl, name, analysisOptions)
        } else {
          const r = await obtainPdfUrl({
            allowClick: true,
            projectName: name,
            captureOptions: analysisOptions,
            sameTabPdfOnly: true,
          })
          if (r?.url) triggerDetailAnalysis(r.url, name, analysisOptions)
          else if (r?.deferred) updateFabStatus('Récupération du PDF…')
          else {
            updateFabStatus('PDF introuvable')
            if (useExistingDashboard) {
              chrome.runtime.sendMessage({
                type: 'epipilot:session-error',
                code: 'PDF_NOT_FOUND',
              }).catch(() => {})
            }
          }
        }
      })()
      return true
    }

    // chrome.storage trigger from the listing page.
    try {
      chrome.storage.local.get(['epipilot_pending'], async (res) => {
        const p = res?.epipilot_pending
        if (!p || autoTriggered) return
        const isFresh = Date.now() - (p.timestamp || 0) < 5 * 60_000
        if (!isFresh) {
          chrome.storage.local.remove(['epipilot_pending'])
          return
        }
        autoTriggered = true
        chrome.storage.local.remove(['epipilot_pending'])
        updateFabStatus('Récupération du PDF…')
        showToast('Récupération du PDF…')
        const analysisOptions = {
          openDashboard: p.openDashboard !== false,
          closeSourceTab: Boolean(p.closeSourceTab),
        }
        if (quickUrl) {
          triggerDetailAnalysis(quickUrl, p.projectName, analysisOptions)
          return
        }
        const r = await obtainPdfUrl({
          allowClick: true,
          projectName: p.projectName,
          captureOptions: analysisOptions,
          sameTabPdfOnly: true,
        })
        if (r?.url) {
          triggerDetailAnalysis(r.url, p.projectName, analysisOptions)
        } else if (r?.deferred) {
          showToast('Le dashboard s\'ouvrira dès que le PDF est récupéré.')
        } else {
          updateFabStatus('PDF introuvable')
          if (p.openDashboard === false) {
            chrome.runtime.sendMessage({
              type: 'epipilot:session-error',
              code: 'PDF_NOT_FOUND',
            }).catch(() => {})
          }
          showToast(
            'Impossible de récupérer le PDF — clique sur le treeitem manuellement.',
          )
        }
      })
    } catch {
      /* ignore */
    }

    return Boolean(quickUrl)
  }

  // ──────────────────────────────────────── DOM ready + SPA observer ──
  function init() {
    if (isDetailPage()) {
      refreshDetailPage()
    } else {
      refreshButtons()
    }

    const observer = new MutationObserver(
      debounce(() => {
        if (isDetailPage()) {
          refreshDetailPage()
        } else {
          // Reset detail-page state if we navigated back to listing.
          detailBtnInjected = false
          autoTriggered = false
          removeFab()
          refreshButtons()
        }
      }, 250),
    )
    observer.observe(document.body, { childList: true, subtree: true })

    // Also watch SPA history navigation.
    let lastPath = window.location.pathname + window.location.search
    setInterval(() => {
      const now = window.location.pathname + window.location.search
      if (now !== lastPath) {
        lastPath = now
        detailBtnInjected = false
        autoTriggered = false
        if (isDetailPage()) {
          refreshDetailPage()
        } else {
          removeFab()
          refreshButtons()
        }
      }
    }, 500)
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
