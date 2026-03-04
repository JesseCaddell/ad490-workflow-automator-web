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
 * Generic mutation hook — shared loading/error/try-catch pattern.
 * TArgs is the tuple of arguments the mutation function accepts.
 * TResult is the return type on success.
 */
function useMutation<TArgs extends unknown[], TResult = void>(
    fn: (...args: TArgs) => Promise<TResult>,
    fallbackError: string
) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(
        async (...args: TArgs): Promise<TResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fn(...args);
                setIsLoading(false);
                return result;
            } catch (err: any) {
                setIsLoading(false);
                setError(err?.message ?? fallbackError);
                throw err;
            }
        },
        [fn, fallbackError]
    );

    return { mutate, isLoading, error };
}

/**
 * Create / Update / Delete mutations
 */
export function useCreateWorkflow(scope: RepoScope) {
    const fn = useCallback(
        (payload: CreateWorkflowPayload) => createWorkflow(scope, payload),
        [scope]
    );

    const { mutate, isLoading, error } = useMutation(fn, "Failed to create workflow.");
    return { create: mutate, isLoading, error };
}

export function useUpdateWorkflow(scope: RepoScope) {
    const fn = useCallback(
        (id: WorkflowId, payload: PatchWorkflowPayload) => updateWorkflow(scope, id, payload),
        [scope]
    );

    const { mutate, isLoading, error } = useMutation(fn, "Failed to update workflow.");
    return { update: mutate, isLoading, error };
}

export function useDeleteWorkflow(scope: RepoScope) {
    const fn = useCallback(
        (id: WorkflowId) => deleteWorkflow(scope, id),
        [scope]
    );

    const { mutate, isLoading, error } = useMutation(fn, "Failed to delete workflow.");
    return { remove: mutate, isLoading, error };
}