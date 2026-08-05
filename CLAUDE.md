# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Flowarden** (AD490 Workflow Automator, capstone project) — a GitHub App
that lets a repo owner define automations ("workflows") triggered by GitHub
webhook events, which run a sequence of stubbed actions (add label, comment,
etc.).

This repo is the **frontend**: a Next.js (App Router) dashboard for
repo-scoped CRUD on workflows. It never talks to GitHub directly — all
GitHub/automation logic lives in the sibling backend repo.

- Backend: `../ad490-workflow-automator-api` (Node/TS/Express) — see its
  `CLAUDE.md` for that repo's architecture and contracts.
- Project hub: https://github.com/JesseCaddell/AD490-Capstone

MVP-stage: no auth in the web layer (assumes trusted demo), demo repo scope
comes from env vars. Treat docs mentioning "future milestones" as not built.

## Architecture

Data flow: **Page → Hook → Client → HTTP wrapper → API**. UI components never
call `fetch` directly — always go through `src/lib/api/hooks/*`.

- `src/app/**` — routes (App Router). Key pages: `/dashboard`, `/workflows`,
  `/workflows/new`, `/workflows/[workflowId]`.
- `src/components/layout/**` — shell/nav chrome.
- `src/components/workflows/**` — workflow form/list UI.
- `src/components/repos/**` — repo scope selector (`RepoSelector`) + gate
  (`RepoScopeGate`) that blocks workflow pages when no scope is selected.
- `src/lib/api/**` — all HTTP communication: `http.ts` (base wrapper),
  `workflowsClient.ts` (CRUD calls), `workflowTypes.ts`, `apiError.ts`
  (normalized errors), `hooks/useWorkflows.ts`.
- `src/lib/repoScope/**` — repo scope state (`installationId`/
  `repositoryId`), persisted to localStorage, injected into API requests.

Full doc: `docs/creating-workflow.md` (end-to-end workflow lifecycle from a
user's perspective).

## Key contracts (shared with the api repo — keep in sync with its CLAUDE.md)

- **Scope**: every workflow is scoped by `(installationId, repositoryId)`.
  This repo sends `x-installation-id` / `x-repository-id` headers on every
  API call. No cross-repo access, ever.
- **Workflow shape**: one trigger, `steps[]` executed in array order,
  1–25 steps, no branching/conditions.
- **Response envelope** from the API: `{ ok: true, data }` or
  `{ ok: false, error: { code, message, details? } }`. Error codes:
  `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`.
- The API is always the source of truth; client-side validation here is a UX
  nicety, not authoritative — the server can still reject.

## Local development

```bash
# API must be running first (port 3001) — see ../ad490-workflow-automator-api
cd ../ad490-workflow-automator-api && npm install && npm run dev

# Then, in this repo (port 3000)
npm install && npm run dev
```

Requires `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_INSTALLATION_ID=YOUR_INSTALL_ID
NEXT_PUBLIC_DEMO_REPOSITORY_ID=YOUR_REPO_ID
```

## Testing

- No automated test suite yet. `docs/smoke-test.md` is the manual regression
  checklist — run it after any significant change (it also covers the API's
  automated tests as a prerequisite step).
- Lint: `npm run lint` (ESLint 9, `eslint.config.mjs`).

## Conventions / gotchas

- Next.js 16 / React 19 / TypeScript — check current API compatibility
  before assuming patterns from older Next docs.
- Don't have UI components call `fetch` or the API directly — always go
  through the hooks in `src/lib/api/hooks/`.
- MVP intentionally excludes: auth, multi-repo dashboards, visual condition
  builder, branching logic, real-time updates (it's refresh-based). Don't
  silently add these — flag scope creep.

## Git / GitHub workflow

- Never commit directly to `main`. Always create a new branch for new work.
- Before opening a PR, read `docs/PR_TEMPLATE.md` and fill it out.
- Commit in logical chunks — group related changes into one commit rather
  than committing every small edit separately.
- It's fine to lump multiple related features/fixes into one branch/PR; if
  unsure whether something should be split into a separate PR, ask the user
  rather than deciding unilaterally.
