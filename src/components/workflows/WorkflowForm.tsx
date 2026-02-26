// src/components/workflows/WorkflowForm.tsx

"use client";

import { useMemo, useRef, useState } from "react";
import type { Workflow } from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import {
    SUPPORTED_ACTION_TYPES,
    SUPPORTED_TRIGGER_EVENTS,
    type ActionStep,
    type SupportedActionType,
    type SupportedTriggerEvent,
} from "@/lib/workflows/supported";
import { useCreateWorkflow, useUpdateWorkflow } from "@/lib/api/hooks/useWorkflows";
import { useRouter } from "next/navigation";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
    mode: "create" | "edit";
    initial?: Workflow; // required for edit
};

function moveItem<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
}

function defaultParamsFor(type: SupportedActionType): Record<string, unknown> {
    switch (type) {
        case "addLabel":
            return { label: "wip" };
        case "removeLabel":
            return { label: "wip" };
        case "addComment":
            return { body: "Hello from workflow" };
        case "setProjectStatus":
            return { status: "In Review" };
        default:
            return {};
    }
}

function validateAction(step: ActionStep): string | null {
    if (!step.type) return "Select an action type.";

    if (step.type === "addLabel" || step.type === "removeLabel") {
        const label = step.params.label;
        if (typeof label !== "string" || label.trim().length === 0) return "Label is required.";
    }

    if (step.type === "addComment") {
        const body = step.params.body;
        if (typeof body !== "string" || body.trim().length === 0) return "Comment text is required.";
    }

    if (step.type === "setProjectStatus") {
        const status = step.params.status;
        if (typeof status !== "string" || status.trim().length === 0) return "Status is required.";
    }

    return null;
}

type FieldErrors = {
    name?: string;
    triggerEvent?: string;
    actions?: string;
    actionErrors: Array<string | null>;
};

