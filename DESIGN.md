# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-07-15
- Primary product surfaces: project list, project creation, project workflow screens, project sidebar
- Evidence reviewed: `openwiki/architecture/frontend.md`, `apps/web/src/widgets/sidebar/sidebar.tsx`, `apps/web/src/widgets/header/ui/header.tsx`, `apps/web/src/shared/ui/page-header.tsx`, existing project views

## Brand

- Personality: professional, calm, evidence-oriented architecture planning assistant
- Trust signals: explicit workflow state, timestamps, source-aware wording, visible review limitations
- Avoid: decorative redesigns, legal certainty claims, research-domain terminology that does not fit architecture practice

## Product goals

- Goals: help architecture students, architects, and professors understand the current design-competition stage and its outputs; make stage-specific review status visible
- Non-goals: replacing an architect, code consultant, permitting authority, or legal professional
- Success signals: users can identify the active stage, run the relevant review, and see when it was most recently completed

## Personas and jobs

- Primary personas: architecture students, architects, architecture professors
- User jobs: analyze competition requirements, develop design alternatives, review stage outputs, track legal and guideline checks
- Key contexts of use: desktop-first, information-dense project work over multiple sessions

## Information architecture

- Primary navigation: project list → project → 13-stage left workflow
- Core routes/screens: project creation and the existing project stage routes
- Content hierarchy: global project context → active stage content → stage actions and review status

## Design principles

- Preserve the existing EZRND Flow layout and interaction patterns.
- Put cross-stage actions in a stable location so users do not need to relearn each screen.
- Separate “review completed” from “legally compliant”; an AI review is supporting evidence, not a legal determination.
- Tradeoffs: prefer a compact shared header control over adding a different action layout to every stage view.

## Visual language

- Color: existing zinc/emerald palette; amber only for legal-review emphasis or attention states
- Typography: existing Pretendard and project typography
- Spacing/layout rhythm: reuse existing header spacing and compact button sizing
- Shape/radius/elevation: reuse existing buttons, borders, and subtle shadows
- Motion: existing short transitions only
- Imagery/iconography: Lucide icons and the existing stage emojis; sidebar stage emojis render in grayscale for a restrained professional navigation tone

## Components

- Existing components to reuse: `Button`, `Link`, project `Header`, `PageHeader`, React Query provider
- New/changed components: direct-link stage sidebar and shared stage legal-review control in the project header
- Variants and states: idle, loading, running, completed, error
- Token/component ownership: existing shared UI tokens; feature-specific state remains under `features/legal-review`

## Accessibility

- Target standard: practical WCAG 2.1 AA alignment
- Keyboard/focus behavior: native button semantics and visible focus behavior inherited from `Button`
- Contrast/readability: status copy uses existing readable zinc colors; errors use red with text, not color alone
- Screen-reader semantics: descriptive button label and live status text
- Reduced motion and sensory considerations: no required animation beyond existing loading affordances

## Responsive behavior

- Supported breakpoints/devices: desktop-first with wrapping header actions at narrow widths
- Layout adaptations: project metadata truncates before actions; review timestamp remains centered beneath its button
- Touch/hover differences: action remains operable without hover

## Interaction states

- Loading: indicate that the existing record is being loaded
- Empty: show that no legal review has been completed for the active stage
- Error: retain the action and show a concise retryable error
- Success: show the latest completed timestamp returned by the server
- Disabled: disable while running or when the stage/project identifier is unavailable
- Offline/slow network, if applicable: retain previous timestamp while a new review runs

## Content voice

- Tone: concise, professional, and non-absolute
- Terminology: use “법률 검토 실행” and “확인 필요”; do not use “법적 적합 확정”
- Microcopy rules: successful review timestamps display only a non-wrapping numeric date and time; errors explain that the review could not be completed

## Implementation constraints

- Framework/styling system: Next.js 16, React 19, Tailwind CSS, existing shared UI components
- Design-token constraints: do not add a second design-system layer
- Performance constraints: fetch only the active stage’s latest review; do not load all review histories in every screen
- Compatibility constraints: stages sharing the same route remain distinct through the `step` query parameter
- Test/screenshot expectations: typecheck and production build; visually inspect the shared header placement when a browser environment is available

## Open questions

- [ ] Define authoritative legal and competition-guideline sources before claiming substantive compliance coverage.
- [ ] Define which stage data constitutes the immutable review snapshot for automatic stale-review detection.
