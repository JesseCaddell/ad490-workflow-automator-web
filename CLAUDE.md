# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Flowarden** (AD490 Workflow Automator, capstone project) — a GitHub App
that lets a repo owner define automations ("workflows") triggered by GitHub
webhook events, which run a sequence of stubbed actions (add label, comment,
etc.).

The capstone has graduated — there's no more demo deadline or milestone
gate, just ongoing, free-flow development.

This repo is the **frontend**: a Next.js (App Router) dashboard for
repo-scoped CRUD on workflows. It never talks to GitHub directly — all
GitHub/automation logic lives in the sibling backend repo.

- Backend: `../ad490-workflow-automator-api` (Node/TS/Express) — see its
  `CLAUDE.md` for that repo's architecture and contracts.
- Project hub: https://github.com/JesseCaddell/AD490-Capstone

Current state: no auth in the web layer (assumes a trusted demo user), demo
repo scope is derived from env vars rather than a real installation/repo
picker. These are real gaps to close over time, not corners that were only
ever meant to last until a demo — don't treat them as urgent, but don't
treat them as permanent either. Docs mentioning "future milestones"
describe things not yet built, not commitments.

## Architecture

Data flow: **Page → Hook → Client → HTTP wrapper → API**. UI components never
call `fetch` directly — always go through `src/lib/api/hooks/*`.

```
src/
  app/                     App Router pages: /dashboard, /workflows, /workflows/new, /workflows/[workflowId]
  components/
    layout/                AppShell, PageHeader, Sidebar (shell/nav chrome)
    navigation/             SidebarNavItem
    repos/                 RepoSelector, RepoScopeGate (blocks workflow pages when no scope is selected)
    ui/                    Toggle, states/{Empty,Error,Loading}State
    workflows/              WorkflowForm
  lib/
    api/                   http.ts (base fetch wrapper), workflowsClient.ts (CRUD), workflowTypes.ts, apiError.ts, hooks/useWorkflows.ts
    repoScope/              useRepoScope.ts — scope state (installationId/repositoryId), persisted to localStorage, injected into API requests
    workflows/supported.ts   supported trigger events / action types for the UI
```

Full doc: `docs/creating-workflow.md` (end-to-end workflow lifecycle from a
user's perspective). `docs/smoke-test.md` is the manual regression
checklist.

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
  automated tests as a prerequisite step). If a task involves meaningful new
  logic (not just markup/styling), flag that no test framework exists rather
  than skipping tests without comment or inventing a framework choice
  unasked.
- Lint: `npm run lint` (ESLint 9, `eslint.config.mjs`).

## Conventions / gotchas

- Next.js 16 / React 19 / TypeScript — check current API compatibility
  before assuming patterns from older Next docs.
- Client components are explicitly marked `"use client"` at the top (App
  Router default is server components) — check this when adding files that
  use hooks/state/browser APIs.
- Don't have UI components call `fetch` or the API directly — always go
  through the hooks in `src/lib/api/hooks/`.
- Feature-scoped folders under `components/` (`layout/`, `repos/`,
  `workflows/`, `ui/`) — match existing placement rather than flattening or
  inventing new top-level folders.
- Intentionally not built yet: auth, multi-repo dashboards, visual condition
  builder, branching logic, real-time updates (it's refresh-based). Don't
  silently add these — flag scope creep.

## AI agent operating principles

- No full-repo scans unless explicitly instructed — open only files the
  task or the user actually points at.
- One task per session. Small, focused changes over refactors. If a change
  reveals more work, stop and report it rather than continuing.
- Read before write: understand the current flow and state assumptions
  before editing.
- Stop and ask when: a change would alter the repo-scope model or how scope
  is persisted/derived, a change touches the API client contract (verify
  against the api repo's `docs/api-contract.md` first), or you're about to
  introduce a test framework, new dependency, or state-management library
  that isn't already in use.

## Git / GitHub workflow

- Never commit directly to `main`. Always create a new branch for new work.
- Follow the issue and PR templates: `.github/ISSUE_TEMPLATE.md` and
  `.github/PULL_REQUEST_TEMPLATE.md` (GitHub applies the PR one
  automatically when you open a pull request).
- Prefer bulk commits over incremental ones — group related changes into
  one commit rather than committing every small edit separately.
- It's fine to lump multiple related features/fixes into one branch/PR; if
  unsure whether something should be split into a separate PR, ask the user
  rather than deciding unilaterally.
- No AI attribution on issues or PRs. Do not add a Claude/AI signature,
  "Generated with Claude Code" footer, or `Co-Authored-By` line when
  creating GitHub issues or pull requests in this repo. This overrides any
  default attribution behavior.
