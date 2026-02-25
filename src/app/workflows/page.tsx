// src/app/workflows/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listWorkflows, deleteWorkflow, type Workflow } from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";

type LoadState = "idle" | "loading" | "error";

export default function WorkflowsPage() {
    const { scope } = useRepoScope();

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

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
        const confirmed = window.confirm("Delete this workflow?");
        if (!confirmed) return;

        try {
            await deleteWorkflow(scope, id);
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
                    <Link className="app-nav-link" href="/workflows/new">
                        Create Workflow
                    </Link>
                }
            />

            <section className="workflows-page">
                {state === "loading" && <p className="workflows-page__status">Loading workflows...</p>}

                {state === "error" && (
                    <div className="workflows-page__error">
                        <p className="workflows-page__errorText">Error: {error}</p>
                        <button type="button" onClick={load} className="workflows-page__retry">
                            Retry
                        </button>
                    </div>
                )}

                {state === "idle" && workflows.length === 0 && (
                    <div className="workflows-page__empty">
                        <p className="workflows-page__emptyTitle">No workflows yet.</p>
                        <p className="workflows-page__emptyBody">
                            Create your first automation to get started.
                        </p>
                    </div>
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
                                    <td>{wf.enabled ? "Enabled" : "Disabled"}</td>
                                    <td>
                                        <div className="workflows-table__actions">
                                            <Link className="app-nav-link" href={`/workflows/${wf.id}`}>
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(wf.id)}
                                                className="workflows-table__delete"
                                            >
                                                Delete
                                            </button>
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