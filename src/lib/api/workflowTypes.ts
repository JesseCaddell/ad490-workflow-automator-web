export type WorkflowId = string;

export type WorkflowScope = {
    installationId: number;
    repositoryId: number;
};

export type Workflow = {
    id: WorkflowId;
    name: string;
    enabled: boolean;

    scope: WorkflowScope;

    trigger: { event: string };
    steps: unknown[];

    description?: string;

    metadata?: Record<string, unknown>;
};

export type CreateWorkflowPayload = {
    name: string;
    trigger: { event: string };
    steps?: unknown[];
    description?: string;
    enabled?: boolean;
};

export type PatchWorkflowPayload = {
    name?: string;
    description?: string;
    enabled?: boolean;
};
