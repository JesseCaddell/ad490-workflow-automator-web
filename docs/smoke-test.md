# Smoke Test Checklist

Manual verification steps for Flowarden MVP. Run after any significant changes.

## Prerequisites

- API running locally (`npm run dev` in `ad490-workflow-automator-api`)
- Web running locally (`npm run dev` in `ad490-workflow-automator-web`)
- `.env` configured with valid demo installation/repository IDs and webhook secret
- ngrok not required for smoke testing (only needed for live webhook delivery)

## API — Automated Tests

Run `npm run build && node --test "dist/**/*.test.js"` and confirm all tests pass.

## Web — Manual Flows

### Navigation & Layout

- [ ] Root `/` redirects to `/dashboard`
- [ ] Sidebar links navigate correctly (Dashboard, Workflows)
- [ ] Disabled sidebar items (Logs, Settings) are non-interactive

### Repo Scope

- [ ] RepoSelector displays demo repo option
- [ ] Pages behind RepoScopeGate show gate message when scope is invalid

### Workflows — List

- [ ] `/workflows` loads and displays existing workflows (or empty state if none)
- [ ] "Create Workflow" button navigates to `/workflows/new`
- [ ] Toggle switches enabled/disabled instantly (optimistic update)
- [ ] Toggle label text changes between "Enabled" and "Disabled"
- [ ] Delete shows confirmation buttons, "Cancel" dismisses, "Confirm" removes workflow
- [ ] List reloads after delete

### Workflows — Create

- [ ] `/workflows/new` renders the form with default values
- [ ] Name validation fires on blur (required)
- [ ] Trigger event pills are selectable
- [ ] Actions can be added, removed, reordered (Up/Down)
- [ ] Action type change resets params to defaults
- [ ] Submit with valid data creates workflow and redirects to list
- [ ] "Create more" checkbox keeps form open after successful create
- [ ] Submit with invalid data shows inline errors

### Workflows — Edit

- [ ] `/workflows/:id` loads existing workflow into form
- [ ] Toggle reflects and updates enabled/disabled state with label change
- [ ] Save changes persists updates
- [ ] "Back to Workflows" returns to list

### Error States

- [ ] Stop the API server, reload `/workflows` — error state with retry button appears
- [ ] Click retry after restarting API — list loads successfully