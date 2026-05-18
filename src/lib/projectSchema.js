// JSON Schema for structured output from Claude.
// Constraints (Anthropic structured outputs): all objects need
// additionalProperties: false; no numerical/string constraints; no recursion.

export const projectSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', description: 'Nom court du projet, dérivé du sujet (ex: AREA, Plazza, MyTeams)' },
    deadline: { type: 'string', description: 'Date de rendu au format ISO 8601. Si le sujet ne donne pas de date précise, estime 4-6 semaines à partir de la date du jour fournie.' },
    durationDays: { type: 'integer', description: 'Durée totale du projet en jours' },
    difficulty: { type: 'number', description: 'Difficulté technique globale sur 10' },
    riskScore: { type: 'integer', description: 'Score de risque sur 100' },
    estimatedHours: { type: 'integer', description: 'Total des heures estimées sur l\'ensemble des tâches' },
    summary: {
      type: 'object',
      additionalProperties: false,
      properties: {
        goal: { type: 'string', description: 'Objectif du projet en 2-3 phrases simples' },
        whatToBuild: { type: 'array', items: { type: 'string' }, description: '3-6 livrables concrets à construire' },
        constraints: { type: 'array', items: { type: 'string' }, description: 'Contraintes techniques et fonctionnelles du sujet' },
        deliverables: { type: 'array', items: { type: 'string' }, description: 'Livrables imposés (code, doc, slides, APK, etc.)' },
      },
      required: ['goal', 'whatToBuild', 'constraints', 'deliverables'],
    },
    warnings: {
      type: 'array',
      description: '8 à 12 points à ne pas oublier — pièges classiques Epitech, contraintes implicites, items souvent oubliés',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          detail: { type: 'string', description: 'Détail concret et actionnable, 1-2 phrases' },
          category: { type: 'string', enum: ['documentation', 'devops', 'backend', 'frontend', 'security', 'qa', 'mobile', 'design', 'soutenance'] },
        },
        required: ['title', 'severity', 'detail', 'category'],
      },
    },
    tasks: {
      type: 'array',
      description: '15 à 25 tâches concrètes couvrant setup, frontend, backend, base de données, auth, API, sécurité, tests, doc, devops, soutenance',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          description: { type: 'string', description: 'Description courte et actionnable' },
          category: { type: 'string', enum: ['setup', 'frontend', 'backend', 'database', 'security', 'tests', 'qa', 'documentation', 'devops', 'mobile', 'design', 'soutenance'] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          difficulty: { type: 'integer', description: 'Difficulté technique 1-10' },
          hours: { type: 'integer', description: 'Estimation en heures' },
          assigneeId: { type: 'string', description: 'ID du membre de l\'équipe le plus adapté' },
        },
        required: ['title', 'description', 'category', 'priority', 'difficulty', 'hours', 'assigneeId'],
      },
    },
    planning: {
      type: 'array',
      description: '4 à 6 sprints/jalons couvrant toute la durée du projet',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          label: { type: 'string', description: 'ex: "Semaine 1", "Derniers jours"' },
          range: { type: 'string', description: 'ex: "18 mai → 24 mai"' },
          theme: { type: 'string', description: 'Thème du sprint en une phrase' },
          milestones: { type: 'array', items: { type: 'string' }, description: '2-4 jalons concrets' },
          taskTitles: { type: 'array', items: { type: 'string' }, description: 'Titres des tâches affectées à ce sprint (matche exactement title des tasks)' },
        },
        required: ['label', 'range', 'theme', 'milestones', 'taskTitles'],
      },
    },
    risks: {
      type: 'array',
      description: '5 à 7 risques classiques du projet avec mitigation',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          level: { type: 'string', enum: ['high', 'medium', 'low'] },
          score: { type: 'integer', description: 'Score 0-100' },
          detail: { type: 'string' },
          mitigation: { type: 'string', description: 'Action concrète pour réduire le risque' },
        },
        required: ['title', 'level', 'score', 'detail', 'mitigation'],
      },
    },
    checklist: {
      type: 'array',
      description: '10 à 15 items de checklist finale avant rendu/soutenance',
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
  required: [
    'name',
    'deadline',
    'durationDays',
    'difficulty',
    'riskScore',
    'estimatedHours',
    'summary',
    'warnings',
    'tasks',
    'planning',
    'risks',
    'checklist',
  ],
}
