"use client";

import { useEffect, useState } from "react";
import {
    listWorkflows,
    deleteWorkflow,
    type Workflow,
} from "@/lib/api";

import { getDemoScope } from "@/lib/demo/demoScope";

type LoadState = "idle" | "loading" | "error";

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    const scope = getDemoScope();

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
    }, []);

    return (
        <main style={{ padding: "2rem" }}>
            <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h1>Workflows</h1>
                <button onClick={() => alert("Navigate to create page (next issue)")}>
                    Create Workflow
                </button>
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
                            <td>
                                {wf.enabled ? (
                                    <span style={{ color: "green" }}>Enabled</span>
                                ) : (
                                    <span style={{ color: "gray" }}>Disabled</span>
                                )}
                            </td>
                            <td>
                                <button
                                    onClick={() =>
                                        alert(`Navigate to edit page for ${wf.id} (next issue)`)
                                    }
                                >
                                    Edit
                                </button>
                                {" "}
                                <button
                                    onClick={() => handleDelete(wf.id)}
                                    style={{ color: "red" }}
                                >
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
