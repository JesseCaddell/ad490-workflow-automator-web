// src/lib/api/hooks/useWorkflows.ts

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RepoScope, Workflow, WorkflowId, CreateWorkflowPayload, PatchWorkflowPayload } from "@/lib/api";
import { createWorkflow, deleteWorkflow, getWorkflow, listWorkflows, updateWorkflow } from "@/lib/api";

type AsyncState = "idle" | "loading" | "success" | "error";

type AsyncResult<T> = {
    state: AsyncState;
    data: T | null;
    error: string | null;
};

function scopeKey(scope: RepoScope): string {
    return `${String(scope.installationId)}:${String(scope.repositoryId)}`;
}

/**
 * Basic stale-response guard:
 * every new request increments a counter; only the latest request can commit state.
 */
function useStaleGuard() {
    const reqIdRef = useRef(0);

    const next = useCallback(() => {
        reqIdRef.current += 1;
        return reqIdRef.current;
    }, []);

    const isLatest = useCallback((id: number) => id === reqIdRef.current, []);

    return { next, isLatest };
}

/**
 * List Workflows
 */
export function useWorkflowsList(scope: RepoScope) {
    const { next, isLatest } = useStaleGuard();
    const key = useMemo(() => scopeKey(scope), [scope]);

    const [result, setResult] = useState<AsyncResult<Workflow[]>>({
        state: "idle",
        data: null,
        error: null,
    });

    const reload = useCallback(async () => {
        const id = next();
        setResult((prev) => ({
            state: "loading",
            data: prev.data,
            error: null,
        }));

        try {
            const data = await listWorkflows(scope);
            if (!isLatest(id)) return;
            setResult({ state: "success", data, error: null });
        } catch (err: any) {
            if (!isLatest(id)) return;
            setResult({
                state: "error",
                data: null,
                error: err?.message ?? "Failed to load workflows.",
            });
        }
    }, [scope, next, isLatest]);

    useEffect(() => {
        // auto-load on scope change
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return {
        workflows: result.data ?? [],
        state: result.state,
        error: result.error,
        reload,
        hasLoaded: result.state === "success" || result.state === "error",
    };
}

/**
 * Get single Workflow
 */
export function useWorkflow(scope: RepoScope, workflowId: WorkflowId) {
    const { next, isLatest } = useStaleGuard();
    const key = useMemo(() => `${scopeKey(scope)}:${workflowId}`, [scope, workflowId]);

    const [result, setResult] = useState<AsyncResult<Workflow>>({
        state: "idle",
        data: null,
        error: null,
    });

    const reload = useCallback(async () => {
        const id = next();
        setResult((prev) => ({
            state: "loading",
            data: prev.data,
            error: null,
        }));

        try {
            const data = await getWorkflow(scope, workflowId);
            if (!isLatest(id)) return;
            setResult({ state: "success", data, error: null });
        } catch (err: any) {
            if (!isLatest(id)) return;
            setResult({
                state: "error",
                data: null,
                error: err?.message ?? "Failed to load workflow.",
            });
        }
    }, [scope, workflowId, next, isLatest]);

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return {
        workflow: result.data,
        state: result.state,
        error: result.error,
        reload,
        hasLoaded: result.state === "success" || result.state === "error",
    };
}

/**
 * Create / Update / Delete mutations
 * (simple, typed, provides loading + error)
 */
type MutationState = {
    isLoading: boolean;
    error: string | null;
};

export function useCreateWorkflow(scope: RepoScope) {
    const [m, setM] = useState<MutationState>({ isLoading: false, error: null });

    const mutate = useCallback(
        async (payload: CreateWorkflowPayload) => {
            setM({ isLoading: true, error: null });
            try {
                const wf = await createWorkflow(scope, payload);
                setM({ isLoading: false, error: null });
                return wf;
            } catch (err: any) {
                setM({ isLoading: false, error: err?.message ?? "Failed to create workflow." });
                throw err;
            }
        },
        [scope]
    );

    return { create: mutate, isLoading: m.isLoading, error: m.error };
}

export function useUpdateWorkflow(scope: RepoScope) {
    const [m, setM] = useState<MutationState>({ isLoading: false, error: null });

    const mutate = useCallback(
        async (id: WorkflowId, payload: PatchWorkflowPayload) => {
            setM({ isLoading: true, error: null });
            try {
                const wf = await updateWorkflow(scope, id, payload);
                setM({ isLoading: false, error: null });
                return wf;
            } catch (err: any) {
                setM({ isLoading: false, error: err?.message ?? "Failed to update workflow." });
                throw err;
            }
        },
        [scope]
    );

    return { update: mutate, isLoading: m.isLoading, error: m.error };
}

export function useDeleteWorkflow(scope: RepoScope) {
    const [m, setM] = useState<MutationState>({ isLoading: false, error: null });

    const mutate = useCallback(
        async (id: WorkflowId) => {
            setM({ isLoading: true, error: null });
            try {
                await deleteWorkflow(scope, id);
                setM({ isLoading: false, error: null });
            } catch (err: any) {
                setM({ isLoading: false, error: err?.message ?? "Failed to delete workflow." });
                throw err;
            }
        },
        [scope]
    );

    return { remove: mutate, isLoading: m.isLoading, error: m.error };
}