import { Router } from 'express'
import { exportProjectToTrello, TrelloError } from '../lib/trello.js'

const router = Router()

router.get('/config', (_req, res) => {
  const key = process.env.TRELLO_API_KEY
  if (!key) {
    return res.status(503).json({
      error:
        "TRELLO_API_KEY n'est pas configurée. Voir server/README.md pour la marche à suivre.",
    })
  }
  res.json({ apiKey: key, scope: 'read,write', appName: 'Epilot' })
})

router.post('/export', async (req, res, next) => {
  try {
    const key = process.env.TRELLO_API_KEY
    if (!key) {
      return res.status(503).json({ error: 'TRELLO_API_KEY non configurée.' })
    }
    const { token, project } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Champ "token" manquant.' })
    }
    if (!project || typeof project !== 'object') {
      return res.status(400).json({ error: 'Champ "project" manquant.' })
    }
    const result = await exportProjectToTrello(project, { key, token })
    res.json(result)
  } catch (err) {
    if (err instanceof TrelloError) {
      return res.status(err.status || 502).json({
        error: err.message,
        upstream: err.body,
      })
    }
    next(err)
  }
})

export default router
