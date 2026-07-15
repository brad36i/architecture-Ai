# Implementation Log

This log is written for later conversion into the paper's implementation narrative.

## 2026-07-06 — Monorepo and architecture-domain adaptation

### Goal

Adapt the original EZRND Flow code into an AI Arch monorepo using:

- Next.js frontend;
- Node.js backend;
- SQLite database;
- LangChain JS agent.

### Key constraints

- Preserve the original code and UI structure as much as possible.
- Change domain language from R&D/research to architecture projects/notices.
- Keep project creation simple: architecture project name + optional file upload.

### Implemented evidence

- Copied original frontend into `apps/web`.
- Added Express API under `apps/api`.
- Added SQLite package under `packages/db`.
- Added LangChain JS agent package under `packages/agent`.
- Added project file upload storage under `data/uploads/{projectId}`.
- Added proposal draft persistence endpoints to support the existing editor flow.

### Verification evidence

Commands that have passed during implementation:

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```

Smoke tests performed:

- project creation endpoint;
- project file upload endpoint;
- project file list endpoint;
- proposal draft endpoint.

## 2026-07-06 — OpenWiki research documentation layer

### Correction in direction

The research support should not be an in-product paper generator. The correct direction is to maintain an OpenWiki-style repository documentation set that helps write a paper about the process of building this program.

### Implemented evidence

- Added `openwiki/` research and architecture pages.
- Added `AGENTS.md` instructions to consult and update `openwiki/`.
- Added OpenWiki CLI scripts to root `package.json`.
- Added OpenWiki npm scripts through `scripts/run-openwiki.mjs`, which loads root `.env`, defaults `OPENWIKI_PROVIDER=openai`, defaults `OPENWIKI_MODEL_ID=gpt-5.4-mini`, and runs `npx --package openwiki@0.0.1` to avoid React 19 / Ink React 18 peer conflicts.
- Added scheduled GitHub Actions template for future OpenWiki updates.
- Added `scripts/openwiki-research-snapshot.mjs` for local objective snapshots when no model credentials are available.

## 2026-07-07 — Turborepo build pipeline adoption

### Goal

Apply Turborepo to the existing npm workspaces monorepo without changing product UI behavior.

### Implemented evidence

- Added `turbo` as a root dev dependency.
- Added `turbo.json` with `build`, `typecheck`, `lint`, and `dev` tasks.
- Root scripts now delegate build and typecheck to Turbo:
  - `npm run build` -> `turbo run build`
  - `npm run typecheck` -> `turbo run typecheck`
  - `npm run build:packages` -> filtered Turbo package build
  - `npm run dev` -> package build, then filtered API/Web dev tasks
- Added `packageManager: npm@11.12.1` so Turbo can identify the package manager consistently.

### Verification evidence

```bash
npm run typecheck
npm run build
npm run build
npx turbo run dev --filter=@ezrnd/api --filter=@ezrnd/web --dry=json
```

The second build showed `FULL TURBO` with all four build tasks cached. A real `npm run dev` attempt reached API/Web startup, but the web task stopped because an existing Next dev server was already running on the project (`PID 1708514`). This is an environment process conflict, not a Turbo graph error.

## 2026-07-07 — Dev/start scripts moved fully under Turbo graph

### Goal

Remove the extra root-level `npm run build:packages && ...` orchestration from `dev` so Turbo itself owns dependency ordering.

### Implemented evidence

- `package.json` now uses `turbo run dev --filter=@ezrnd/api --filter=@ezrnd/web` directly.
- `package.json` now uses `turbo run start --filter=@ezrnd/api --filter=@ezrnd/web` for production start orchestration.
- `turbo.json` `dev` task now has `dependsOn: ["^build"]`, so `@ezrnd/db#build` and `@ezrnd/agent#build` are included automatically before API/Web dev tasks.
- `turbo.json` `start` task has `dependsOn: ["build"]`, so package builds are included before start tasks.

### Verification evidence

