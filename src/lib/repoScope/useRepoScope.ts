"use client";

import { useEffect, useMemo, useState } from "react";
import type { RepoScope } from "@/lib/api";

const STORAGE_KEY = "flowarden:selectedRepoScope";

type RepoOption = {
    label: string;
    scope: RepoScope;
};

/**
 * DEMO IMPLEMENTATION NOTE:
 *
 * For MVP/demo, we derive a single repository option from
 * NEXT_PUBLIC_DEMO_INSTALLATION_ID and NEXT_PUBLIC_DEMO_REPOSITORY_ID.
 *
 * In production:
 *  - Replace getDemoRepoOptionsFromEnv() with a call to a backend endpoint
 *    that lists installations and repositories for the authenticated user.
 *  - Populate RepoSelector dynamically from that API.
 *  - Optionally persist selection server-side per user.
 *
 * The rest of the app (WorkflowForm, WorkflowsPage, Edit page)
 * should not require changes because they depend only on the
 * RepoScope returned by this hook.
 */


export function getRepoOptionsFromEnv(): RepoOption[] {
    const instRaw = process.env.NEXT_PUBLIC_DEMO_INSTALLATION_ID;
    const repoRaw = process.env.NEXT_PUBLIC_DEMO_REPOSITORY_ID;

    const installationId = Number(instRaw);
    const repositoryId = Number(repoRaw);

    if (!Number.isFinite(installationId) || !Number.isFinite(repositoryId)) {
        return [
            {
                label: "Demo Repo (env missing)",
                scope: { installationId: 0, repositoryId: 0 },
            },
        ];
    }

    return [
        {
            label: `Demo Repo (${repositoryId})`,
            scope: { installationId, repositoryId },
        },
    ];
}


export function useRepoScope() {
    const options = useMemo(() => getRepoOptionsFromEnv(), []);

    const [scope, setScope] = useState<RepoScope>(() => {
        if (typeof window === "undefined") return options[0].scope;

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return options[0].scope;

        try {
            const parsed = JSON.parse(raw) as RepoScope;
            if (
                typeof parsed?.installationId === "number" &&
                typeof parsed?.repositoryId === "number"
            ) {
                return parsed;
            }
            return options[0].scope;
        } catch {
            return options[0].scope;
        }
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
    }, [scope]);

    return { scope, setScope, options };
}
