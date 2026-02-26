// src/app/workflows/new/page.tsx

import Link from "next/link";
import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewWorkflowPage() {
    return (
        <RepoScopeGate title="Create Workflow">
            <PageHeader
                title="Create Workflow"
                rightSlot={
                    <Link className="btn btn--primary" href="/workflows">
                        Back to Workflows
                    </Link>
                }
            />

            <WorkflowForm mode="create" />
        </RepoScopeGate>
    );
}