```bash
npx turbo run dev --filter=@ezrnd/api --filter=@ezrnd/web --dry=json
npx turbo run start --filter=@ezrnd/api --filter=@ezrnd/web --dry=json
npm run typecheck
npm run build
npm audit --omit=dev
```

Dry-run confirmed that `dev` includes:

- `@ezrnd/agent#build`
- `@ezrnd/db#build`
- `@ezrnd/api#dev`
- `@ezrnd/web#dev`

This means development startup is now managed by Turbo's task graph rather than a manual npm pre-step.

## 2026-07-08 — Random high-port development configuration

### Goal

Move local development ports away from nearby default ports and avoid `100`-style rounded port choices.

### Implemented evidence

- Frontend port changed to `47098`.
- Backend API port changed to `19722`.
- Updated `.env`, `.env.example`, frontend API fallback, API CORS default, frontend dev/start scripts, and README references.

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
timeout 12s npm run dev
```

The dev run confirmed:

- Next.js frontend: `http://localhost:47098`
- Express API: `http://localhost:19722`

The timeout exit code is expected because `npm run dev` starts persistent servers and the test command intentionally stopped them after startup.

## 2026-07-08 — Development ports restored to defaults

### Goal

Restore local development ports to the original/default values after testing random high-port configuration.

### Implemented evidence

- Frontend port restored to `3000`.
- Backend API port restored to `4000`.
- Updated `.env`, `.env.example`, frontend API fallback, API CORS default, frontend dev/start scripts, and README references.

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```

All checks passed after restoring the ports.

## 2026-07-08 — Project sidebar schema changed to architectural drawing workflow

### Goal

Replace the left-side project schema labels with the real process language used while preparing field architectural drawings, without redesigning the existing UI structure.

### Implemented evidence

- Changed the project sidebar groups from broad architecture-planning/proposal labels to a drawing-production sequence:
  - `사전검토·현황조사`
  - `계획설계`
  - `기본설계`
  - `실시설계·납품`
- Added detailed sub-steps for 공고·요구조건 검토, 대지·법규 기준 검토, 유사 사례 조사, 공간 프로그램, 배치·동선·조닝, 대안 검토, 기본도면·설계 설명서, 검토 대응, 실시설계 도서 점검, and 납품 계획.
- Updated sidebar persistence defaults so the renamed workflow groups hydrate correctly.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/widgets/sidebar/model/sidebarStore.ts`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/snapshots/2026-07-08T13-48-50-086Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-08T13-48-50-086Z.md`. The Next.js build warning about multiple lockfiles remains pre-existing and non-blocking.

## 2026-07-08 — Sidebar workflow expanded for intuitive architectural stage tracking

### Goal

Make the project sidebar more intuitive and precise by expanding the simplified design-process labels into a numbered architectural drawing-production workflow. The main correction was to make the planning-design phase granular enough for users to see exactly which sub-step they are in.

### Implemented evidence

- Expanded the sidebar from four broad groups to six numbered design-production stages:
  - `01 착수·공고 해석`
  - `02 현황조사·법규 검토`
  - `03 기획설계·프로그램`
  - `04 계획설계·대안 구체화`
  - `05 기본설계·도서화`
  - `06 실시설계·현장 납품`
- Added 24 numbered sub-steps, including detailed planning-design steps for 배치계획, 동선/피난, 층별 평면, 단면/입면/매스, 구조·설비·친환경 방향, and 대안 확정.
- Added short sub-step descriptions in the sidebar so users can distinguish the task intent without opening a page.
- Added `?step=` links and active-state handling so repeated page routes can still identify the selected sub-step.
- Increased the default/resizable sidebar width range to fit the expanded process labels while preserving the existing sidebar layout.
- Aligned the differentiation page description with the new planning-design stage wording so the screen copy does not refer back to the old proposal-evaluation schema.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/widgets/sidebar/model/sidebarStore.ts`
- `apps/web/src/views/differentiation/differentiation-view.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-08T14-00-45-742Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-08T14-00-45-742Z.md`. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-08 — Sidebar sub-step descriptions removed for professional users

### Goal

