# ADR-002: Local-First npm Workspace Monorepo

## Status

Accepted

## Context

The requested stack is Next.js frontend, Node.js backend, SQLite database, and LangChain JS agent. The existing project should be preserved as much as possible.

## Decision

Use npm workspaces:

- `apps/web` for the copied Next.js frontend;
- `apps/api` for the Express backend;
- `packages/db` for SQLite access;
- `packages/agent` for LangChain JS integration.

## Consequences

- The system can be built and tested locally.
- SQLite supports fast prototyping without external DB setup.
- The architecture is easy to describe in the paper.
- Production deployment concerns remain future work.
