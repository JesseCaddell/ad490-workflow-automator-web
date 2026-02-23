// src/components/repos/RepoScopeGate.tsx

"use client";

import type { ReactNode } from "react";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";

type RepoScopeGateProps = {
    children: ReactNode;
    title?: string;
};

export function RepoScopeGate({ children, title = "Repository Required" }: RepoScopeGateProps) {
    const { scope } = useRepoScope();

    const hasValidScope =
        scope.installationId !== 0 && scope.repositoryId !== 0;

    if (!hasValidScope) {
        return (
            <div className="repo-gate">
                <h1>{title}</h1>
                <p className="repo-gate__muted">
                    No repository selected. Configure demo environment variables
                    or select a valid repository.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
