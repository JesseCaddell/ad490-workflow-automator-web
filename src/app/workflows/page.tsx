// src/app/workflows/page.tsx

"use client";

import Link from "next/link";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { useDeleteWorkflow, useWorkflowsList } from "@/lib/api/hooks/useWorkflows";

export default function WorkflowsPage() {
    const { scope } = useRepoScope();
    const { workflows, state, error, reload } = useWorkflowsList(scope);
    const { remove } = useDeleteWorkflow(scope);

    async function handleDelete(id: string) {
        const confirmed = window.confirm("Delete this workflow?");
        if (!confirmed) return;

        try {
            await remove(id);
            await reload();
        } catch (err: any) {
            alert(err?.message ?? "Failed to delete workflow.");
        }
    }

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
                {state === "loading" && (
                    <p className="workflows-page__status">Loading workflows...</p>
                )}

                {state === "error" && (
                    <div className="workflows-page__error">
                        <p className="workflows-page__errorText">Error: {error}</p>
                        <button type="button" onClick={reload} className="workflows-page__retry">
                            Retry
                        </button>
                    </div>
                )}

                {state === "success" && workflows.length === 0 && (
                    <div className="workflows-page__empty">
                        <p className="workflows-page__emptyTitle">No workflows yet.</p>
                        <p className="workflows-page__emptyBody">
                            Create your first automation to get started.
                        </p>
                    </div>
                )}

                {state === "success" && workflows.length > 0 && (
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