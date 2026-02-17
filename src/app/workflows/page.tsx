"use client";

import { useEffect, useState } from "react";
import { listWorkflows, deleteWorkflow, type Workflow } from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoSelector } from "@/components/repos/RepoSelector";

type LoadState = "idle" | "loading" | "error";

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    const { scope, setScope, options } = useRepoScope();

    async function load() {
        try {
            setState("loading");
            setError(null);
            const data = await listWorkflows(scope);
            setWorkflows(data);
            setState("idle");
        } catch (err: any) {
            setError(err.message ?? "Failed to load workflows.");
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
            alert(err.message ?? "Failed to delete workflow.");
        }
    }

    useEffect(() => {
        load();
    }, [scope.installationId, scope.repositoryId]);

    return (
        <main style={{ padding: "2rem" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                }}
            >
                <div style={{ display: "grid", gap: "0.25rem" }}>
                    <h1 style={{ margin: 0 }}>Workflows</h1>
                    <div style={{ color: "#666" }}>
                        Selected: repo {scope.repositoryId} (install {scope.installationId})
                    </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <RepoSelector value={scope} options={options} onChangeAction={setScope} />
                    <button onClick={() => (window.location.href = "/workflows/new")}>
                        Create Workflow
                    </button>
                </div>
            </header>

            {state === "loading" && <p>Loading workflows...</p>}

            {state === "error" && (
                <div>
                    <p style={{ color: "red" }}>Error: {error}</p>
                    <button onClick={load}>Retry</button>
                </div>
            )}

            {state === "idle" && workflows.length === 0 && (
                <div>
                    <p>No workflows yet.</p>
                    <p>Create your first automation to get started.</p>
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
                        <tr key={wf.id} style={{ borderTop: "1px solid #ddd" }}>
                            <td>{wf.name}</td>
                            <td>{wf.trigger?.event}</td>
                            <td>{wf.enabled ? "Enabled" : "Disabled"}</td>
                            <td>
                                <button onClick={() => (window.location.href = `/workflows/${wf.id}`)}>
                                    Edit
                                </button>{" "}
                                <button onClick={() => handleDelete(wf.id)} style={{ color: "red" }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}
