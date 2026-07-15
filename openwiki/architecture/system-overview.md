# System Overview

## System goal

AI Arch adapts the original EZRND Flow project into an architecture-domain system while preserving the original application structure as much as possible. The implemented product supports:

1. architecture project creation;
2. notice/guideline file upload;
3. project listing and detail navigation;
4. architecture-domain proposal/editor workflows;
5. a local Node/SQLite/LangChain monorepo baseline.

The OpenWiki documents the build process for research writing.

## Monorepo layout

```text
apps/
  web/     Next.js frontend copied from the original EZRND Flow UI
  api/     Node.js Express API
packages/
  db/      SQLite data access layer using better-sqlite3
  agent/   LangChain JS agent wrapper with OpenAI/fallback modes
openwiki/  Research and agent-facing documentation for the paper
```

## Runtime flow

```text
User browser
  -> apps/web Next.js UI
  -> apps/api Express API
  -> packages/db SQLite tables + upload files in data/uploads
  -> packages/agent LangChain JS agent when AI assistance is requested
```

## Core evidence for paper

- The repo is organized as npm workspaces in `package.json`, with Turborepo configured in `turbo.json` for task orchestration and caching.
- `apps/web` keeps the original Next.js codebase and only changes domain labels/creation fields requested by the user.
- `apps/api/src/index.ts` exposes local project, file, proposal, recommendation, and agent endpoints.
- `packages/db/src/index.ts` creates SQLite tables for projects, agent runs, and proposal drafts.
- `packages/agent/src/index.ts` uses LangChain JS `ChatOpenAI` when `OPENAI_API_KEY` is set and a deterministic fallback otherwise.

## Important boundary

This wiki is for the research process. The product UI should remain focused on architecture project work; paper writing evidence lives in `openwiki/`.
