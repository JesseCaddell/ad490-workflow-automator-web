"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import { useWorkflowsList } from "@/lib/api/hooks/useWorkflows";
import type { CSSProperties, ReactNode } from "react";
import type { Workflow } from "@/lib/api";

/**
 * API Health shape (matches your Express health.ts)
 */
type ApiHealth = {
    ok: boolean;
    status: "ok" | "degraded";
    timestamp: string;
    checks: Record<string, unknown>;
};

type HealthState =
    | { state: "idle"; data: null; error: null; latencyMs: null; lastCheckedIso: null }
    | { state: "loading"; data: ApiHealth | null; error: null; latencyMs: number | null; lastCheckedIso: string | null }
    | { state: "success"; data: ApiHealth; error: null; latencyMs: number; lastCheckedIso: string }
    | { state: "error"; data: null; error: string; latencyMs: number | null; lastCheckedIso: string | null };

function getApiBaseUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) return "http://localhost:3001";
    return base.replace(/\/+$/, "");
}

async function fetchHealth(): Promise<{ health: ApiHealth; latencyMs: number }> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/health`;

    const start = performance.now();
    const res = await fetch(url, { method: "GET" });
    const end = performance.now();

    if (!res.ok) {
        throw new Error(`Health check failed (${res.status})`);
    }

    const json = (await res.json()) as ApiHealth;
    return { health: json, latencyMs: Math.round(end - start) };
}

function toShortTime(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function getWorkflowUpdatedAt(w: Workflow): string | null {
    const m = w.metadata ?? {};
    const candidates = [
        (m as any).updatedAt,
    ];

    for (const c of candidates) {
        if (typeof c === "string" && c.length > 0) return c;
    }

    return null;
}

function sortByUpdatedAtDesc(workflows: Workflow[]): Workflow[] {
    const withTime = workflows.map((w) => ({ w, t: getWorkflowUpdatedAt(w) }));
    const anyHasTime = withTime.some((x) => x.t);

    if (!anyHasTime) return workflows;

    return withTime
        .slice()
        .sort((a, b) => {
            const ta = a.t ? new Date(a.t).getTime() : 0;
            const tb = b.t ? new Date(b.t).getTime() : 0;
            return tb - ta;
        })
        .map((x) => x.w);
}

export default function DashboardPage() {
    const { scope } = useRepoScope();
    const workflowsList = useWorkflowsList(scope);

    const [health, setHealth] = useState<HealthState>({
        state: "idle",
        data: null,
        error: null,
        latencyMs: null,
        lastCheckedIso: null,
    });

    const loadHealth = useCallback(async () => {
        setHealth((prev) => ({
            state: "loading",
            data: prev.data,
            error: null,
            latencyMs: prev.latencyMs,
            lastCheckedIso: prev.lastCheckedIso,
        }));

        try {
            const { health: h, latencyMs } = await fetchHealth();
            const checked = new Date().toISOString(); // our canonical "last checked"
            setHealth({ state: "success", data: h, error: null, latencyMs, lastCheckedIso: checked });
        } catch (err: any) {
            setHealth((prev) => ({
                state: "error",
                data: null,
                error: err?.message ?? "Failed to reach API health endpoint.",
                latencyMs: null,
                lastCheckedIso: prev.lastCheckedIso, // keep last known check time if we had one
            }));
        }
    }, []);

    useEffect(() => {
        void loadHealth();
    }, [loadHealth]);

    // Light auto-refresh for health only (keeps dashboard feeling alive, low risk)
    useEffect(() => {
        const id = window.setInterval(() => {
            void loadHealth();
        }, 60_000);
        return () => window.clearInterval(id);
    }, [loadHealth]);

    const summary = useMemo(() => {
        const workflows = workflowsList.workflows;

        const total = workflows.length;
        const enabled = workflows.filter((w) => w.enabled).length;
        const disabled = total - enabled;

        const totalActions = workflows.reduce((sum, w) => sum + (w.steps?.length ?? 0), 0);

        const recent = sortByUpdatedAtDesc(workflows)
            .slice(0, 3)
            .map((w) => ({
                id: w.id,
                name: w.name,
                updatedAt: getWorkflowUpdatedAt(w),
            }));

        // Placeholder: requires execution logs (post-MVP)
        const failingEnabled = 0;

        return { total, enabled, disabled, totalActions, recent, failingEnabled };
    }, [workflowsList.workflows]);

    const onRefreshAll = useCallback(async () => {
        await Promise.all([loadHealth(), workflowsList.reload()]);
    }, [loadHealth, workflowsList]);

    return (
        <>
            <PageHeader title="Dashboard" />

            {/* Push the cards down from the header divider */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Row 1: Health */}
                <section style={rowStyle}>
                    <Card title="API Status" rightSlot={<RefreshButton onClick={onRefreshAll} />}>
                        {health.state === "idle" || health.state === "loading" ? (
                            <LoadingState message="Checking API..." />
                        ) : null}

                        {health.state === "error" ? (
                            <ErrorState message={health.error} onRetryAction={onRefreshAll} retryLabel="Retry" />
                        ) : null}

                        {health.state === "success" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <StatusPill
                                        label={health.data.ok ? "Online" : "Degraded"}
                                        tone={health.data.ok ? "good" : "warn"}
                                    />
                                    <span style={{ opacity: 0.85 }}>
                    Latency: <strong>{health.latencyMs}ms</strong>
                  </span>
                                </div>

                                <div style={{ opacity: 0.75 }}>
                                    Last check: {toShortTime(health.lastCheckedIso)}
                                </div>

                                {!health.data.ok ? (
                                    <div style={{ opacity: 0.9 }}>
                                        API reported degraded status. Some environment checks may be missing.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </Card>

                    <Card title="GitHub Auth (Coming Soon)">
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ opacity: 0.9 }}>
                                This MVP uses a demo installation + repository scope from environment variables.
                            </div>
                            <div style={{ opacity: 0.75 }}>
                                Future: authenticate user, list installations/repos dynamically, and populate action inputs from GitHub data.
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Row 2: Workflow Summary */}
                <section style={rowStyle}>
                    {/* Total Workflows */}
                    <StatCard
                        title="Total Workflows"
                        value={
                            workflowsList.state === "error"
                                ? "—"
                                : String(summary.total)
                        }
                    >
                        {workflowsList.state === "loading" && !workflowsList.hasLoaded ? (
                            <LoadingState message="Loading workflows..." />
                        ) : workflowsList.state === "error" ? (
                            <ErrorState
                                message={workflowsList.error ?? "Failed to load workflows."}
                                onRetryAction={onRefreshAll}
                            />
                        ) : null}
                    </StatCard>

                    {/* Enabled / Disabled */}
                    <TwoStatCard
                        title="Enabled / Disabled"
                        leftLabel="Enabled"
                        leftValue={
                            workflowsList.state === "error"
                                ? "—"
                                : String(summary.enabled)
                        }
                        leftTone="good"
                        leftTitle="Enabled workflows"
                        rightLabel="Disabled"
                        rightValue={
                            workflowsList.state === "error"
                                ? "—"
                                : String(summary.disabled)
                        }
                        rightTone="bad"
                        rightTitle="Disabled workflows"
                    >
                        {workflowsList.state === "loading" && !workflowsList.hasLoaded ? (
                            <LoadingState message="Loading workflows..." />
                        ) : workflowsList.state === "error" ? (
                            <ErrorState
                                message={workflowsList.error ?? "Failed to load workflows."}
                                onRetryAction={onRefreshAll}
                            />
                        ) : null}
                    </TwoStatCard>

                    {/* Total Actions */}
                    <StatCard
                        title="Total Actions Configured"
                        value={
                            workflowsList.state === "error"
                                ? "—"
                                : String(summary.totalActions)
                        }
                    >
                        {workflowsList.state === "loading" && !workflowsList.hasLoaded ? (
                            <LoadingState message="Loading workflows..." />
                        ) : workflowsList.state === "error" ? (
                            <ErrorState
                                message={workflowsList.error ?? "Failed to load workflows."}
                                onRetryAction={onRefreshAll}
                            />
                        ) : null}
                    </StatCard>

                    {/* Recently Updated */}
                    <Card title="Recently Updated (max 3)">
                        {workflowsList.state === "loading" && !workflowsList.hasLoaded ? (
                            <LoadingState message="Loading workflows..." />
                        ) : workflowsList.state === "error" ? (
                            <ErrorState
                                message={workflowsList.error ?? "Failed to load workflows."}
                                onRetryAction={onRefreshAll}
                            />
                        ) : summary.total === 0 ? (
                            <EmptyState
                                title="No workflows yet"
                                body="Create a workflow to start automating repository actions."
                            />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {summary.recent.map((w) => (
                                    <div
                                        key={w.id}
                                        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                                    >
                                        <div
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <strong>{w.name}</strong>
                                        </div>
                                        <div style={{ opacity: 0.75, whiteSpace: "nowrap" }}>
                                            {toShortTime(w.updatedAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </section>
            </div>
        </>
    );
}

/* ---------- tiny UI helpers (local to page) ---------- */

const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
};

function Card({
                  title,
                  children,
                  rightSlot,
              }: {
    title: string;
    children: ReactNode;
    rightSlot?: ReactNode;
}) {
    return (
        <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
                {rightSlot ? <div>{rightSlot}</div> : null}
            </div>
            <div style={{ marginTop: 12 }}>{children}</div>
        </div>
    );
}

function StatCard({
                      title,
                      value,
                      children,
                  }: {
    title: string;
    value: string;
    children?: ReactNode;
}) {
    return (
        <div style={cardStyle}>
            <div style={{ opacity: 0.8 }}>{title}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>

            {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
        </div>
    );
}

function TwoStatCard({
                         title,
                         leftLabel,
                         leftValue,
                         leftTone,
                         leftTitle,
                         rightLabel,
                         rightValue,
                         rightTone,
                         rightTitle,
                         children,
                     }: {
    title: string;
    leftLabel: string;
    leftValue: string;
    leftTone: "good" | "warn" | "bad";
    leftTitle?: string;
    rightLabel: string;
    rightValue: string;
    rightTone: "good" | "warn" | "bad";
    rightTitle?: string;
    children?: ReactNode;
}) {
    return (
        <div style={cardStyle}>
            <div style={{ opacity: 0.8 }}>{title}</div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                    alignItems: "center",
                    marginTop: 16,
                }}
            >
                {/* Enabled - column 2 */}
                <div style={{ gridColumn: 2, textAlign: "center" }} title={leftTitle}>
                    <div style={{ opacity: 0.75 }}>{leftLabel}</div>
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            marginTop: 6,
                            color: toneColor(leftTone),
                        }}
                    >
                        {leftValue}
                    </div>
                </div>

                {/* Disabled - column 4 */}
                <div style={{ gridColumn: 4, textAlign: "center" }} title={rightTitle}>
                    <div style={{ opacity: 0.75 }}>{rightLabel}</div>
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            marginTop: 6,
                            color: toneColor(rightTone),
                        }}
                    >
                        {rightValue}
                    </div>
                </div>
            </div>

            {children ? (
                <div style={{ marginTop: 14 }}>{children}</div>
            ) : (
                <div style={{ opacity: 0.65, marginTop: 14, textAlign: "center" }}>
                    Execution health (success/failure) requires run logs (Post-MVP).
                </div>
            )}
        </div>
    );
}

function toneColor(tone: "good" | "warn" | "bad"): string {
    if (tone === "good") return "#1b8f5a";
    if (tone === "warn") return "#b36b00";
    return "#b00020";
}

function RefreshButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="btn" onClick={onClick}>
            Refresh
        </button>
    );
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "warn" | "bad" }) {
    const border =
        tone === "good"
            ? "rgba(0, 180, 120, 0.6)"
            : tone === "warn"
                ? "rgba(255, 170, 0, 0.7)"
                : "rgba(255, 90, 90, 0.7)";

    return (
        <span
            style={{
                border: `1px solid ${border}`,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 13,
                fontWeight: 600,
            }}
        >
      {label}
    </span>
    );
}

const cardStyle: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 14,
};