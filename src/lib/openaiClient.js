// OpenAI integration for Epilot.
//
// What it does:
//  - Takes a base64-encoded PDF + team config + API key
//  - Calls the configured OpenAI model via the Responses API with the PDF as an input_file
//  - For one-shot analysis: constrains output via text.format = json_schema
//  - For chat: uses function tools that mutate shared project state
//
// Runs in the extension's background service worker. The popup/dashboard
// trigger it via chrome.runtime.sendMessage.

import { projectSchema } from './projectSchema.js'
import { projectTools, applyToolUse } from './projectTools.js'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'

const SYSTEM_PROMPT = `Tu es Epilot, un copilote IA spécialisé dans l'analyse des sujets de projets Epitech (l'école d'ingénieurs).

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

const CHAT_SYSTEM_PROMPT = `Tu es Epilot, copilote IA pour les étudiants Epitech. Ton rôle est d'accompagner une équipe d'étudiants pour transformer un sujet de projet (PDF) en plan de projet complet et exécutable.

Tu mènes une conversation **structurée** en phases. Tu poses **une seule question à la fois**. Tes messages sont directs, en français, pro mais chaleureux. Pas d'émojis. Tutoie l'utilisateur. Hors phase 1 (résumé initial) et phase 5 (génération du plan), tes messages restent courts (2 à 4 phrases max).

# Phases de la conversation

**Phase 1 — Compréhension du sujet** (premier message)
- Tu as déjà lu le PDF en entier. Appelle immédiatement \`set_summary\` pour enregistrer ton résumé (nom du projet, objectif, ce qu'il faut construire, contraintes, livrables).
- Présente ensuite le résumé à l'utilisateur de façon **détaillée et concrète**, en t'appuyant sur le PDF, avec cette structure exacte (en markdown, sans préambule du type "voici le résumé") :

  **<Nom du projet>** — <1-2 phrases sur l'objectif réel du projet, pas du marketing>.

  **Ce qu'il faut construire :**
  - <livrable concret 1 — service, client, composant>
  - <livrable concret 2>
  - <…> (4 à 6 puces, tirées du PDF, pas génériques)

  **Contraintes principales :**
  - <contrainte technique imposée par le sujet — techno, format, route, etc.>
  - <…> (3 à 5 puces)

  **Livrables imposés :** <liste courte en ligne, séparée par des virgules : code, README, doc technique, slides, APK signé, etc.>

- Termine par : « Est-ce que ce résumé correspond à ce que tu as compris du sujet ? Je rate quelque chose d'important ? »
- **Interdits** : ne dis pas juste "une plateforme avec des fonctionnalités avancées" ; cite les vrais services/technos/contraintes du PDF. Si le PDF impose une stack, des routes, un format de rendu, des intégrations tierces, des KPIs, des contraintes de scalabilité, mentionne-les nommément.

**Phase 2 — Équipe**
- Demande : « Qui est dans ton équipe ? Donne-moi les prénoms et, pour chacun, ses points forts (frontend, backend, design, devops, sécurité, mobile…). Si tu ne sais pas, je peux te proposer une répartition par défaut. »
- Si l'utilisateur dit qu'il ne sait pas ou hésite, propose toi-même une répartition raisonnable basée sur la taille typique d'équipe Epitech (3-5 personnes) et le type de projet.
- Quand tu as l'info, appelle \`set_team\` avec tous les membres.

**Phase 3 — Ambition et stack technique**
- D'abord l'ambition : propose **3 niveaux concrets** (pas en abstrait) :
  - **MVP minimal** — décris en 1 phrase ce que ça couvre pour CE projet précis (ex : "uniquement l'API + un client web basique, pas de mobile, pas de CI").
  - **Version solide** — ce que ça ajoute concrètement (ex : "+ mobile, + CI/CD, + tests").
  - **Ambitieux** — ce que ça pousse encore (ex : "+ features avancées du sujet, + observabilité, + démo polish").
  Puis demande : « Vous visez plutôt lequel des trois ? »
- Ensuite la stack : **propose 2 ou 3 stacks concrètes** adaptées au sujet et aux contraintes du PDF, chacune en une ligne, avec les langages/frameworks/DB nommés. Exemple : « Pour ce projet je vois trois options : (A) Node.js + React + Postgres + Docker — classique et rapide à mettre en place ; (B) Go + Next.js + Postgres — plus perf, plus exigeant à apprendre ; (C) Python/FastAPI + Vue + Postgres — bon compromis si quelqu'un dans l'équipe connaît déjà Python. Tu pars sur laquelle, ou tu mixes ? »
- Adapte les stacks aux contraintes que tu as détectées dans le PDF (techno imposée, mobile obligatoire, OAuth, etc.) — ne propose pas une stack qui viole une contrainte.
- Si la réponse de l'utilisateur ne respecte pas une contrainte du sujet, signale-le immédiatement.

**Phase 4 — Contraintes & disponibilité**
- Propose des fourchettes plutôt qu'une question ouverte : « Combien d'heures par semaine l'équipe peut s'y consacrer ? À la louche : 5-10h (rythme léger, à côté d'autres modules), 10-20h (rythme normal Epitech), 20h+ (sprint intense avant rendu) ? »
- Demande ensuite : « Des contraintes externes à signaler (autres rendus en parallèle, partiels, déplacements, semaine de soutenance) ? Sinon je pars sur disponibilité standard. »

**Phase 5 — Génération du plan complet** (sans poser de question)
- Appelle dans l'ordre : \`set_warnings\`, \`set_tasks\` (15-25 tâches avec assignation selon les compétences), \`set_planning\` (4-6 sprints), \`set_risks\` (5-7), \`set_checklist\` (10-15), \`update_meta\` (difficulty, riskScore, deadline, durationDays, estimatedHours).
- Annonce que le plan est prêt et invite à ouvrir le dashboard complet.

**Phase 6 — Itération (optionnelle)**
- Si l'utilisateur veut ajuster (équipe, deadline, ajouter/retirer une tâche), appelle les outils pertinents pour mettre à jour.

# Règles

- **Sois proactif, pas un interrogateur passif.** À chaque fois que tu poses une question, **propose toi-même 2 ou 3 options concrètes adaptées au PDF** parmi lesquelles l'utilisateur peut piocher (ou dire "autre chose"). Ne pose jamais une question complètement ouverte qui force l'utilisateur à tout inventer (ex: ❌ « Quelle stack tu veux ? » → ✅ « Je vois trois options pour ce projet : A, B, C — laquelle ? »).
- Tes propositions doivent être **ancrées dans le PDF** : utilise les contraintes, le type de projet, les technos mentionnées pour justifier en une demi-phrase pourquoi tu proposes ça.
- Quand l'utilisateur dit "je ne sais pas", "à toi de voir", "fais comme tu veux" : prends une décision raisonnable, annonce-la en 1 phrase, et continue. Ne re-questionne pas.
- Appelle les outils dès que tu collectes une information exploitable. N'attends pas la fin pour tout faire d'un coup (sauf pour la phase 5 où tout est généré en cascade).
- Ne ré-explique pas ce que les outils font à l'utilisateur. Ils sont silencieux côté utilisateur.
- Si l'utilisateur t'envoie quelque chose en dehors des phases (ex: une question technique), réponds brièvement puis recadre.
- Évite les listes à puces dans tes messages de chat — sauf pour le résumé initial (phase 1) et les listes d'options A/B/C que tu proposes (phases 3-4). Garde un ton conversationnel.
- Pour set_tasks : chaque tâche doit avoir un assigneeName qui matche exactement un name de l'équipe enregistrée via set_team.
- Pour set_planning : utilise les title exacts des tasks dans taskTitles.`

