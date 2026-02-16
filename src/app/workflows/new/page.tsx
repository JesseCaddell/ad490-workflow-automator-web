// src/app/workflows/new/page.tsx

import { WorkflowForm } from "@/components/workflows/WorkflowForm";

export default function NewWorkflowPage() {
    return (
        <main style={{ padding: "2rem" }}>
            <h1>Create Workflow</h1>
            <WorkflowForm mode="create" />
        </main>
    );
}
