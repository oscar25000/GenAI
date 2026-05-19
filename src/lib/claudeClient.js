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
import { projectTools, applyToolUse } from './projectTools.js'

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

// ───────────────────────────────────────────────────────────────────────────
// Guided conversation — multi-turn chat with tools.
//
// The agent reads the PDF, then asks the user questions step by step.
// Each tool call mutates the shared project state. The background SW owns
// that state, persists it, and broadcasts updates to the dashboard.

const CHAT_SYSTEM_PROMPT = `Tu es EpiPilot, copilote IA pour les étudiants Epitech. Ton rôle est d'accompagner une équipe d'étudiants pour transformer un sujet de projet (PDF) en plan de projet complet et exécutable.

Tu mènes une conversation **structurée** en phases. Tu poses **une seule question à la fois**. Tes messages sont **courts** (2 à 4 phrases max), directs, en français, pro mais chaleureux. Pas d'émojis. Tutoie l'utilisateur.

# Phases de la conversation

**Phase 1 — Compréhension du sujet** (premier message)
- Tu as déjà lu le PDF. Appelle immédiatement \`set_summary\` pour enregistrer ton résumé (nom du projet, objectif, ce qu'il faut construire, contraintes, livrables).
- Présente le résumé en 3-4 lignes à l'utilisateur.
- Demande : « Est-ce que ce résumé correspond à ce que vous avez compris du sujet ? »

**Phase 2 — Équipe**
- Demande : « Qui est dans ton équipe ? Donne-moi les prénoms et les compétences de chacun (frontend, backend, design, devops…). »
- Quand tu as l'info, appelle \`set_team\` avec tous les membres.

**Phase 3 — Ambition et stack technique**
- Demande l'ambition : MVP minimal, version solide, ou très ambitieuse ?
- Demande la stack envisagée (langage backend, framework frontend, base de données, mobile si pertinent).
- Si la stack ne respecte pas une contrainte du sujet, signale-le.

**Phase 4 — Contraintes & disponibilité**
- Combien d'heures par semaine l'équipe peut consacrer ?
- Y a-t-il des contraintes externes (autres rendus, partiels, déplacements) ?

**Phase 5 — Génération du plan complet** (sans poser de question)
- Appelle dans l'ordre : \`set_warnings\`, \`set_tasks\` (15-25 tâches avec assignation selon les compétences), \`set_planning\` (4-6 sprints), \`set_risks\` (5-7), \`set_checklist\` (10-15), \`update_meta\` (difficulty, riskScore, deadline, durationDays, estimatedHours).
- Annonce que le plan est prêt et invite à ouvrir le dashboard complet.

**Phase 6 — Itération (optionnelle)**
- Si l'utilisateur veut ajuster (équipe, deadline, ajouter/retirer une tâche), appelle les outils pertinents pour mettre à jour.

# Règles

- Appelle les outils dès que tu collectes une information exploitable. N'attends pas la fin pour tout faire d'un coup (sauf pour la phase 5 où tout est généré en cascade).
- Ne ré-explique pas ce que les outils font à l'utilisateur. Ils sont silencieux côté utilisateur.
- Si l'utilisateur t'envoie quelque chose en dehors des phases (ex: une question technique), réponds brièvement puis recadre.
- Évite les listes à puces dans tes messages de chat — sauf pour le résumé initial. Garde un ton conversationnel.
- Pour set_tasks : chaque tâche doit avoir un assigneeName qui matche exactement un name de l'équipe enregistrée via set_team.
- Pour set_planning : utilise les title exacts des tasks dans taskTitles.`

const MAX_TURNS = 8 // safety cap for the agentic loop

export async function chatTurn({
  apiKey,
  model = 'claude-opus-4-7',
  enableThinking = false,
  history, // array of { role, content } messages
  project, // current partial project state
  pdfBase64, // included only on the very first turn (in the first user message)
  onToolApplied, // (toolName, project) => void
  onProgress, // (stage) => void
}) {
  if (!apiKey) throw new Error('API_KEY_MISSING')

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  // Build messages array. If history has a pending PDF on the first user
  // message, inject it as a document content block.
  let messages = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  if (pdfBase64 && messages.length === 1 && messages[0].role === 'user') {
    const text =
      typeof messages[0].content === 'string'
        ? messages[0].content
        : messages[0].content.find((b) => b.type === 'text')?.text || ''
    messages[0].content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
      },
      { type: 'text', text },
    ]
  }

  let workingProject = project
  let collectedText = ''
  let lastUsage = null

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    onProgress?.(turn === 0 ? 'EpiPilot réfléchit…' : 'Application des changements…')

    const request = {
      model,
      max_tokens: 8000,
      system: [
        {
          type: 'text',
          text: CHAT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: projectTools,
      messages,
    }
    if (enableThinking) request.thinking = { type: 'adaptive' }

    let response
    try {
      response = await client.messages.create(request)
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new Error('API_KEY_INVALID')
      if (err instanceof Anthropic.RateLimitError) throw new Error('RATE_LIMITED')
      if (err instanceof Anthropic.BadRequestError) throw new Error(`BAD_REQUEST: ${err.message}`)
      throw err
    }
    lastUsage = response.usage

    // Collect assistant text from this turn.
    const textBlocks = response.content.filter((b) => b.type === 'text')
    for (const t of textBlocks) {
      collectedText += (collectedText ? '\n\n' : '') + t.text
    }

    // Append assistant turn verbatim (preserve tool_use blocks).
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason !== 'tool_use') {
      // Done — return the assistant text and the updated project.
      return {
        assistantText: collectedText,
        project: workingProject,
        usage: lastUsage,
      }
    }

    // Execute every tool_use block in this assistant turn.
    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    const toolResults = []
    for (const tu of toolUses) {
      try {
        const { project: nextProject, message } = applyToolUse(workingProject, tu)
        workingProject = nextProject
        onToolApplied?.(tu.name, workingProject)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: message,
        })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `Erreur : ${err.message}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: 'user', content: toolResults })
  }

  // Hit safety cap — return whatever we have.
  return {
    assistantText: collectedText || "(boucle d'outils interrompue — relance la conversation)",
    project: workingProject,
    usage: lastUsage,
  }
}
