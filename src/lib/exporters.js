/* Exporters towards external project management tools.
   Each exporter returns { filename, mime, content } so the UI can trigger a
   single download helper. */

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCSV(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
}

function slug(name) {
  return (name || 'project')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'project'
}

function sprintOfTask(project, taskTitle) {
  const sprint = (project.planning || []).find((s) =>
    (s.taskTitles || []).includes(taskTitle),
  )
  return sprint ? sprint.label : ''
}

function storyPoints(hours) {
  if (!hours) return 1
  if (hours <= 2) return 1
  if (hours <= 4) return 2
  if (hours <= 8) return 3
  if (hours <= 16) return 5
  if (hours <= 24) return 8
  return 13
}

const JIRA_PRIORITY = { critical: 'Highest', high: 'High', medium: 'Medium', low: 'Low' }

/* ── Jira CSV ── */
export function exportJiraCSV(project) {
  const header = [
    'Summary',
    'Issue Type',
    'Description',
    'Priority',
    'Story Points',
    'Sprint',
    'Labels',
    'Component',
    'Original Estimate',
  ]
  const rows = [header]
  for (const t of project.tasks || []) {
    rows.push([
      t.title,
      'Task',
      t.description,
      JIRA_PRIORITY[t.priority] || 'Medium',
      storyPoints(t.hours),
      sprintOfTask(project, t.title),
      t.category,
      t.category,
      `${t.hours || 0}h`,
    ])
  }
  return {
    filename: `${slug(project.name)}-jira.csv`,
    mime: 'text/csv;charset=utf-8',
    content: toCSV(rows),
  }
}

