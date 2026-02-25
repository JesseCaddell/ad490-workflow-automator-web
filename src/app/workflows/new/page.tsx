// src/app/workflows/new/page.tsx

import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewWorkflowPage() {
    return (
        <RepoScopeGate title="Create Workflow">
            <PageHeader title="Create Workflow" />
            <WorkflowForm mode="create" />
        </RepoScopeGate>
    );
}