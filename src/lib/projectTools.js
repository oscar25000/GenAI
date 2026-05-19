// Tools exposed to Claude during the guided conversation.
// Each tool corresponds to a chunk of the project plan. The agent calls them
// as the conversation progresses; the background SW applies the patch to the
// shared project state and persists it.

export const projectTools = [
  {
    name: 'set_summary',
    description:
      "Définit ou met à jour le résumé du projet : nom court, objectif, ce qu'il faut construire, contraintes principales, livrables imposés. À appeler dès que tu as lu le PDF.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', description: 'Nom court du projet (ex: AREA, Plazza)' },
        goal: { type: 'string', description: 'Objectif en 2-3 phrases simples' },
        whatToBuild: {
          type: 'array',
          items: { type: 'string' },
          description: '3-6 livrables concrets à construire',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Contraintes techniques et fonctionnelles imposées par le sujet',
        },
        deliverables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Livrables imposés (code, README, doc, slides, APK…)',
        },
      },
      required: ['name', 'goal', 'whatToBuild', 'constraints', 'deliverables'],
    },
  },

  {
    name: 'set_team',
    description:
      "Enregistre l'équipe et les compétences de chaque membre. À appeler une fois que l'utilisateur a partagé les prénoms et les rôles. Mets à jour la liste complète à chaque appel.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        members: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string', description: 'Prénom du membre' },
              skills: {
                type: 'array',
                items: { type: 'string' },
                description: 'Compétences (frontend, backend, design, devops…)',
              },
            },
            required: ['name', 'skills'],
          },
        },
      },
      required: ['members'],
    },
  },

  {
    name: 'set_warnings',
    description:
      "Enregistre les points critiques 'à ne pas oublier' déduits du sujet (README, docker-compose, route /about.json, tests, .env.example, schéma d'architecture, plan B démo…). 8 à 12 items typiquement.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              detail: { type: 'string' },
              category: {
                type: 'string',
                enum: [
                  'documentation',
                  'devops',
                  'backend',
                  'frontend',
                  'security',
                  'qa',
                  'mobile',
                  'design',
                  'soutenance',
                ],
              },
            },
            required: ['title', 'severity', 'detail', 'category'],
          },
        },
      },
      required: ['items'],
    },
  },

  {
    name: 'set_tasks',
    description:
      "Définit la liste complète des tâches du projet (15 à 25 typiquement). À appeler après avoir collecté l'équipe et l'ambition de l'équipe. assigneeName doit matcher exactement un name de l'équipe.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: {
                type: 'string',
                enum: [
                  'setup',
                  'frontend',
                  'backend',
                  'database',
                  'security',
                  'tests',
                  'qa',
                  'documentation',
                  'devops',
                  'mobile',
                  'design',
                  'soutenance',
                ],
              },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              difficulty: { type: 'integer' },
              hours: { type: 'integer' },
              assigneeName: { type: 'string', description: "Prénom (doit matcher l'équipe)" },
            },
            required: ['title', 'description', 'category', 'priority', 'difficulty', 'hours', 'assigneeName'],
          },
        },
      },
      required: ['tasks'],
    },
  },

  {
    name: 'set_planning',
    description:
      "Définit le planning par sprints (4 à 6 sprints couvrant toute la durée). Chaque sprint référence des tâches par titre exact.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sprints: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string', description: 'ex: "Semaine 1", "Derniers jours"' },
              range: { type: 'string', description: 'ex: "18 mai → 24 mai"' },
              theme: { type: 'string' },
              milestones: { type: 'array', items: { type: 'string' } },
              taskTitles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Titres des tâches assignées à ce sprint (matche set_tasks)',
              },
            },
            required: ['label', 'range', 'theme', 'milestones', 'taskTitles'],
          },
        },
      },
      required: ['sprints'],
    },
  },

  {
    name: 'set_risks',
    description: 'Définit les risques projet avec leur mitigation (5 à 7 items).',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              level: { type: 'string', enum: ['high', 'medium', 'low'] },
              score: { type: 'integer', description: '0-100' },
              detail: { type: 'string' },
              mitigation: { type: 'string' },
            },
            required: ['title', 'level', 'score', 'detail', 'mitigation'],
          },
        },
      },
      required: ['risks'],
    },
  },

  {
    name: 'set_checklist',
    description: 'Définit la checklist finale avant rendu (10 à 15 items).',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string' },
            },
            required: ['label'],
          },
        },
      },
      required: ['items'],
    },
  },

  {
    name: 'update_meta',
    description:
      'Met à jour les métadonnées globales du projet (difficulté, score de risque, deadline, durée, heures estimées).',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        difficulty: { type: 'number', description: '0-10' },
        riskScore: { type: 'integer', description: '0-100' },
        deadline: { type: 'string', description: 'ISO 8601' },
        durationDays: { type: 'integer' },
        estimatedHours: { type: 'integer' },
      },
      required: [],
    },
  },
]

