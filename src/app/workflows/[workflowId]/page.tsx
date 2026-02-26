// src/app/workflows/[workflowId]/page.tsx

"use client";

import Link from "next/link";
import { use } from "react";
import { useEffect, useState } from "react";
import { getWorkflow, type Workflow } from "@/lib/api";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";

type LoadState = "loading" | "error" | "ready";

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

    const [state, setState] = useState<LoadState>("loading");
    const [error, setError] = useState<string | null>(null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    async function load() {
        try {
            setState("loading");
            setError(null);

            const wf = await getWorkflow(scope, workflowId);

            setWorkflow(wf);
            setState("ready");
        } catch (err: any) {
            setError(err?.message ?? "Failed to load workflow.");
            setState("error");
        }
    }

    useEffect(() => {
        load();
    }, [workflowId, scope.installationId, scope.repositoryId]);

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

            {state === "loading" && <LoadingState message="Loading workflow..." />}

            {state === "error" && <ErrorState message={error ?? "Failed to load workflow."} onRetryAction={load} />}

            {state === "ready" && workflow && <WorkflowForm mode="edit" initial={workflow} />}
        </RepoScopeGate>
    );
}