/* ── Trello JSON ── */
export function exportTrelloJSON(project) {
  const colorByCategory = {
    setup: 'sky',
    frontend: 'purple',
    backend: 'blue',
    database: 'lime',
    security: 'red',
    tests: 'orange',
    qa: 'orange',
    documentation: 'pink',
    devops: 'black',
    mobile: 'green',
    design: 'yellow',
    soutenance: 'red',
  }
  const colorByPriority = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green',
  }
  const labelDefs = new Map()
  function addLabel(name, color) {
    const key = `${name}|${color}`
    if (!labelDefs.has(key)) {
      labelDefs.set(key, { id: `label-${labelDefs.size + 1}`, name, color })
    }
    return labelDefs.get(key).id
  }

  const cards = (project.tasks || []).map((t, i) => {
    const labels = [
      addLabel(t.category, colorByCategory[t.category] || 'sky'),
      addLabel(t.priority, colorByPriority[t.priority] || 'sky'),
    ]
    const sprint = sprintOfTask(project, t.title)
    const desc = [
      t.description,
      '',
      `**Catégorie** : ${t.category}`,
      `**Priorité** : ${t.priority}`,
      `**Difficulté** : ${t.difficulty}/10`,
      `**Estimation** : ${t.hours}h`,
      sprint ? `**Sprint** : ${sprint}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    return {
      id: `card-${i + 1}`,
      name: t.title,
      desc,
      idList: 'list-todo',
      idLabels: labels,
      pos: (i + 1) * 1000,
      closed: false,
    }
  })

  const board = {
    name: project.name,
    desc: project.summary?.goal || '',
    closed: false,
    prefs: { permissionLevel: 'private' },
    labels: Array.from(labelDefs.values()),
    lists: [
      { id: 'list-todo', name: 'À faire', closed: false, pos: 1000 },
      { id: 'list-doing', name: 'En cours', closed: false, pos: 2000 },
      { id: 'list-done', name: 'Done', closed: false, pos: 3000 },
    ],
    cards,
  }

  return {
    filename: `${slug(project.name)}-trello.json`,
    mime: 'application/json;charset=utf-8',
    content: JSON.stringify(board, null, 2),
  }
}

/* ── GitHub Issues CSV ── */
export function exportGitHubCSV(project) {
  const header = ['title', 'body', 'labels', 'milestone', 'assignees']
  const rows = [header]
  for (const t of project.tasks || []) {
    const body = [
      t.description,
      '',
      `**Catégorie** : ${t.category}`,
      `**Priorité** : ${t.priority}`,
      `**Difficulté** : ${t.difficulty}/10`,
      `**Estimation** : ${t.hours}h`,
    ].join('\n')
    rows.push([
      t.title,
      body,
      [t.category, `priority:${t.priority}`].join(';'),
      sprintOfTask(project, t.title),
      '',
    ])
  }
  return {
    filename: `${slug(project.name)}-github-issues.csv`,
    mime: 'text/csv;charset=utf-8',
    content: toCSV(rows),
  }
}

/* ── Notion CSV ── */
export function exportNotionCSV(project) {
  const header = [
    'Name',
    'Status',
    'Category',
    'Priority',
    'Difficulty',
    'Hours',
    'Sprint',
    'Description',
  ]
  const rows = [header]
  for (const t of project.tasks || []) {
    rows.push([
      t.title,
      'To do',
      t.category,
      t.priority,
      t.difficulty,
      t.hours,
      sprintOfTask(project, t.title),
      t.description,
    ])
  }
  return {
    filename: `${slug(project.name)}-notion.csv`,
    mime: 'text/csv;charset=utf-8',
    content: toCSV(rows),
  }
}

/* ── Google Calendar ICS ── */
function icsDate(date) {
  const d = new Date(date)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

function icsDateTime(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

const FR_MONTHS = {
  janv: 0, jan: 0, janvier: 0,
  fevr: 1, fev: 1, février: 1, fevrier: 1,
  mars: 2,
  avr: 3, avril: 3,
  mai: 4,
  juin: 5,
  juil: 6, juillet: 6,
  aout: 7, août: 7,
  sept: 8, septembre: 8,
  oct: 9, octobre: 9,
  nov: 10, novembre: 10,
  dec: 11, déc: 11, décembre: 11, decembre: 11,
}

function parseFrenchDate(text, fallbackYear) {
  if (!text) return null
  const cleaned = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const m = cleaned.match(/(\d{1,2})\s*([a-z]+)(?:\s*(\d{4}))?/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const monthKey = m[2].slice(0, 4)
  const month = FR_MONTHS[m[2]] ?? FR_MONTHS[monthKey] ?? FR_MONTHS[m[2].slice(0, 3)]
  if (month === undefined) return null
  const year = m[3] ? parseInt(m[3], 10) : fallbackYear
  return new Date(Date.UTC(year, month, day))
}

function parseSprintRange(range, fallbackYear) {
  if (!range) return null
  const [left, right] = range.split(/→|->|—|–|-/).map((s) => s.trim())
  const start = parseFrenchDate(left, fallbackYear)
  const end = parseFrenchDate(right || left, fallbackYear)
  if (!start || !end) return null
  return { start, end }
}

export function exportCalendarICS(project) {
  const deadline = new Date(project.deadline)
  const year = deadline.getUTCFullYear()
  const stamp = icsDateTime(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Epilot//Project Plan//FR',
    'CALSCALE:GREGORIAN',
  ]

  ;(project.planning || []).forEach((sprint, i) => {
    const range = parseSprintRange(sprint.range, year)
    if (!range) return
    const dtEnd = new Date(range.end)
    dtEnd.setUTCDate(dtEnd.getUTCDate() + 1)
    const desc = [
      sprint.theme,
      '',
      'Jalons :',
      ...(sprint.milestones || []).map((m) => `- ${m}`),
    ].join('\\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:sprint-${i + 1}-${slug(project.name)}@epilot`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(range.start)}`,
      `DTEND;VALUE=DATE:${icsDate(dtEnd)}`,
      `SUMMARY:${sprint.label} — ${sprint.theme}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
    )
  })

  lines.push(
    'BEGIN:VEVENT',
    `UID:deadline-${slug(project.name)}@epilot`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(deadline)}`,
    `DTEND;VALUE=DATE:${icsDate(new Date(deadline.getTime() + 86400000))}`,
    `SUMMARY:🚩 Deadline ${project.name}`,
    `DESCRIPTION:${(project.summary?.goal || '').replace(/\n/g, '\\n')}`,
    'END:VEVENT',
  )

  lines.push('END:VCALENDAR')
  return {
    filename: `${slug(project.name)}-calendar.ics`,
    mime: 'text/calendar;charset=utf-8',
    content: lines.join('\r\n'),
  }
}

export const TOOL_EXPORTERS = {
  jira: exportJiraCSV,
  trello: exportTrelloJSON,
  github: exportGitHubCSV,
  notion: exportNotionCSV,
  calendar: exportCalendarICS,
}

export const TOOL_IMPORT_HINTS = {
  jira: {
    fileLabel: 'CSV Jira',
    importUrl: 'https://support.atlassian.com/jira-cloud-administration/docs/import-data-from-a-csv-file/',
    steps: 'Jira → Système → Importation externe → CSV',
  },
  trello: {
    fileLabel: 'JSON Trello',
    importUrl: 'https://trello.com/import',
    steps: 'Trello → Créer un tableau → Importer depuis JSON',
  },
  github: {
    fileLabel: 'CSV GitHub',
    importUrl: 'https://github.com/gavinr/github-csv-tools',
    steps: 'github-csv-tools : npx github-csv-tools import fichier.csv',
  },
  notion: {
    fileLabel: 'CSV Notion',
    importUrl: 'https://www.notion.so/help/import-data-into-notion',
    steps: 'Notion → Importer → CSV → glisser le fichier',
  },
  calendar: {
    fileLabel: 'ICS Calendar',
    importUrl: 'https://calendar.google.com/calendar/u/0/r/settings/export',
    steps: 'Google Calendar → Paramètres → Importer & exporter → Importer',
  },
}
