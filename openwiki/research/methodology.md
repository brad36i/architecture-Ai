# Methodology Notes

## Study type

This is an implementation-centered system design study. The method is closer to design science / engineering case study than a statistical user study unless separate user evaluation is later performed.

## Development method to report

1. Start from the original EZRND Flow codebase.
2. Preserve frontend structure and visual layout unless a requested feature requires minimal changes.
3. Convert domain language from R&D/research planning to architecture notices and projects.
4. Add local backend services for project persistence, file upload, and agent execution.
5. Store implementation evidence in OpenWiki pages and snapshots.
6. Verify changes with typecheck, build, audit, and API smoke tests.

## Data sources for the paper

- Source code in `apps/` and `packages/`.
- Verification output from commands recorded in `implementation-log.md`.
- Generated snapshots in `openwiki/research/snapshots/`.
- Design decisions in `openwiki/decisions/`.
- User-requested constraints summarized in the implementation log.

## Evaluation plan

Minimum engineering evaluation:

- project creation succeeds with project name only;
- upload succeeds for project files;
- project list returns created projects;
- proposal draft endpoint returns and saves local draft content;
- agent endpoint returns fallback or OpenAI response;
- full build/typecheck passes.

Possible future user evaluation:

- compare time to create a proposal outline with and without AI Arch;
- evaluate whether architecture-domain labels reduce user confusion;
- score completeness of extracted project requirements from uploaded notices after parser implementation.
