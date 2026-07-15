# AI Arch OpenWiki

This `openwiki/` directory is the project knowledge base for writing a paper about **building** the AI Arch system. It is not part of the user-facing product workflow and should not be confused with generating a paper inside the app.

## Purpose

Use this wiki to preserve development evidence for the paper:

- why the system architecture was chosen;
- how the original EZRND Flow code was adapted without redesigning the whole UI;
- what frontend, backend, database, file upload, and LangChain JS agent pieces were implemented;
- which verification commands and smoke tests were run;
- what limitations remain for the research paper.

## OpenWiki CLI integration

Official OpenWiki describes itself as a CLI that writes and maintains documentation for a codebase and creates/refreshed documentation under `openwiki/`. It can be installed with `npm install -g openwiki` or run through `npx --package openwiki@0.0.1` to avoid React peer conflicts with the Next.js workspace.

Local commands in this repo:

```bash
npm run openwiki:init
npm run openwiki:update
npm run openwiki:chat
npm run research:snapshot
```

OpenWiki requires an inference provider key for non-interactive runs. For OpenAI:

```bash
export OPENAI_API_KEY=...
# optional override; default is gpt-5.4-mini
export OPENWIKI_MODEL_ID=gpt-5.4-mini
npm run openwiki:update
```

If no model key is available, manually maintain the wiki pages and run `npm run research:snapshot` to capture objective repository evidence.

Sources consulted:
- LangChain blog: https://www.langchain.com/blog/introducing-openwiki-an-open-source-agent-for-repo-documentation
- OpenWiki repository: https://github.com/langchain-ai/openwiki

## Wiki map

| Page | Use |
| --- | --- |
| `architecture/system-overview.md` | Overall monorepo and runtime architecture |
| `architecture/frontend.md` | Next.js UI adaptation evidence |
| `architecture/backend-db-agent.md` | Express API, SQLite, file upload, LangChain agent evidence |
| `research/paper-plan.md` | Paper topic, research questions, target contribution |
| `research/methodology.md` | How to write the method section from implementation work |
| `research/evidence-map.md` | Code/test/docs evidence mapped to paper sections |
| `research/implementation-log.md` | Chronological build log for the paper narrative |
| `research/snapshots/` | Generated repository snapshots |
| `decisions/` | ADR-style decision records |
| `operations/openwiki-maintenance.md` | How to keep this wiki fresh |

## Current paper framing

Working title:

> AI Arch: A Monorepo-Based Agentic Workflow for Architecture Notice Analysis and Proposal Support

Korean framing:

> 건축 공고 분석 및 제안서 작성을 지원하는 LangChain JS 기반 모노레포 시스템 구축 연구

The paper should describe the system creation process, implementation decisions, evidence, and evaluation plan — not claim that the app automatically writes the final academic paper.
