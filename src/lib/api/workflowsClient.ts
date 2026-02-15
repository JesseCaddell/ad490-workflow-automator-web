import { requestApi, type RepoScope } from "./http";
import type {
    Workflow,
    WorkflowId,
    CreateWorkflowPayload,
    PatchWorkflowPayload,
} from "./workflowTypes";

export async function listWorkflows(scope: RepoScope): Promise<Workflow[]> {
    return requestApi<Workflow[]>({
        method: "GET",
        path: "/api/workflows",
        scope,
    });
}

export async function getWorkflow(scope: RepoScope, id: WorkflowId): Promise<Workflow> {
    return requestApi<Workflow>({
        method: "GET",
        path: `/api/workflows/${encodeURIComponent(id)}`,
        scope,
    });
}

export async function createWorkflow(
    scope: RepoScope,
    payload: CreateWorkflowPayload
): Promise<Workflow> {
    return requestApi<Workflow>({
        method: "POST",
        path: "/api/workflows",
        scope,
        body: payload,
    });
}

export async function updateWorkflow(
    scope: RepoScope,
    id: WorkflowId,
    payload: PatchWorkflowPayload
): Promise<Workflow> {
    return requestApi<Workflow>({
        method: "PATCH",
        path: `/api/workflows/${encodeURIComponent(id)}`,
        scope,
        body: payload,
    });
}

export async function deleteWorkflow(scope: RepoScope, id: WorkflowId): Promise<void> {
    return requestApi<void>({
        method: "DELETE",
        path: `/api/workflows/${encodeURIComponent(id)}`,
        scope,
    });
}
