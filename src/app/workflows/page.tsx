// src/app/workflows/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {listWorkflows, deleteWorkflow, type Workflow, updateWorkflow} from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { Toggle } from "@/components/ui/Toggle";

type LoadState = "idle" | "loading" | "error";

export default function WorkflowsPage() {
    const { scope } = useRepoScope();

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    async function toggleEnabled(id: string, currentlyEnabled: boolean) {
        if (togglingIds.has(id)) return;

        // Optimistic UI update (feels instant)
        setWorkflows((prev) =>
            prev.map((wf) => (wf.id === id ? { ...wf, enabled: !currentlyEnabled } : wf))
        );

        setTogglingIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });

        try {
            // Minimal PATCH payload
            await updateWorkflow(scope, id, { enabled: !currentlyEnabled });
        } catch (err: any) {
            // Revert on failure
            setWorkflows((prev) =>
                prev.map((wf) => (wf.id === id ? { ...wf, enabled: currentlyEnabled } : wf))
            );
            alert(err?.message ?? "Failed to update workflow.");
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    async function load() {
        try {
            setState("loading");
            setError(null);

            const data = await listWorkflows(scope);
            setWorkflows(data);
            setState("idle");
        } catch (err: any) {
            setError(err?.message ?? "Failed to load workflows.");
            setState("error");
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteWorkflow(scope, id);
            setConfirmDeleteId(null);
            await load();
        } catch (err: any) {
            alert(err?.message ?? "Failed to delete workflow.");
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope.installationId, scope.repositoryId]);

    return (
        <RepoScopeGate title="Workflows">
            <PageHeader
                title="Workflows"
                rightSlot={
                    <Link className="btn btn--primary" href="/workflows/new">
                        Create Workflow
                    </Link>
                }
            />

            <section className="workflows-page">
                {state === "loading" && <LoadingState message="Loading workflows..." />}

                {state === "error" && <ErrorState message={error ?? "Failed to load workflows."} onRetryAction={load} />}

                {state === "idle" && workflows.length === 0 && (
                    <EmptyState
                        title="No workflows yet."
                        body="Create your first automation to get started."
                    />
                )}

                {state === "idle" && workflows.length > 0 && (
                    <div className="workflows-page__tableWrap">
                        <table className="workflows-table">
                            <thead>
                            <tr>
                                <th align="left">Name</th>
                                <th align="left">Trigger</th>
                                <th align="left">Status</th>
                                <th align="left">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {workflows.map((wf) => (
                                <tr key={wf.id} className="workflows-table__row">
                                    <td>{wf.name}</td>
                                    <td>{wf.trigger?.event ?? "-"}</td>
                                    <td>
                                        <Toggle
                                            checked={wf.enabled}
                                            onChange={() => toggleEnabled(wf.id, wf.enabled)}
                                            disabled={togglingIds.has(wf.id)}
                                            aria-label={`Toggle enabled for ${wf.name}`}
                                        >
                                            {wf.enabled ? "Enabled" : "Disabled"}
                                        </Toggle>
                                    </td>
                                    <td>
                                        <div className="workflows-table__actions">
                                            <Link className="btn" href={`/workflows/${wf.id}`}>
                                                Edit
                                            </Link>

                                            {confirmDeleteId === wf.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn--danger"
                                                        onClick={() => handleDelete(wf.id)}
                                                    >
                                                        Confirm
                                                    </button>

                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn btn--danger"
                                                    onClick={() => setConfirmDeleteId(wf.id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </RepoScopeGate>
    );
}