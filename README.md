# AD490 Workflow Automator — Web

> 📘 Part of the **AD490 Capstone Project**  
> Project hub / documentation: https://github.com/JesseCaddell/AD490-Capstone

This repository contains the **frontend web application** for the AD490 Workflow Automator SaaS.

The app provides a repository-scoped UI for creating, editing, and managing automation workflows backed by the Workflow Automator API.

---

# Project Overview

The Web application is a Next.js (App Router) frontend that:

- Enforces repository-level scope
- Communicates with the backend API through a dedicated client layer
- Manages workflow CRUD operations
- Provides a minimal dashboard UI for interacting with workflows

This repository does **not** communicate directly with GitHub.  
All GitHub operations are handled by the backend API.

---

# Architecture Overview

## 1. Repository Scope Model

All workflows are scoped to:

- `installationId`
- `repositoryId`

The active repository scope is required before workflows can be viewed or modified.

### How Scope Works

- Scope is selected via the Repo Selector UI
- Scope is stored in localStorage
- Scope is injected into API requests
- The backend enforces isolation between repositories

If no repository is selected, workflow pages are blocked.

This ensures that:
- Workflows from one repository cannot leak into another
- All CRUD operations remain tenant-safe

---

## 2. Routing Structure (Next.js App Router)

Routes live under:

```
src/app/**
```

Key pages:

- `/dashboard`
- `/workflows`
- `/workflows/new`
- `/workflows/[workflowId]`

Layout components:

```
src/components/layout/**
```

Workflow UI components:

```
src/components/workflows/**
```

Repository scope components:

```
src/components/repos/**
```

---

## 3. API Client Layer

All HTTP communication is isolated in:

```
src/lib/api/**
```

Important files:

- `http.ts` — base request wrapper
- `workflowsClient.ts` — workflow CRUD calls
- `workflowTypes.ts` — request/response types
- `apiError.ts` — normalized error handling
- `hooks/useWorkflows.ts` — UI-facing workflow hook

### Design Principle

UI components **never call fetch directly**.

Instead:

Page → Hook → Client → HTTP wrapper → API

This keeps:
- API logic centralized
- Error handling consistent
- Future refactors isolated

---

# Workflow CRUD Flow (End-to-End)

1. User selects repository scope
2. Workflows page loads
3. Client calls API with `{installationId, repositoryId}`

## List Workflows
GET `/api/workflows`
→ Renders loading / empty / list state

## Create Workflow
POST `/api/workflows`
→ Validated server-side
→ Redirect to list or detail page

## Edit Workflow
PUT `/api/workflows/:workflowId`
→ Server validates
→ UI refreshes

## Delete Workflow
DELETE `/api/workflows/:workflowId`
→ List refreshes

The API is always the source of truth.

---

# Local Development

## Prerequisites

- Node.js (LTS recommended)
- Backend API running locally

Backend repository:
https://github.com/JesseCaddell/ad490-workflow-automator-api

---

## Environment Variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_INSTALLATION_ID=YOUR_INSTALL_ID
NEXT_PUBLIC_DEMO_REPOSITORY_ID=YOUR_REPO_ID
```

Notes:

- `NEXT_PUBLIC_API_BASE_URL` must match your backend port.
- Demo values are used for MVP scope selection.

---

## Install and Run

```
npm install
npm run dev
```

Then open:

```
http://localhost:3000
```

Ensure the API is running on port 3001.

---

# MVP Capabilities

- Repository scope selection
- List workflows
- Create workflows
- Edit workflows
- Delete workflows
- Client-side validation
- Server-side validation
- Single-trigger workflows
- Multiple sequential actions (up to 25)

---

# Known MVP Limitations

- One trigger per workflow
- No visual condition builder
- No branching logic editor
- No multi-repository dashboards
- No authentication in web layer (assumes trusted demo)
- Demo repository values sourced from environment variables
- No real-time update feed (refresh-based)

---

# Future Direction

- Dynamic GitHub installation + repo discovery
- Multi-trigger workflows
- Condition builder UI
- Workflow simulation / preview engine
- Persistent user settings
- Audit log expansion
- Authenticated multi-user SaaS model

---

# Related Repositories

- **Project hub / documentation:**  
  https://github.com/JesseCaddell/AD490-Capstone

- **Backend (API + GitHub App):**  
  https://github.com/JesseCaddell/ad490-workflow-automator-api