const MAX_TURNS = 8 // safety cap for the agentic loop

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

// ───────────────────────────────────────────────────────────────────────────
// Low-level OpenAI Responses API call. Maps HTTP errors to canonical codes.

async function callOpenAI({ apiKey, body }) {
  let res
  try {
    res = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(`FETCH_FAILED: ${err?.message || 'network'}`)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = await res.json()
      detail = errBody?.error?.message || JSON.stringify(errBody)
    } catch {
      detail = await res.text().catch(() => '')
    }
    if (res.status === 401) throw new Error('API_KEY_INVALID')
    if (res.status === 429) throw new Error('RATE_LIMITED')
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`BAD_REQUEST: ${detail || res.statusText}`)
    }
    throw new Error(`OPENAI_${res.status}: ${detail || res.statusText}`)
  }

  return res.json()
}

// Extract the concatenated assistant text from a Responses API result.
function extractOutputText(response) {
  if (typeof response?.output_text === 'string' && response.output_text.length) {
    return response.output_text
  }
  const chunks = []
  for (const item of response?.output || []) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c.type === 'output_text' && typeof c.text === 'string') chunks.push(c.text)
      }
    }
  }
  return chunks.join('\n\n')
}

// ───────────────────────────────────────────────────────────────────────────
// One-shot analysis — single Responses API call with json_schema output.

