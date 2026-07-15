# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions
as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant
clarification.

---

This is a **Next.js 16 App Router** project for an R&D research flow management tool
(Korean-language UI).

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Commands

Use `bun` as the package manager (configured via `mise.toml`).

```bash
bun dev        # Start dev server
bun run build  # Production build
bun run lint   # ESLint
```

### State management

Zustand store in `stores/asidebar-store.ts` controls the right aside panel state (open/close, panel
type, width). Panel width is persisted to `localStorage` via `zustand/middleware/persist`.

### Design patterns

Components use **Compound Component ({ children })** and **Headless Component** patterns.

- **Compound Component**: Parent shares state/logic via Context; children can be composed flexibly
  (e.g. Tabs, Accordion).
- **Headless Component**: Provides only logic (hooks, components); UI is defined by the caller. May
  combine both (e.g. Radix Primitives + Compound + styles).

For details: `vercel-composition-patterns` skill (avoid boolean props, use children over render
props). For project structure and layers: `feature-sliced-design` skill.

### UI components

- shadcn/ui (new-york style, neutral base color, Tailwind v4, lucide icons)
- `@xyflow/react` for diagram/flow visualization
- `react-resizable` for resizable panels
- `tailwind css v4` and `shadcn` in `@/shared/ui/`
- component rounded: xs

**Always refer to `@/shared/ui` when creating new components.** Use existing shared components from
there for any common UI needs (buttons, inputs, dialogs, tabs, etc.) instead of building custom
ones. Before implementing a component, check if an equivalent already exists in `@/shared/ui`.

### Path aliases

- With FSD: `@/app`, `@/views`, `@/widgets`, `@/features`, `@/entities`, `@/shared` (see
  feature-sliced-design skill)

### Adding shadcn components

```bash
bunx --bun shadcn@latest add <component>
```

Components install to `@/shared/ui/shadcn/`. Customizations (variants, localizations) live in
`@/shared/ui/` and import from `shadcn/`. When `bunx shadcn add` overwrites files in `shadcn/`,
project customizations in the outer layer are preserved. Customized components: `button` (xs,
icon-xs, icon-sm, icon-lg sizes), `dialog` (close button "닫기"). If you run
`bunx shadcn add dialog` and it overwrites `shadcn/dialog.tsx`, add back the `closeButtonLabel` prop
to `DialogContent` so `shared/ui/dialog.tsx` continues to work.

### API base URL

`NEXT_PUBLIC_API_URL` in `.env` — 백엔드 베이스(슬래시 없이). 미설정 시 상대 경로 `/api/...`로
요청합니다.
