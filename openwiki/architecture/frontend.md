# Frontend Architecture Notes

## Location

`apps/web` is the Next.js frontend workspace. It was copied from the original EZRND Flow project to preserve the UI/structure as requested.

## Architecture-domain changes

Changed user-facing domain labels from R&D/research phrasing toward architecture phrasing, including:

- project tab/name: `내 프로젝트`;
- notices: `건축 공고`;
- project creation: `건축 프로젝트 만들기`;
- sidebar workflow: direct-link school design-competition table of contents with 13 stages from `공모 지침 분석` through `패널 구성`; clicking the full row opens the corresponding stage route, and the stage emoji markers are rendered in grayscale.
- project-stage header: the active `?step=` value selects a stage-specific legal-review action in the upper-right project header and shows only the most recent numeric completion date/time centered below the button on one non-wrapping line.
- automatic help/tutorial popovers were removed from project-entry screens; project navigation now opens directly without Driver.js tours.

## Project creation UX

Current creation modal is intentionally minimal:

- one architecture project name field;
- file upload input for notice/guideline/drawing/reference files;
- submit creates the project, then uploads selected files.
- the project file panel displays the preserved original filename rather than the server-side unique storage name; legacy filenames whose UTF-8 bytes were already lost use a readable fallback label.

Relevant file:

- `apps/web/src/features/projects/ui/project-form-modal.tsx`
- `apps/web/src/features/project-files/model/use-project-files-panel.ts`
- `apps/web/src/features/legal-review/ui/legal-review-control.tsx`

## API base handling

The frontend uses `apps/web/src/shared/config/api.ts` so local development can reach the Express API even when root `.env` is not loaded by the Next.js process.

## Paper evidence to extract

For the paper, this frontend work supports a section about:

- preserving an existing application UI while changing its domain model;
- simplifying stage navigation from expandable detail panels to direct route links;
- reducing project creation input burden to project name + uploaded notice materials;
- connecting UI actions to a local monorepo backend.
