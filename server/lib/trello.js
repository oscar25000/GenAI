const TRELLO_BASE = 'https://api.trello.com/1'

class TrelloError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function trelloRequest(method, path, params, { key, token }) {
  const url = new URL(`${TRELLO_BASE}${path}`)
  url.searchParams.set('key', key)
  url.searchParams.set('token', token)
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, String(v))
  }
  const res = await fetch(url, { method })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    throw new TrelloError(
      `Trello ${method} ${path} → ${res.status} ${text.slice(0, 200)}`,
      res.status,
      data,
    )
  }
  return data
}

const COLOR_BY_CATEGORY = {
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

const COLOR_BY_PRIORITY = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'green',
}

function sprintOfTask(project, taskTitle) {
  const sprint = (project.planning || []).find((s) =>
    (s.taskTitles || []).includes(taskTitle),
  )
  return sprint ? sprint.label : null
}

function buildCardDescription(project, task) {
  const sprint = sprintOfTask(project, task.title)
  return [
    task.description,
    '',
    `**Catégorie** : ${task.category}`,
    `**Priorité** : ${task.priority}`,
    `**Difficulté** : ${task.difficulty}/10`,
    `**Estimation** : ${task.hours}h`,
    sprint ? `**Sprint** : ${sprint}` : null,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
}

export async function exportProjectToTrello(project, { key, token }) {
  const auth = { key, token }

  const board = await trelloRequest(
    'POST',
    '/boards',
    {
      name: project.name || 'Projet Epilot',
      desc: project.summary?.goal || '',
      defaultLists: 'false',
      defaultLabels: 'false',
      prefs_permissionLevel: 'private',
    },
    auth,
  )

  const lists = {}
  for (const [pos, name] of [
    [1, 'À faire'],
    [2, 'En cours'],
    [3, 'Done'],
  ]) {
    const list = await trelloRequest(
      'POST',
      '/lists',
      { name, idBoard: board.id, pos: pos * 1000 },
      auth,
    )
    lists[name] = list.id
  }

  const labelCache = new Map()
  async function ensureLabel(name, color) {
    const cacheKey = `${name}|${color}`
    if (labelCache.has(cacheKey)) return labelCache.get(cacheKey)
    const label = await trelloRequest(
      'POST',
      '/labels',
      { name, color, idBoard: board.id },
      auth,
    )
    labelCache.set(cacheKey, label.id)
    return label.id
  }

  const todoListId = lists['À faire']
  let createdCards = 0
  const tasks = project.tasks || []
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const labelIds = []
    if (task.category) {
      labelIds.push(
        await ensureLabel(task.category, COLOR_BY_CATEGORY[task.category] || 'sky'),
      )
    }
    if (task.priority) {
      labelIds.push(
        await ensureLabel(task.priority, COLOR_BY_PRIORITY[task.priority] || 'sky'),
      )
    }
    await trelloRequest(
      'POST',
      '/cards',
      {
        name: task.title,
        desc: buildCardDescription(project, task),
        idList: todoListId,
        idLabels: labelIds.join(','),
        pos: (i + 1) * 1000,
      },
      auth,
    )
    createdCards++
  }

  return {
    boardId: board.id,
    boardUrl: board.url || board.shortUrl,
    listsCreated: Object.keys(lists).length,
    labelsCreated: labelCache.size,
    cardsCreated: createdCards,
  }
}

export { TrelloError }
