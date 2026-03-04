"use client";

import { useMemo } from "react";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import type { RepoScope } from "@/lib/api";

function scopesEqual(a: RepoScope, b: RepoScope) {
    return a.installationId === b.installationId && a.repositoryId === b.repositoryId;
}

export function RepoSelector() {
    const { scope, setScope, options } = useRepoScope();

    const selectedIndex = useMemo(() => {
        const idx = options.findIndex((opt) => scopesEqual(opt.scope, scope));
        return idx >= 0 ? String(idx) : "0";
    }, [options, scope]);

    // Post-MVP: derive activeLabel here for display in topbar/status
    // when multiple repos are available via GitHub OAuth.
    // const activeLabel = useMemo(() => {
    //     const match = options.find((opt) => scopesEqual(opt.scope, scope));
    //     return match?.label ?? `Repo (${scope.repositoryId})`;
    // }, [options, scope]);

    function onChange(value: string) {
        const idx = Number(value);
        if (!Number.isFinite(idx) || idx < 0 || idx >= options.length) return;

        setScope(options[idx].scope);
    }

    const hasValidSelection = scope.installationId !== 0 && scope.repositoryId !== 0;

    return (
        <div className="repo-selector" aria-label="Repository scope">
            <div className="repo-selector__row">
                <label className="repo-selector__label" htmlFor="repo-selector">
                    Repo
                </label>

                <select
                    id="repo-selector"
                    className="repo-selector__select"
                    value={selectedIndex}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((opt, idx) => (
                        <option key={`${opt.scope.installationId}:${opt.scope.repositoryId}`} value={String(idx)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="repo-selector__status" aria-live="polite">
                {hasValidSelection ? (
                    <span>

          </span>
                ) : (
                    <span className="repo-selector__muted">No repository selected (env missing)</span>
                )}
            </div>
        </div>
    );
}