Simplify the expanded architectural workflow sidebar for users who already understand architectural terminology, including architecture students, architects, and professors.

### Implemented evidence

- Removed explanatory sub-step descriptions from the sidebar data and render output.
- Kept only the numbered step code and process name, such as `05` and `05-1`, so the workflow remains compact and scannable.
- Reduced sub-step vertical padding after removing the description line.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-08T14-08-11-481Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-08T14-08-11-481Z.md`. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-13 — Sidebar schema changed to school design-competition workflow

### Goal

Replace the previous architectural drawing workflow labels with the user-provided school design-competition process so project navigation follows competition practice from guideline analysis through final panel composition.

### Implemented evidence

- Replaced the sidebar workflow with 13 stages:
  - `01 공모 지침 분석`
  - `02 대지·법규·지침 검토`
  - `03 기능 관계 분석`
  - `04 키워드 도출`
  - `05 콘셉트 설정`
  - `06 배치대안 계획`
  - `07 매스 계획`
  - `08 조닝 계획`
  - `09 평면 계획`
  - `10 외부공간 계획`
  - `11 대안 비교 및 선정`
  - `12 설계안 검토 및 보완`
  - `13 패널 구성`
- Added the two user-provided sub-items under each stage while preserving existing page routes and `?step=` active-state routing.
- Updated persisted sidebar keys and default open state for all 13 stages.
- Increased default sidebar width and allowed two-line sub-item labels so the Korean process text is readable.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/widgets/sidebar/model/sidebarStore.ts`
- `openwiki/architecture/frontend.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-13T06-22-17-807Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-13T06-22-17-807Z.md`. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-13 — Sidebar simplified to school design-competition table of contents

### Goal

Remove detailed explanatory sub-items from the project sidebar and leave only the school design-competition table of contents requested by the user.

### Implemented evidence

- Replaced collapsible stage groups with a flat 13-item table of contents.
- Kept only stage numbers and names from `01 공모 지침 분석` through `13 패널 구성`.
- Removed detailed sentence-style sub-items from the sidebar navigation.
- Simplified sidebar persistence to store only width because collapsible open state is no longer used.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/widgets/sidebar/model/sidebarStore.ts`
- `openwiki/architecture/frontend.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-13T06-25-42-956Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-13T06-25-42-956Z.md`. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-13 — Automatic project help popovers removed

### Goal

Remove the help/tutorial information that automatically appeared when entering project screens so users can enter directly into the project workflow.

### Implemented evidence

- Removed the Driver.js tour from the project notice-analysis screen.
- Removed the topic-selection duration hint tour hook and export.
- Deleted the shared Driver.js tour component and topic-selection hint module.
- Removed Driver.js CSS overrides and uninstalled the `driver.js` dependency from the web workspace.

### Files touched

- `apps/web/src/views/research-analysis/research-analysis-view.tsx`
- `apps/web/src/views/topic-selection/topic-selection-view.tsx`
- `apps/web/src/features/topic-selection/index.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/shared/ui/driver-tour.tsx` (deleted)
- `apps/web/src/features/topic-selection/model/use-topic-selection-duration-hint.ts` (deleted)
- `apps/web/package.json`
- `package-lock.json`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-13T08-47-12-544Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-13T08-47-12-544Z.md`. Search confirmed no remaining `driver.js`, `DriverTour`, or `useTopicSelectionDurationHint` references in the frontend source. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-13 — Sidebar table of contents switched from numbers to emoji markers

### Goal

Make the project sidebar table of contents friendlier by removing visible numeric prefixes and the generic list icon, then showing context-specific emoji markers next to each school design-competition stage.

### Implemented evidence

