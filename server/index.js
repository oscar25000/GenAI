import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import trelloRouter from './routes/trello.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (origin.startsWith('chrome-extension://')) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
  }),
)

app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '0.1.0' })
})

app.use('/api/trello', trelloRouter)

app.use((err, _req, res, _next) => {
  console.error('[server]', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal error' })
})

app.listen(PORT, () => {
  console.log(`[epilot-server] listening on http://localhost:${PORT}`)
})