export function WorkflowForm({ mode, initial }: Props) {
    const { scope } = useRepoScope();
    const submitLockRef = useRef(false);

    const { create, isLoading: creating } = useCreateWorkflow(scope);
    const { update, isLoading: updating } = useUpdateWorkflow(scope);

    const [name, setName] = useState<string>(initial?.name ?? "");
    const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);

    const router = useRouter();
    const [createMore, setCreateMore] = useState(false);

    const [triggerEvent, setTriggerEvent] = useState<SupportedTriggerEvent>(() => {
        const raw = initial?.trigger?.event;
        if (raw && (SUPPORTED_TRIGGER_EVENTS as readonly string[]).includes(raw)) {
            return raw as SupportedTriggerEvent;
        }
        return SUPPORTED_TRIGGER_EVENTS[0];
    });

    const [actions, setActions] = useState<ActionStep[]>(() => {
        const rawSteps = initial?.steps ?? [];
        const parsed: ActionStep[] = [];

        for (const s of rawSteps) {
            if (typeof s !== "object" || s === null) continue;
            const type = (s as any).type;
            const params = (s as any).params;

            if (!(SUPPORTED_ACTION_TYPES as readonly string[]).includes(type)) continue;

            parsed.push({
                type,
                params: typeof params === "object" && params !== null ? params : {},
            } as ActionStep);
        }

        return parsed.length > 0
            ? parsed
            : [{ type: "addLabel", params: defaultParamsFor("addLabel") }];
    });

    const [touched, setTouched] = useState({
        name: false,
        triggerEvent: false,
        actions: false,
    });

    const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

    const errors: FieldErrors = useMemo(() => {
        const out: FieldErrors = { actionErrors: [] };

        if (name.trim().length === 0) out.name = "Name is required.";

        if (!(SUPPORTED_TRIGGER_EVENTS as readonly string[]).includes(triggerEvent)) {
            out.triggerEvent = "Trigger event is not supported.";
        }

        if (actions.length === 0) out.actions = "Add at least one action.";

        out.actionErrors = actions.map((a) => validateAction(a));

        for (let i = 0; i < actions.length; i++) {
            const type = actions[i]?.type;
            if (!type) continue;
            if (!(SUPPORTED_ACTION_TYPES as readonly string[]).includes(type)) {
                out.actionErrors[i] = "Action type is not supported.";
            }
        }

        return out;
    }, [name, triggerEvent, actions]);

    const isValid =
        !errors.name &&
        !errors.triggerEvent &&
        !errors.actions &&
        errors.actionErrors.every((e) => e === null);

    const submitting = creating || updating;

    function addAction() {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => [...prev, { type: "addLabel", params: defaultParamsFor("addLabel") }]);
    }

    function removeAction(index: number) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => prev.filter((_, i) => i !== index));
    }

    function setActionType(index: number, nextType: SupportedActionType) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) =>
            prev.map((a, i) => (i === index ? { type: nextType, params: defaultParamsFor(nextType) } : a))
        );
    }

    function setActionParam(index: number, key: string, value: string) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) =>
            prev.map((a, i) => (i === index ? { ...a, params: { ...a.params, [key]: value } } : a))
        );
    }

    function moveUp(index: number) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => moveItem(prev, index, index - 1));
    }

    function moveDown(index: number) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => moveItem(prev, index, index + 1));
    }

    async function onSubmit() {
        if (submitLockRef.current) return;
        submitLockRef.current = true;

        setTouched({ name: true, triggerEvent: true, actions: true });
        setFeedback(null);

        if (!isValid) {
            setFeedback({ kind: "error", message: "Fix the errors above before saving." });
            submitLockRef.current = false;
            return;
        }

        try {
            if (mode === "create") {
                await create({
                    name: name.trim(),
                    enabled,
                    trigger: { event: triggerEvent },
                    steps: actions,
                });

                setFeedback({ kind: "success", message: "Workflow created." });

                if (!createMore) {
                    router.push("/workflows");
                    return;
                }
            } else {
                if (!initial) {
                    setFeedback({ kind: "error", message: "Missing initial workflow for edit." });
                    submitLockRef.current = false;
                    return;
                }

                await update(initial.id, {
                    name: name.trim(),
                    enabled,
                    trigger: { event: triggerEvent },
                    steps: actions,
                });

                setFeedback({ kind: "success", message: "Workflow updated." });
            }
        } catch (err: any) {
            setFeedback({
                kind: "error",
                message: err?.message ?? "Failed to submit workflow.",
            });
        } finally {
            submitLockRef.current = false;
        }
    }

    return (
        <div className="workflow-editor">
            <section className="card">
                <div className="workflow-editor__topGrid">
                    <div className="workflow-editor__field">
                        <div className="workflow-editor__label">Workflow name</div>
                        <input
                            value={name}
                            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Label WIP PRs"
                        />
                        {touched.name && errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="workflow-editor__toggleRow">
                        <Toggle checked={enabled} onChange={setEnabled} label="Enabled" />
                    </div>
                </div>
            </section>

            <div className="workflow-editor__grid">
                <section className="card">
                    <div className="card__titleRow">
                        <h2 className="card__title">Trigger event</h2>
                    </div>

                    <div className="pill-grid" role="group" aria-label="Trigger event">
                        {SUPPORTED_TRIGGER_EVENTS.map((ev) => {
                            const selected = triggerEvent === ev;
                            return (
                                <button
                                    key={ev}
                                    type="button"
                                    className={`pill ${selected ? "pill--selected" : ""}`}
                                    aria-pressed={selected}
                                    onBlur={() => setTouched((t) => ({ ...t, triggerEvent: true }))}
                                    onClick={() => {
                                        setTouched((t) => ({ ...t, triggerEvent: true }));
                                        setTriggerEvent(ev);
                                    }}
                                >
                                    <span className="pill__text">{ev}</span>
                                </button>
                            );
                        })}
                    </div>

                    {touched.triggerEvent && errors.triggerEvent && (
                        <div className="form-error">{errors.triggerEvent}</div>
                    )}
                </section>

                <section className="card">
                    <div className="card__titleRow">
                        <h2 className="card__title">Actions</h2>
                    </div>

                    {touched.actions && errors.actions && <div className="form-error">{errors.actions}</div>}

                    <div className="actions-stack">
                        {actions.map((a, idx) => {
                            const actionErr = errors.actionErrors[idx];

                            return (
                                <div key={idx} className="card">
                                    <div className="action-card__header">
                                        <div className="action-card__index">#{idx + 1}</div>

                                        <select
                                            value={a.type}
                                            onChange={(e) => setActionType(idx, e.target.value as SupportedActionType)}
                                        >
                                            {SUPPORTED_ACTION_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="action-card__headerRight">
                                            <button className="btn" type="button" onClick={() => moveUp(idx)} disabled={idx === 0}>
                                                Up
                                            </button>
                                            <button
                                                className="btn"
                                                type="button"
                                                onClick={() => moveDown(idx)}
                                                disabled={idx === actions.length - 1}
                                            >
                                                Down
                                            </button>
                                            <button className="btn btn--danger" type="button" onClick={() => removeAction(idx)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    <div className="action-card__body">
                                        {(a.type === "addLabel" || a.type === "removeLabel") && (
                                            <div className="action-card__row">
                                                <div className="workflow-editor__label">
                                                    {a.type === "addLabel" ? "Label" : "Label to remove"}
                                                </div>
                                                <input
                                                    value={String(a.params.label ?? "")}
                                                    onChange={(e) => setActionParam(idx, "label", e.target.value)}
                                                    placeholder="wip"
                                                />
                                            </div>
                                        )}

                                        {a.type === "addComment" && (
                                            <div className="action-card__row">
                                                <div className="workflow-editor__label">Comment body</div>
                                                <textarea
                                                    value={String(a.params.body ?? "")}
                                                    onChange={(e) => setActionParam(idx, "body", e.target.value)}
                                                    rows={3}
                                                    placeholder="Push detected (dev seed rule)"
                                                />
                                            </div>
                                        )}

                                        {a.type === "setProjectStatus" && (
                                            <div className="action-card__row">
                                                <div className="workflow-editor__label">Status</div>
                                                <input
                                                    value={String(a.params.status ?? "")}
                                                    onChange={(e) => setActionParam(idx, "status", e.target.value)}
                                                    placeholder="In Review"
                                                />
                                            </div>
                                        )}

                                        {touched.actions && actionErr && <div className="form-error">{actionErr}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="actions-footer">
                        <button className="btn" type="button" onClick={addAction}>
                            Add Action
                        </button>
                    </div>
                </section>
            </div>

            {feedback && (
                <div className={`feedback ${feedback.kind === "success" ? "feedback--success" : "feedback--error"}`} style={{ marginTop: 14 }}>
                    <strong>{feedback.kind === "success" ? "Success" : "Error"}:</strong> {feedback.message}
                </div>
            )}

            <div className="workflow-editor__submitRow">

                {mode === "create" && (
                    <label className="workflow-editor__createMore">
                        <input
                            type="checkbox"
                            checked={createMore}
                            onChange={(e) => setCreateMore(e.target.checked)}
                        />
                        Create more
                    </label>
                )}

                <button className="btn btn--primary" type="button" onClick={onSubmit} disabled={submitting}>
                    {submitting ? "Saving..." : mode === "create" ? "Create Workflow" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}