- Removed the visible `ListOrdered` icon from sidebar entries.
- Removed visible stage numbers from the sidebar labels while keeping internal `step` values for route active-state tracking.
- Added stage-specific emoji markers such as `📋`, `📐`, `💡`, `🧭`, `🏢`, `🌳`, and `🖼️`.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-13T08-48-50-729Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-13T08-48-50-729Z.md`. The existing Next.js multiple-lockfile warning remains non-blocking.

## 2026-07-14 — Sidebar schema converted to toggle-based result and legal-review workflow

### Goal

Turn the left project schema from a simple table of contents into a toggle-based workflow where users can expand each school design-competition stage and inspect the expected result details plus legal-review checkpoints.

### Implemented evidence

- Each of the 13 sidebar stages is now a toggle row with an emoji marker and expandable content.
- Expanded content includes two sections:
  - `진행 결과` for expected stage outputs;
  - `법규 검토` for legal and guideline checkpoints.
- Active stage rows open by default, and each expanded panel includes a `단계 화면 열기` link to the existing route.
- Existing page routes and `?step=` active-state tracking were preserved.

### Files touched

- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`
- `openwiki/research/snapshots/2026-07-14T13-36-15-766Z.md`

### Verification evidence

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run research:snapshot
```

`npm run typecheck` passed. The first build attempt failed because sandboxed network access blocked Google Fonts; rerunning `npm run build` with network permission passed. `npm audit --omit=dev` reported zero vulnerabilities. The latest research snapshot is `openwiki/research/snapshots/2026-07-14T13-36-15-766Z.md`.

## 2026-07-14 — Stage-specific legal-review action and completion tracking

### Goal

Place one legal-review action in the upper-right corner of every project stage and retain the latest completed review time separately for each project and stage.

### Implemented evidence

- Centralized the 13 architecture stages so sidebar routing and legal-review UI share the same `step` identity.
- Added a project-header legal-review button driven by the active `?step=` query value.
- Added GET/POST legal-review endpoints, a SQLite `legal_reviews` history table, and a dedicated cautious LangChain review function with deterministic fallback.
- The header shows the latest server-persisted completion time and keeps stages that share a route separate through their step value.
- Added root `DESIGN.md` as the active repository UI contract.

### Files touched

- `DESIGN.md`
- `apps/web/src/shared/config/architecture-stages.ts`
- `apps/web/src/features/legal-review/`
- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/widgets/header/ui/header.tsx`
- `apps/api/src/index.ts`
- `packages/db/src/index.ts`
- `packages/agent/src/index.ts`

### Verification evidence

- Workspace typechecks for web, API, DB, and agent passed during implementation.
- Fallback API smoke checks covered review creation, latest-review lookup, and invalid-stage rejection.

## 2026-07-14 — Korean upload filename corruption fixed

### Goal

Prevent uploaded Korean filenames from becoming mojibake in the project file panel and make already-damaged legacy entries readable.

### Implemented evidence

- Re-decodes lossless UTF-8 multipart filenames that the parser exposes as Latin-1 before sanitizing the storage name.
- Stores each new upload's original display name in project-local metadata while retaining a unique server filename.
- Removes server-generated timestamp/random suffixes from fallback display names.
- Replaces irreversibly damaged legacy names with numbered `업로드 파일` labels because the missing original bytes cannot be reconstructed.
- Accepts both project-creation multi-file uploads and single-file uploads from the right file panel.
- Added regression coverage for Korean restoration, normal filename preservation, storage suffix removal, and legacy fallback behavior.

### Files touched

- `apps/api/src/file-names.ts`
- `apps/api/src/file-names.test.ts`
- `apps/api/src/index.ts`
- `apps/web/src/features/project-files/model/use-project-files-panel.ts`
- `openwiki/architecture/frontend.md`
- `openwiki/architecture/backend-db-agent.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`

### Verification evidence

```bash
node --import tsx --test apps/api/src/file-names.test.ts
npm run typecheck --workspace=@ezrnd/api
npm run typecheck --workspace=@ezrnd/web
npm run build
```

All listed checks passed. The first sandboxed build could not reach Google Fonts; the build passed after rerunning with network access. The current four damaged stored filenames map to readable numbered fallback names; new uploads retain their original Korean display names. The latest research snapshot is `openwiki/research/snapshots/2026-07-15T03-23-01-395Z.md`.

