# AD490 Workflow Automator — Web

> 📘 Part of the **AD490 Capstone Project**  
> Project hub / documentation: https://github.com/JesseCaddell/AD490-Capstone

This repository contains the **frontend web application** for the GitHub Workflow Automation SaaS.

The UI allows users to:

- Select a GitHub installation + repository (MVP: demo scope via env)
- Create and manage automation workflows
- Configure triggers and actions
- Validate workflows before submission
- Persist repository selection locally
- Interact with the Flowarden API

The API remains the source of truth for workflow validation and execution.

---

## Current Status (Epic 4 Complete)

We now support:

- Workflow create / edit / delete
- Client-side validation with UX safeguards
- Repository scope selector (demo-ready, future-proofed)
- API integration with proper CORS configuration
- Persistent repo scope via localStorage

This completes Web Workflow Management (Epic 4).

---

## Scope (MVP)

### Repository Scope
- Repo selection from environment-based demo configuration
- Scope stored in React state + localStorage
- All workflow API calls use selected scope

Future:
- Dynamically list installations and repositories from GitHub
- Persist user scope server-side

### Workflow Management
Each workflow includes:

- Name (required)
- Enabled toggle
- Single trigger event (required)
- Ordered list of actions (at least one required)

### Supported Trigger Events

- push
- issue.opened
- issue.assigned
- issue.closed
- issue.reopened
- pull_request.opened
- pull_request.draft
- pull_request.ready
- pull_request.closed
- pull_request.merged
- pull_request_review.changes_requested

### Supported Actions

- addLabel
- addComment
- setProjectStatus

---

## Validation & UX Safeguards (MVP)

Client-side validation prevents obvious errors:

- Required fields enforced (name, trigger, at least one action)
- Action params validated before submit
- Submit lock prevents accidental double-submit
- Delete confirmation prompt
- “Saving…” state during API requests

The API performs final validation.

---

## MVP Constraints

- Single trigger per workflow
- No conditional branching
- No multi-repo dynamic discovery
- No rule prioritization UI
- No YAML generation UI yet

These are intentional MVP limitations.

---

## Tech Stack

- Next.js (React + TypeScript)
- Client-side state management (React hooks)
- Environment-based configuration
- Hosted on Vercel (planned)
- Backend API handles GitHub App + rule evaluation

---

## Local Development

### 1. Configure Environment Variables

Create a `.env.local` file in this repository:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_INSTALLATION_ID=your_installation_id
NEXT_PUBLIC_DEMO_REPOSITORY_ID=your_repository_id
```

### 2. Start the API

In the API repository:

```
npm run dev
```

### 3. Start the Web App

In this repository:

```
npm run dev
```

Then open:

```
http://localhost:3000/workflows
```

---

## Documentation

Additional documentation is located in:

```
/docs
```

Includes:
- Creating a Workflow (MVP guide)
- Example workflows
- MVP constraints and notes
- Expansion planning

---

## Related Repositories

- **Project hub / docs:**  
  https://github.com/JesseCaddell/AD490-Capstone

- **Backend (API + GitHub App):**  
  https://github.com/JesseCaddell/ad490-workflow-automator-api

