//src/components/layout/PageHeader.tsx

"use client";

import type { ReactNode } from "react";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { RepoSelector } from "@/components/repos/RepoSelector";

type PageHeaderProps = {
    title: string;
    rightSlot?: ReactNode;
    centerSlot?: ReactNode;
    subtitleOverride?: string;
};

export function PageHeader({
                               title,
                               rightSlot,
                               centerSlot,
                               subtitleOverride,
                           }: PageHeaderProps) {
    const { scope } = useRepoScope();

    const subtitle =
        subtitleOverride ??
        `Repo: ${scope.repositoryId} · Install: ${scope.installationId}`;

    return (
        <header className="page-header">
            <div className="page-header__inner">
                <div className="page-header__left">
                    <h1 className="page-header__title">{title}</h1>
                    <div className="page-header__meta">
                        <span className="page-header__chip">{subtitle}</span>
                    </div>
                </div>

                <div className="page-header__center">
                    {centerSlot ?? <RepoSelector />}
                </div>

                <div className="page-header__right">{rightSlot ?? null}</div>
            </div>
        </header>
    );
}