export async function analyzePdfWithOpenAI({
  apiKey,
  model = 'gpt-5.4-mini',
  pdfBase64,
  pdfFilename,
  team,
  onProgress,
}) {
  if (!apiKey) throw new Error('API_KEY_MISSING')
  if (!pdfBase64) throw new Error('PDF_MISSING')
  if (!team?.length) throw new Error('TEAM_EMPTY')

  onProgress?.('Préparation de la requête…')

  const teamLine = team
    .map((m) => `- id="${m.id}" — ${m.name} — compétences: ${m.skills.join(', ')}`)
    .join('\n')

  const now = new Date().toISOString()

  const userText = `Analyse ce sujet Epitech et produis le plan de projet structuré.

Date du jour : ${now.split('T')[0]}.

Équipe disponible (utilise les id pour assigneeId) :
${teamLine}

Réponds uniquement avec le JSON conforme au schéma. Pas de texte autour.`

  const body = {
    model,
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename: pdfFilename || 'subject.pdf',
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
          { type: 'input_text', text: userText },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'project_plan',
        schema: projectSchema,
        strict: true,
      },
    },
    max_output_tokens: 16000,
  }

  onProgress?.('Envoi du PDF à OpenAI…')

  const response = await callOpenAI({ apiKey, body })

  onProgress?.('Structuration du plan de projet…')

  const rawText = extractOutputText(response)
  if (!rawText) throw new Error('NO_OUTPUT')

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    // Fallback: look for the largest {…} block in the text.
    const jsonStart = rawText.indexOf('{')
    const jsonEnd = rawText.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < 0) throw new Error('PARSE_FAILED')
    try {
      parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1))
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
// History format = array of OpenAI Responses API input items:
//   - { role: 'user'|'assistant', content: string }
//   - { type: 'function_call', call_id, name, arguments }   (echoed from prior turn)
//   - { type: 'function_call_output', call_id, output }
// On the very first turn we inject the PDF into the user message content.

export async function chatTurn({
  apiKey,
  model = 'gpt-5.4-mini',
  history,
  project,
  pdfBase64,
  pdfFilename,
  onToolApplied,
  onProgress,
}) {
  if (!apiKey) throw new Error('API_KEY_MISSING')

  // Clone the history so we can append turn outputs without leaking back to caller mid-loop.
  let input = history.map((m) => ({ ...m }))

  if (pdfBase64 && input.length === 1 && input[0].role === 'user') {
    const text =
      typeof input[0].content === 'string'
        ? input[0].content
        : Array.isArray(input[0].content)
          ? input[0].content.find((b) => b.type === 'input_text')?.text || ''
          : ''
    input[0] = {
      role: 'user',
      content: [
        {
          type: 'input_file',
          filename: pdfFilename || 'subject.pdf',
          file_data: `data:application/pdf;base64,${pdfBase64}`,
        },
        { type: 'input_text', text },
      ],
    }
  }

  let workingProject = project
  let collectedText = ''
  let lastUsage = null

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    onProgress?.(turn === 0 ? 'Epilot réfléchit…' : 'Application des changements…')

    const body = {
      model,
      instructions: CHAT_SYSTEM_PROMPT,
      input,
      tools: projectTools,
      max_output_tokens: 8000,
    }

    const response = await callOpenAI({ apiKey, body })
    lastUsage = response.usage

    const turnText = extractOutputText(response)
    if (turnText) {
      collectedText += (collectedText ? '\n\n' : '') + turnText
    }

    // Append every output item to the input so the next call has full context.
    const functionCalls = []
    for (const item of response.output || []) {
      if (item.type === 'message') {
        input.push({
          role: 'assistant',
          content: item.content,
        })
      } else if (item.type === 'function_call') {
        // Preserve verbatim so the next call sees the call we're responding to.
        input.push({
          type: 'function_call',
          call_id: item.call_id,
          name: item.name,
          arguments: item.arguments,
        })
        functionCalls.push(item)
      } else if (item.type === 'reasoning') {
        // Reasoning items can be passed through transparently.
        input.push(item)
      }
    }

    if (functionCalls.length === 0) {
      return {
        assistantText: collectedText,
        project: workingProject,
        history: input,
        usage: lastUsage,
      }
    }

    for (const fc of functionCalls) {
      let args = {}
      try {
        args = fc.arguments ? JSON.parse(fc.arguments) : {}
      } catch (err) {
        input.push({
          type: 'function_call_output',
          call_id: fc.call_id,
          output: `Erreur : arguments JSON invalides (${err.message}).`,
        })
        continue
      }
      try {
        const { project: nextProject, message } = applyToolUse(workingProject, {
          name: fc.name,
          input: args,
        })
        workingProject = nextProject
        onToolApplied?.(fc.name, workingProject)
        input.push({
          type: 'function_call_output',
          call_id: fc.call_id,
          output: message,
        })
      } catch (err) {
        input.push({
          type: 'function_call_output',
          call_id: fc.call_id,
          output: `Erreur : ${err.message}`,
        })
      }
    }
  }

  const finalAssistantText = collectedText || "Le plan est en cours de structuration. Si tu ne vois pas encore de réponse, relance une fois la conversation ou vérifie qu'aucune erreur n'est affichée en haut." 

  input.push({
    role: 'assistant',
    content: finalAssistantText,
  })

  return {
    assistantText: finalAssistantText,
    project: workingProject,
    history: input,
    usage: lastUsage,
  }
}
