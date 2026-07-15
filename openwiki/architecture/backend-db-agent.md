# Backend, Database, and Agent Notes

## API layer

Location: `apps/api/src/index.ts`

Technology:

- Node.js
- Express
- Zod validation
- Multer for project file uploads
- CORS for the local Next.js app

Key local endpoints:

- `GET /health`
- `GET /api/v2/users/:userId/projects`
- `POST /api/v2/workflows/:userId/projects/init-detail`
- `GET /api/v2/projects/:projectId/me`
- `PATCH /api/v2/projects/:projectId`
- `DELETE /api/v2/projects/:projectId`
- `PATCH /api/v2/projects/:projectId/pin`
- `GET /api/v2/projects/:projectId/files`
- `POST /api/v2/projects/:projectId/files`
- `GET/POST /api/v2/projects/:projectId/proposals`
- `GET/POST /api/v2/projects/:projectId/legal-reviews/:step`
- `GET /api/v2/projects/:projectId/proposals/chat/history`
- `GET /api/:apiVersion/projects/:projectId/proposals/:mode/stream`
- `POST /api/v2/agent/run`

## SQLite layer

Location: `packages/db/src/index.ts`

Tables:

- `flows` — legacy/local flow table;
- `agent_runs` — records agent calls and outputs;
- `projects` — architecture project metadata;
- `proposal_drafts` — local editable proposal draft content and version.
- `legal_reviews` — immutable stage-specific AI-assisted review runs, focus items, provider, output, and completion time.

## File storage

Uploaded files are saved under:

```text
data/uploads/{projectId}/
```

Multer limits:

- max 10 files per request;
- max 25 MB per file.

Multipart filenames are normalized from the Latin-1 representation exposed by the parser back to UTF-8 when the conversion is lossless. New uploads store a hidden `.file-metadata.json` mapping from the unique storage filename to the original display filename. Legacy names that were sanitized after encoding damage cannot be reconstructed exactly, so the API returns a readable numbered fallback instead of mojibake.

## Agent layer

Location: `packages/agent/src/index.ts`

The agent package:

- uses LangChain JS `ChatOpenAI` when `OPENAI_API_KEY` is configured;
- falls back to a deterministic local response when no key is present;
- responds in Korean by default for architecture planning support.
- provides a dedicated stage-specific legal-review prompt that avoids legal-certainty claims and records whether OpenAI or the deterministic fallback produced the output.

## Paper evidence to extract

This layer supports paper sections on:

- practical local-first architecture for rapid prototyping;
- separating UI, API, database, and agent concerns in a monorepo;
- reproducible fallback behavior when external LLM credentials are not available;
- file upload as the bridge from public architecture notices to structured project workflows.
