"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listWorkflows, deleteWorkflow, type Workflow } from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";

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
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "grid", gap: 4 }}>
                    <h1 style={{ margin: 0 }}>Workflows</h1>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                        Repo: {scope.repositoryId} · Install: {scope.installationId}
                    </div>
                </div>

                <Link className="app-nav-link" href="/workflows/new">
                    Create Workflow
                </Link>
            </header>

            <div style={{ height: 16 }} />

            {state === "loading" && <p>Loading workflows...</p>}

            {state === "error" && (
                <div>
                    <p style={{ color: "crimson" }}>Error: {error}</p>
                    <button type="button" onClick={load}>
                        Retry
                    </button>
                </div>
            )}

            {state === "idle" && workflows.length === 0 && (
                <div>
                    <p>No workflows yet.</p>
                    <p style={{ opacity: 0.75 }}>Create your first automation to get started.</p>
                </div>
            )}

            {state === "idle" && workflows.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                        <tr key={wf.id} style={{ borderTop: "1px solid rgba(230,237,243,0.12)" }}>
                            <td>{wf.name}</td>
                            <td>{wf.trigger?.event ?? "-"}</td>
                            <td>{wf.enabled ? "Enabled" : "Disabled"}</td>
                            <td style={{ display: "flex", gap: 8, padding: "8px 0" }}>
                                <Link className="app-nav-link" href={`/workflows/${wf.id}`}>
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(wf.id)}
                                    style={{
                                        border: "1px solid rgba(230,237,243,0.12)",
                                        background: "transparent",
                                        color: "crimson",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </RepoScopeGate>
    );
}
