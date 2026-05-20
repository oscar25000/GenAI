# Epilot Server

Petit backend Node + Express qui gère les intégrations qui demandent des credentials (Trello pour l'instant — GitHub / Jira / Notion à venir).

## Pourquoi un backend ?

L'extension Chrome ne peut pas garder un *client secret* OAuth en sécurité (n'importe qui peut décompresser le `.crx`). Le backend héberge la clé API et signe les requêtes côté serveur.

Pour Trello, la clé n'est techniquement pas un secret, mais on passe quand même par le serveur pour :
- centraliser la config (changer la clé sans repackager l'extension)
- préparer le même pattern pour GitHub / Jira / Notion qui, eux, exigent un secret

## Setup

### 1. Installer les dépendances

```bash
cd server
npm install
```

### 2. Récupérer une clé API Trello

1. Connecte-toi sur Trello dans ton navigateur
2. Va sur https://trello.com/power-ups/admin
3. Clique sur "New" pour créer un Power-Up / intégration
4. Remplis les champs (nom : `Epilot`, workspace : ton workspace perso)
5. Une fois créé, ouvre l'onglet **"API key"** → clique sur "Generate a new API key"
6. Copie la valeur affichée

> Si Trello te redirige vers https://trello.com/app-key, c'est l'ancienne page, ça marche aussi.

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Édite `.env` et colle ta clé :

```env
TRELLO_API_KEY=ta_cle_ici
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Lancer le serveur

```bash
npm run dev      # mode watch (recharge à chaque modif)
# ou
npm start        # mode normal
```

Tu devrais voir :

```
[epilot-server] listening on http://localhost:3001
```

Test rapide :

```bash
curl http://localhost:3001/health
# → {"ok":true,"version":"0.1.0"}

curl http://localhost:3001/api/trello/config
# → {"apiKey":"...","scope":"read,write","appName":"Epilot"}
```

## Endpoints

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck |
| `GET` | `/api/trello/config` | Renvoie la clé API publique Trello (lue côté extension pour démarrer l'OAuth) |
| `POST` | `/api/trello/export` | Body : `{ token, project }`. Crée le board + listes + labels + cards. Renvoie `{ boardId, boardUrl, listsCreated, labelsCreated, cardsCreated }` |

## Architecture du flow Trello

```
1. Extension → GET /api/trello/config            (récupère l'API key)
2. Extension → chrome.identity.launchWebAuthFlow (popup Trello "Allow")
3. Trello   → redirect vers chromiumapp.org#token=XXX
4. Extension cache le token dans chrome.storage
5. Extension → POST /api/trello/export { token, project }
6. Serveur  → API Trello (boards, lists, labels, cards)
7. Serveur  → { boardUrl, ... }
8. Extension ouvre le board dans un nouvel onglet
```

## CORS

Par défaut, les origines acceptées sont :
- toutes les `chrome-extension://...` (pour l'extension installée)
- celles listées dans `ALLOWED_ORIGINS` (séparées par des virgules)

Si tu testes le dashboard via `npm run dev` côté extension (Vite sur `http://localhost:5173`), c'est déjà couvert.

## Déploiement (futur)

Le serveur est stateless — aucune base de données. Il peut être déployé tel quel sur :
- **Render** / **Railway** / **Fly.io** : `npm start` + variable `TRELLO_API_KEY` + `ALLOWED_ORIGINS`
- **Vercel** : nécessite une légère adaptation en serverless functions

Quand tu déploieras, n'oublie pas de mettre à jour `host_permissions` dans `public/manifest.json` pour pointer sur l'URL prod au lieu de `http://localhost:3001/*`.