// ───────────────────────────────────────────────────────────────────────────
// Tool execution — applies a tool_use block from Claude to the shared
// project state object. Returns the patched project plus a short status
// string that's sent back to the model as the tool_result.

let idCounter = 0
function nextId(prefix) {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`
}

const DEFAULT_COLORS = ['#8257FF', '#6A3BF5', '#B59CFF', '#9B7BFF', '#F59E0B', '#EC4899', '#10B981', '#3B82F6']

export function applyToolUse(project, toolUse) {
  const input = toolUse.input || {}
  const next = { ...project }

  switch (toolUse.name) {
    case 'set_summary':
      next.name = input.name || next.name
      next.summary = {
        goal: input.goal,
        whatToBuild: input.whatToBuild,
        constraints: input.constraints,
        deliverables: input.deliverables,
      }
      return { project: next, message: 'Résumé enregistré.' }

    case 'set_team':
      next.team = (input.members || []).map((m, i) => {
        const existing = (project.team || []).find((t) => t.name === m.name)
        return {
          id: existing?.id || m.name.toLowerCase().replace(/\s+/g, '-'),
          name: m.name,
          avatar: m.name.charAt(0).toUpperCase(),
          color: existing?.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
          skills: m.skills || [],
        }
      })
      return { project: next, message: `Équipe : ${next.team.length} membre(s) enregistré(s).` }

    case 'set_warnings':
      next.warnings = (input.items || []).map((w) => ({
        ...w,
        id: nextId('w'),
      }))
      return { project: next, message: `${next.warnings.length} alerte(s) enregistrée(s).` }

    case 'set_tasks': {
      const team = next.team || []
      next.tasks = (input.tasks || []).map((t) => {
        const member = team.find(
          (m) => m.name.toLowerCase() === (t.assigneeName || '').toLowerCase(),
        )
        return {
          id: nextId('t'),
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          difficulty: t.difficulty,
          hours: t.hours,
          assignee: member?.id || team[0]?.id || null,
          status: 'todo',
        }
      })
      return { project: next, message: `${next.tasks.length} tâche(s) enregistrée(s).` }
    }

    case 'set_planning': {
      const tasks = next.tasks || []
      const taskByTitle = new Map(tasks.map((t) => [t.title, t.id]))
      next.planning = (input.sprints || []).map((s) => ({
        id: nextId('s'),
        label: s.label,
        range: s.range,
        theme: s.theme,
        milestones: s.milestones || [],
        taskIds: (s.taskTitles || [])
          .map((title) => taskByTitle.get(title))
          .filter(Boolean),
      }))
      return { project: next, message: `${next.planning.length} sprint(s) planifié(s).` }
    }

    case 'set_risks':
      next.risks = (input.risks || []).map((r) => ({ ...r, id: nextId('r') }))
      return { project: next, message: `${next.risks.length} risque(s) enregistré(s).` }

    case 'set_checklist':
      next.checklist = (input.items || []).map((c) => ({
        ...c,
        id: nextId('c'),
        done: false,
      }))
      return { project: next, message: `${next.checklist.length} item(s) de checklist.` }

    case 'update_meta':
      if (input.difficulty != null) next.difficulty = input.difficulty
      if (input.riskScore != null) next.riskScore = input.riskScore
      if (input.deadline) next.deadline = input.deadline
      if (input.durationDays != null) next.durationDays = input.durationDays
      if (input.estimatedHours != null) next.estimatedHours = input.estimatedHours
      return { project: next, message: 'Métadonnées mises à jour.' }

    default:
      return { project, message: `Outil inconnu : ${toolUse.name}` }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Sections collected so far (used by the UI progress panel).

export const SECTIONS = [
  { id: 'summary', label: 'Résumé', tool: 'set_summary', check: (p) => !!p.summary?.goal },
  { id: 'team', label: 'Équipe', tool: 'set_team', check: (p) => (p.team?.length || 0) >= 1 },
  { id: 'warnings', label: 'À ne pas oublier', tool: 'set_warnings', check: (p) => (p.warnings?.length || 0) >= 1 },
  { id: 'tasks', label: 'Tâches', tool: 'set_tasks', check: (p) => (p.tasks?.length || 0) >= 1 },
  { id: 'planning', label: 'Planning', tool: 'set_planning', check: (p) => (p.planning?.length || 0) >= 1 },
  { id: 'risks', label: 'Risques', tool: 'set_risks', check: (p) => (p.risks?.length || 0) >= 1 },
  { id: 'checklist', label: 'Checklist', tool: 'set_checklist', check: (p) => (p.checklist?.length || 0) >= 1 },
]
