import { RepoScopeGate } from "@/components/repos/RepoScopeGate";
import { WorkflowForm } from "@/components/workflows/WorkflowForm";

export default function NewWorkflowPage() {
    return (
        <RepoScopeGate title="Create Workflow">
            <h1>Create Workflow</h1>
            <WorkflowForm mode="create" />
        </RepoScopeGate>
    );
}
