"use client";

import { useEffect, useState } from "react";
import { getWorkflow, type Workflow } from "@/lib/api";
import { getDemoScope } from "@/lib/demo/demoScope";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";

type LoadState = "loading" | "error" | "ready";

export default function EditWorkflowPage({
                                             params,
                                         }: {
    params: { workflowId: string };
}) {
    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState<string | null>(null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setState("loading");
                setError(null);
                const scope = getDemoScope();
                const wf = await getWorkflow(scope, params.workflowId);
                setWorkflow(wf);
                setState("ready");
            } catch (err: any) {
                setError(err?.message ?? "Failed to load workflow.");
                setState("error");
            }
        }

        load();
    }, [params.workflowId]);

    return (
        <main style={{ padding: "2rem" }}>
            <h1>Edit Workflow</h1>

            {state === "loading" && <p>Loading...</p>}

            {state === "error" && (
                <div>
                    <p style={{ color: "red" }}>Error: {error}</p>
                </div>
            )}

            {state === "ready" && workflow && (
                <WorkflowForm mode="edit" initial={workflow} />
            )}
        </main>
    );
}
