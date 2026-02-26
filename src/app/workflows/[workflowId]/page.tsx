// src/app/workflows/[workflowId]/page.tsx

"use client";

import Link from "next/link";
import { use } from "react";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { useWorkflow } from "@/lib/api/hooks/useWorkflows";

type Props = {
    params: Promise<{ workflowId: string }> | { workflowId: string };
};

export default function EditWorkflowPage({ params }: Props) {
    const resolvedParams =
        typeof (params as any)?.then === "function"
            ? use(params as Promise<{ workflowId: string }>)
            : (params as { workflowId: string });

    const workflowId = resolvedParams.workflowId;
    const { scope } = useRepoScope();

    const { workflow, state, error } = useWorkflow(scope, workflowId);

    return (
        <RepoScopeGate title="Edit Workflow">
            <PageHeader
                title="Edit Workflow"
                rightSlot={
                    <Link className="app-nav-link" href="/workflows">
                        Back to Workflows
                    </Link>
                }
            />

            {state === "loading" && <p>Loading...</p>}

            {state === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

            {state === "success" && workflow && (
                <WorkflowForm mode="edit" initial={workflow} />
            )}
        </RepoScopeGate>
    );
}