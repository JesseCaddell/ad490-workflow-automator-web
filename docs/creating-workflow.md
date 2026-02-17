# Workflow Automator Web (MVP)

This is the web UI for the AD490 Workflow Automator capstone project.

It provides a user interface for creating and managing repository-scoped automation workflows backed by the Workflow Automator API.

---

## Current MVP Capabilities

- Repository scope selection (demo-backed, future-ready)
- List workflows
- Create workflows
- Edit workflows
- Delete workflows
- Client-side validation
- Server-side validation (API source of truth)
- Single-trigger workflows
- Multiple sequential actions (up to 25)

---

## Running the Web App

1. Install dependencies

   npm install

2. Create `.env.local` in project root:

   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001  
   NEXT_PUBLIC_DEMO_INSTALLATION_ID=YOUR_INSTALL_ID  
   NEXT_PUBLIC_DEMO_REPOSITORY_ID=YOUR_REPO_ID

3. Start the dev server

   npm run dev

4. Ensure the API is running on port 3001.

---

## Creating a Workflow

See section below for step-by-step instructions and examples.

---

## Creating a Workflow (MVP)

(Insert the documentation block we wrote earlier.)

---

## Architecture Notes

- All workflows are scoped to `{installationId, repositoryId}`
- Scope selection is persisted in localStorage
- API remains the source of truth for validation
- The UI restricts triggers and action types to supported values

---

## MVP Limitations

- One trigger per workflow
- No conditional logic editor
- No branching
- No multi-repository dashboards
- Demo repository options sourced from environment variables

---

## Future Direction

Planned expansions include:

- Dynamic repository listing from GitHub installations
- Condition builder UI
- Multi-trigger support
- Action preview / simulation
- Server-side user preference persistence
