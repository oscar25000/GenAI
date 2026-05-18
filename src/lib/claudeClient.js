// Real Claude API integration for EpiPilot.
//
// What it does:
//  - Takes a base64-encoded PDF + team config + API key
//  - Calls claude-opus-4-7 with the PDF as a document content block
//  - Constrains output via output_config.format (json_schema) using projectSchema.js
//  - Post-processes the model output to match the project shape consumed by the UI
//
// Runs in the extension's background service worker. The popup/dashboard
// trigger it via chrome.runtime.sendMessage.

import Anthropic from '@anthropic-ai/sdk'
import { projectSchema } from './projectSchema.js'

const SYSTEM_PROMPT = `Tu es EpiPilot, un copilote IA spécialisé dans l'analyse des sujets de projets Epitech (l'école d'ingénieurs).

Ton rôle est de lire un PDF de sujet (souvent rédigé en anglais ou en français, mêlant contexte, contraintes techniques, livrables et barème) et de le transformer en plan de projet exécutable pour une équipe d'étudiants.

Tu dois produire un JSON strictement conforme au schéma fourni. Toutes les explications doivent être en français, claires et orientées action. Pas de remplissage marketing.

Principes d'analyse :

1. Identifie le vrai but du projet en quelques phrases. Évite le jargon.
2. Liste ce qu'il y a réellement à construire (services, clients, composants, outils).
3. Sépare les contraintes explicites du sujet (technologies imposées, formats de rendu, /about.json conforme, docker-compose à la racine, APK signé, etc.) des livrables attendus (code, README, doc technique, slides, démo).
4. Détecte les "À ne pas oublier" : README, docker, CI/CD, OAuth2 réel, route /about.json, tests, schéma d'architecture, .env.example, gestion d'erreurs, présentation, plan B démo. Mets les pièges classiques en severity "critical" ou "high".
5. Génère 15 à 25 tâches concrètes couvrant setup, frontend, backend, base de données, auth, API, sécurité, tests, documentation, devops, soutenance. Chaque tâche doit avoir une catégorie, une priorité, une difficulté 1-10, une estimation d'heures réaliste, et un assigneeId pris dans la liste des membres fournie.
6. Affecte les tâches selon les compétences de chaque membre : si Kilian fait backend/API/DB, donne-lui les tâches backend ; si Oscar fait cybersécurité/QA/DevOps, donne-lui sécurité/tests/CI ; etc. Équilibre la charge totale.
7. Génère un planning découpé en 4 à 6 sprints sur la durée du projet. Chaque sprint a un thème, des jalons concrets, et liste les titres des tâches qui s'y déroulent (utilise exactement les title des tasks).
8. Analyse 5-7 risques classiques (projet trop ambitieux, dépendance trop forte à une personne, OAuth complexe, tests reportés, soutenance pas répétée…) avec une mitigation actionnable.
9. Termine par une checklist finale de 10-15 items à cocher avant le rendu (docker-compose, README, .env.example, tests, démo, slides, plan B…).

Le ton est direct, professionnel, orienté étudiants Epitech. Pas d'émojis. Pas de "n'hésitez pas à…". Va droit au but.`

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

function hydrateProject(modelOutput, opts) {
  const { team, sourcePdf, now } = opts

  const tasks = modelOutput.tasks.map((t) => ({
    ...t,
    id: generateId('t'),
    status: 'todo',
    assignee: team.some((m) => m.id === t.assigneeId)
      ? t.assigneeId
      : team[0]?.id,
  }))

  const taskByTitle = new Map(tasks.map((t) => [t.title, t.id]))
  const planning = modelOutput.planning.map((s) => ({
    ...s,
    id: generateId('s'),
    taskIds: (s.taskTitles || [])
      .map((title) => taskByTitle.get(title))
      .filter(Boolean),
  }))

  return {
    id: generateId('proj'),
    name: modelOutput.name,
    sourcePdf,
    importedAt: now,
    deadline: modelOutput.deadline,
    durationDays: modelOutput.durationDays,
    difficulty: modelOutput.difficulty,
    riskScore: modelOutput.riskScore,
    estimatedHours: modelOutput.estimatedHours,
    progress: 0,
    summary: modelOutput.summary,
    warnings: modelOutput.warnings.map((w) => ({ ...w, id: generateId('w') })),
    team,
    tasks,
    planning,
    risks: modelOutput.risks.map((r) => ({ ...r, id: generateId('r') })),
    checklist: modelOutput.checklist.map((c) => ({
      ...c,
      id: generateId('c'),
      done: false,
    })),
  }
}

export async function analyzePdfWithClaude({
  apiKey,
  model = 'claude-opus-4-7',
  enableThinking = false,
  pdfBase64,
  pdfFilename,
  team,
  onProgress,
}) {
  if (!apiKey) throw new Error('API_KEY_MISSING')
  if (!pdfBase64) throw new Error('PDF_MISSING')
  if (!team?.length) throw new Error('TEAM_EMPTY')

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  onProgress?.('Préparation de la requête…')

  const teamLine = team
    .map((m) => `- id="${m.id}" — ${m.name} — compétences: ${m.skills.join(', ')}`)
    .join('\n')

  const now = new Date().toISOString()

  const userContent = [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: pdfBase64,
      },
    },
    {
      type: 'text',
      text: `Analyse ce sujet Epitech et produis le plan de projet structuré.

Date du jour : ${now.split('T')[0]}.

Équipe disponible (utilise les id pour assigneeId) :
${teamLine}

Réponds uniquement avec le JSON conforme au schéma. Pas de texte autour.`,
    },
  ]

  const request = {
    model,
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
    output_config: {
      format: { type: 'json_schema', schema: projectSchema },
    },
  }

  if (enableThinking) {
    request.thinking = { type: 'adaptive' }
  }

  onProgress?.('Envoi du PDF à Claude…')

  let response
  try {
    response = await client.messages.parse(request)
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('API_KEY_INVALID')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('RATE_LIMITED')
    }
    if (err instanceof Anthropic.BadRequestError) {
      throw new Error(`BAD_REQUEST: ${err.message}`)
    }
    throw err
  }

  onProgress?.('Structuration du plan de projet…')

  const parsed = response.parsed_output
  if (!parsed) {
    // Fallback: try to find a text block and JSON.parse it.
    const textBlock = response.content?.find((b) => b.type === 'text')
    if (!textBlock) throw new Error('NO_OUTPUT')
    try {
      const jsonStart = textBlock.text.indexOf('{')
      const jsonEnd = textBlock.text.lastIndexOf('}')
      const slice = textBlock.text.slice(jsonStart, jsonEnd + 1)
      const fallback = JSON.parse(slice)
      return hydrateProject(fallback, { team, sourcePdf: pdfFilename, now })
    } catch {
      throw new Error('PARSE_FAILED')
    }
  }

  const project = hydrateProject(parsed, {
    team,
    sourcePdf: pdfFilename,
    now,
  })

  onProgress?.('Analyse terminée.')

  return {
    project,
    usage: response.usage,
  }
}