## 2026-07-15 — Sidebar stages changed to direct monochrome navigation

### Goal

Make every stage row navigate immediately to its corresponding screen, remove expandable result/legal details from the sidebar, and reduce the visual color variation of the stage emojis.

### Implemented evidence

- Replaced each sidebar toggle button with a full-width Next.js `Link` preserving the existing route and `?step=` value.
- Removed toggle state, chevrons, `진행 결과`, `법규 검토`, and the secondary `단계 화면 열기` action.
- Removed the now-unused result and legal-detail arrays from the shared frontend stage configuration.
- Applied grayscale and reduced opacity to the existing semantic stage emojis while retaining active-row highlighting and keyboard-accessible link semantics.
- Refreshed `DESIGN.md` to record direct stage navigation and grayscale sidebar iconography.

### Files touched

- `DESIGN.md`
- `apps/web/src/widgets/sidebar/sidebar.tsx`
- `apps/web/src/shared/config/architecture-stages.ts`
- `openwiki/architecture/frontend.md`
- `openwiki/research/evidence-map.md`
- `openwiki/research/implementation-log.md`

### Verification evidence

```bash
npm run typecheck --workspace=@ezrnd/web
npm run lint --workspace=@ezrnd/web -- src/widgets/sidebar/sidebar.tsx src/shared/config/architecture-stages.ts
npm run build
npm run research:snapshot
```

All checks passed, and source search confirmed that the sidebar no longer contains toggle state, result/legal detail labels, chevrons, or the secondary open-stage action. The latest research snapshot is `openwiki/research/snapshots/2026-07-15T12-47-11-242Z.md`.

## 2026-07-15 — Legal-review completion timestamp made compact and non-wrapping

### Goal

Keep the completion time below the legal-review button readable when adjacent header content is present.

### Implemented evidence

- Removed the visible `최근 검토 완료:` prefix from successful review status.
- Displays only the numeric Korean date and 24-hour time, without seconds.
- Added non-wrapping and tabular-number styling so the timestamp remains on one line.
- Preserved the full semantic meaning through an accessible label for screen readers.

### Files touched

- `DESIGN.md`
- `apps/web/src/features/legal-review/ui/legal-review-control.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`

### Verification evidence

```bash
npm run typecheck --workspace=@ezrnd/web
npm run lint --workspace=@ezrnd/web -- src/features/legal-review/ui/legal-review-control.tsx
npm run build
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-15T13-22-23-432Z.md`.

## 2026-07-15 — Legal-review timestamp centered below its action

### Goal

Keep the legal-review completion time visually aligned with the action that produced it.

### Implemented evidence

- Centered the legal-review control contents in the project header.
- Centered the completion timestamp and status/error text beneath the action button.
- Retained the compact, numeric, non-wrapping date-and-time format.

### Files touched

- `DESIGN.md`
- `apps/web/src/features/legal-review/ui/legal-review-control.tsx`
- `openwiki/architecture/frontend.md`
- `openwiki/research/implementation-log.md`

### Verification evidence

```bash
npx prettier --write apps/web/src/features/legal-review/ui/legal-review-control.tsx DESIGN.md openwiki/architecture/frontend.md
npm run typecheck --workspace=@ezrnd/web
npm run lint --workspace=@ezrnd/web -- src/features/legal-review/ui/legal-review-control.tsx
npm run build
npm run research:snapshot
```

All checks passed. The latest research snapshot is `openwiki/research/snapshots/2026-07-15T13-28-10-412Z.md`.

## 2026-07-15 — Tab terminology updated for architecture domain

### Goal

Update the tab terminology on the research-analysis page to better fit the architecture domain.

### Implemented evidence

- Renamed "지원사업 공고 분석" to "공모 자료 분석".
- Renamed "공고문 원문" to "공모 자료 원문".

### Files touched

- `apps/web/src/views/research-analysis/research-analysis-view.tsx`
- `openwiki/research/implementation-log.md`

### Verification evidence

```bash
npm run typecheck --workspace=@ezrnd/web
```

Typecheck passed.
