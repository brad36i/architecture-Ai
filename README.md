# AI Arch Flow Main

Next.js frontend, Node.js API, SQLite persistence, and a LangChain JS agent in one npm-workspaces monorepo.

## Structure

```text
apps/web        # Next.js frontend
apps/api        # Express/Node.js backend
packages/db     # SQLite schema and repository helpers
packages/agent  # LangChain JS agent runner
```

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- SQLite file: `./data/ezrnd-flow.sqlite`

`OPENAI_API_KEY` is optional. Without it, the agent returns a deterministic local fallback response so the app can run immediately.

## Useful scripts

```bash
npm run build       # build packages, API, and web
npm run typecheck   # TypeScript checks for every workspace
npm run start       # start built API and Next app
```
