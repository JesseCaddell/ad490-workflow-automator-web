"use client";

import type { RepoScope } from "@/lib/api";

type RepoOption = {
    label: string;
    scope: RepoScope;
};

function isSameScope(a: RepoScope, b: RepoScope) {
    return a.installationId === b.installationId && a.repositoryId === b.repositoryId;
}

type Props = {
    value: RepoScope;
    options: RepoOption[];
    onChangeAction: (next: RepoScope) => void;
};

export function RepoSelector({ value, options, onChangeAction }: Props) {
    return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label style={{ fontWeight: 600 }}>Repository</label>
            <select
                value={String(options.findIndex((o) => isSameScope(o.scope, value)))}
                onChange={(e) => {
                    const idx = Number(e.target.value);
                    const next = options[idx]?.scope;
                    if (next) onChangeAction(next);
                }}
            >
                {options.map((opt, idx) => (
                    <option key={idx} value={String(idx)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
