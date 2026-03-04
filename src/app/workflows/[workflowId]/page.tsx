// src/app/workflows/[workflowId]/page.tsx

"use client";

import Link from "next/link";
import { use } from "react";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";
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
    const { workflow, state, error, reload } = useWorkflow(scope, workflowId);

    return (
        <RepoScopeGate title="Edit Workflow">
            <PageHeader
                title="Edit Workflow"
                rightSlot={
                    <Link className="btn btn--primary" href="/workflows">
                        Back to Workflows
                    </Link>
                }
            />

            {(state === "idle" || state === "loading") && (
                <LoadingState message="Loading workflow..." />
            )}

            {state === "error" && (
                <ErrorState
                    message={error ?? "Failed to load workflow."}
                    onRetryAction={reload}
                />
            )}

            {state === "success" && workflow && (
                <WorkflowForm mode="edit" initial={workflow} />
            )}
        </RepoScopeGate>
    );
}