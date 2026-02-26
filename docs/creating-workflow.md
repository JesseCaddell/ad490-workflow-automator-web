# Creating a Workflow (MVP)

This document explains how workflows are created and managed in the AD490 Workflow Automator Web application.

The Web app is repository-scoped and backed by the Workflow Automator API. The API is the source of truth for validation and storage.

---

# Before You Start

## 1. Ensure Repository Scope Is Selected

All workflows are scoped to:

- installationId
- repositoryId

You must select a repository before creating or editing workflows.

If no repository is selected:

- Workflow pages are blocked
- API calls will not execute
- CRUD operations are disabled

Scope is persisted in localStorage for the current browser session.

---

# Workflow Model (MVP)

A workflow consists of:

1. Name
2. Description (optional)
3. One trigger
4. One or more sequential actions (up to 25)

### Current MVP Rules

- Only one trigger per workflow
- No conditional branching
- No nested logic editor
- Actions execute sequentially
- Maximum of 25 actions

Validation occurs both:
- Client-side (form validation)
- Server-side (API validation)

The API is authoritative.

---

# Step-by-Step: Creating a Workflow

## Step 1 — Navigate to Workflows

Go to:

/workflows

Click:

"New Workflow"

You will be routed to:

/workflows/new

---

## Step 2 — Fill Out Basic Information

Provide:

- Workflow Name (required)
- Description (optional)

Workflow name must be unique within the selected repository scope.

---

## Step 3 — Select Trigger

Choose one trigger type.

MVP supports a single trigger per workflow.

Examples (depending on backend configuration):

- pull_request.opened
- pull_request.closed
- issues.opened
- push

Trigger values must match backend-supported event types.

---

## Step 4 — Add Actions

Add one or more sequential actions.

Actions execute in order from top to bottom.

Examples (depending on backend implementation):

- addLabel
- removeLabel
- commentOnIssue
- assignUser

You may:

- Add up to 25 actions
- Reorder actions
- Remove actions

Each action requires valid parameters.

---

## Step 5 — Submit

When you click Save:

1. Client performs validation
2. API request is sent to:
   POST /api/workflows
3. Server validates payload
4. On success:
   - You are redirected to workflow list or detail page
5. On failure:
   - Server error is displayed in UI

The API always determines final validity.

---

# Editing a Workflow

Navigate to:

/workflows/{workflowId}

You may:

- Modify name
- Modify trigger
- Add/remove/reorder actions
- Save changes

Update flow:

PUT /api/workflows/:workflowId

Server validates and returns updated workflow.

---

# Deleting a Workflow

From the workflow detail page or list:

DELETE /api/workflows/:workflowId

After deletion:

- Workflow list refreshes
- Workflow is permanently removed within that repository scope

---

# How Repository Scope Affects Workflows

Workflows are isolated per repository.

This means:

- Switching repository changes visible workflows
- Workflow IDs are only valid within their repository scope
- You cannot access workflows across repositories

The backend enforces isolation.

---

# Workflow Execution (High-Level)

The Web UI only manages workflow configuration.

Execution happens in the backend:

1. GitHub webhook received
2. Backend normalizes event
3. Rules are evaluated
4. Matching workflow actions execute

The Web UI does not execute workflows.

---

# Error Handling

The UI supports the following states:

- Loading
- Empty
- Validation error
- Server error

All API errors are normalized through the API client layer.

If the server rejects a workflow:

- The workflow is not created
- The UI displays the server response

---

# MVP Limitations (Workflow Builder)

- No multi-trigger workflows
- No AND/OR condition builder
- No nested logic groups
- No visual workflow graph
- No dry-run simulation
- No workflow version history
- No audit timeline per workflow

---

# Future Enhancements

Planned improvements include:

- Multiple entry triggers (OR) for compatible event types (e.g., PR events)
- Condition builder UI (form-based, no graph editor)
- Workflow execution history per repository
- Versioning / rollback
- Multi-repository dashboard

---

# Architecture Reminder

UI Layer:
src/app/**
src/components/**

API Client Layer:
src/lib/api/**

Scope Management:
src/lib/repoScope/**
src/components/repos/**

The API remains the single source of truth.