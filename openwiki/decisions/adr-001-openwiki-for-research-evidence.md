# ADR-001: Use OpenWiki as Research Evidence Layer

## Status

Accepted

## Context

The user clarified that the system should not write papers inside the product UI. Instead, OpenWiki should help document the process of making the program so that the user can later write a paper from the implementation evidence.

## Decision

Maintain an `openwiki/` directory in the repository as the paper-support knowledge base. It records architecture, decisions, implementation logs, evidence maps, and generated snapshots.

## Consequences

- Product UI remains focused on architecture project support.
- Research writing support happens through repository documentation.
- Agents should update `openwiki/` after meaningful implementation changes.
- OpenWiki CLI can be run when provider credentials are available; otherwise the markdown wiki remains manually maintainable.
