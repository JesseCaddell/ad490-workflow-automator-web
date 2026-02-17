"use client";

import { useMemo, useRef, useState } from "react";
import { createWorkflow, updateWorkflow, type Workflow } from "@/lib/api";
import { useRepoScope } from "@/lib/repoScope/useRepoScope";
import {
    SUPPORTED_ACTION_TYPES,
    SUPPORTED_TRIGGER_EVENTS,
    type ActionStep,
    type SupportedActionType,
    type SupportedTriggerEvent,
} from "@/lib/workflows/supported";

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

    if (step.type === "addLabel") {
        const label = step.params.label;
        if (typeof label !== "string" || label.trim().length === 0) {
            return "Label is required.";
        }
    }

    if (step.type === "addComment") {
        const body = step.params.body;
        if (typeof body !== "string" || body.trim().length === 0) {
            return "Comment text is required.";
        }
    }

    if (step.type === "setProjectStatus") {
        const status = step.params.status;
        if (typeof status !== "string" || status.trim().length === 0) {
            return "Status is required.";
        }
    }

    return null;
}

type FieldErrors = {
    name?: string;
    triggerEvent?: string;
    actions?: string; // general error
    actionErrors: Array<string | null>; // per-action error
};

export function WorkflowForm({ mode, initial }: Props) {
    const { scope } = useRepoScope();
    const submitLockRef = useRef(false);

    const [name, setName] = useState<string>(initial?.name ?? "");
    const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);

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

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{
        kind: "success" | "error";
        message: string;
    } | null>(null);

    const errors: FieldErrors = useMemo(() => {
        const out: FieldErrors = { actionErrors: [] };

        // name required
        if (name.trim().length === 0) {
            out.name = "Name is required.";
        }

        // trigger must be supported
        if (!(SUPPORTED_TRIGGER_EVENTS as readonly string[]).includes(triggerEvent)) {
            out.triggerEvent = "Trigger event is not supported.";
        }

        // actions required
        if (actions.length === 0) {
            out.actions = "Add at least one action.";
        }

        // per-action validation
        out.actionErrors = actions.map((a) => validateAction(a));

        // action type must be supported
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

    function addAction() {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => [
            ...prev,
            { type: "addLabel", params: defaultParamsFor("addLabel") },
        ]);
    }

    function removeAction(index: number) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) => prev.filter((_, i) => i !== index));
    }

    function setActionType(index: number, nextType: SupportedActionType) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) =>
            prev.map((a, i) =>
                i === index ? { type: nextType, params: defaultParamsFor(nextType) } : a
            )
        );
    }

    function setActionParam(index: number, key: string, value: string) {
        setTouched((t) => ({ ...t, actions: true }));
        setActions((prev) =>
            prev.map((a, i) =>
                i === index
                    ? { ...a, params: { ...a.params, [key]: value } }
                    : a
            )
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
        // hard lock to prevent double-submit (even ultra fast)
        if (submitLockRef.current) return;
        submitLockRef.current = true;

        // force errors to show even if user never focused fields
        setTouched({ name: true, triggerEvent: true, actions: true });
        setFeedback(null);

        if (!isValid) {
            setFeedback({ kind: "error", message: "Fix the errors above before saving." });
            submitLockRef.current = false;
            return;
        }

        setSubmitting(true);

        try {
            if (mode === "create") {
                await createWorkflow(scope, {
                    name: name.trim(),
                    enabled,
                    trigger: { event: triggerEvent },
                    steps: actions,
                });
                setFeedback({ kind: "success", message: "Workflow created." });
            } else {
                if (!initial) {
                    setFeedback({ kind: "error", message: "Missing initial workflow for edit." });
                    return;
                }

                await updateWorkflow(scope, initial.id, {
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
            setSubmitting(false);
            submitLockRef.current = false;
        }
    }

    return (
        <div style={{ maxWidth: 720 }}>
            <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                    <label>Name</label>
                    <input
                        value={name}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%" }}
                        placeholder="e.g. Label WIP PRs"
                    />
                    {touched.name && errors.name && (
                        <p style={{ margin: "0.25rem 0 0", color: "#b00020" }}>
                            {errors.name}
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        Enabled
                    </label>

                    <div style={{ flex: 1 }}>
                        <label>Trigger event</label>
                        <select
                            value={triggerEvent}
                            onBlur={() => setTouched((t) => ({ ...t, triggerEvent: true }))}
                            onChange={(e) => setTriggerEvent(e.target.value as SupportedTriggerEvent)}
                            style={{ width: "100%" }}
                        >
                            {SUPPORTED_TRIGGER_EVENTS.map((ev) => (
                                <option key={ev} value={ev}>
                                    {ev}
                                </option>
                            ))}
                        </select>

                        {touched.triggerEvent && errors.triggerEvent && (
                            <p style={{ margin: "0.25rem 0 0", color: "#b00020" }}>
                                {errors.triggerEvent}
                            </p>
                        )}
                    </div>
                </div>

                <section>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h2 style={{ margin: 0 }}>Actions</h2>
                        <button type="button" onClick={addAction}>
                            Add Action
                        </button>
                    </div>

                    {touched.actions && errors.actions && (
                        <p style={{ margin: "0.5rem 0 0", color: "#b00020" }}>
                            {errors.actions}
                        </p>
                    )}

                    <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
                        {actions.map((a, idx) => {
                            const actionErr = errors.actionErrors[idx];
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        border: "1px solid #ddd",
                                        padding: "0.75rem",
                                        borderRadius: 6,
                                    }}
                                >
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <strong style={{ width: 70 }}>#{idx + 1}</strong>

                                        <select
                                            value={a.type}
                                            onChange={(e) =>
                                                setActionType(idx, e.target.value as SupportedActionType)
                                            }
                                        >
                                            {SUPPORTED_ACTION_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>

                                        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                                            <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}>
                                                Up
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveDown(idx)}
                                                disabled={idx === actions.length - 1}
                                            >
                                                Down
                                            </button>
                                            <button type="button" onClick={() => removeAction(idx)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "0.75rem" }}>
                                        {a.type === "addLabel" && (
                                            <div>
                                                <label>Label</label>
                                                <input
                                                    value={String(a.params.label ?? "")}
                                                    onChange={(e) => setActionParam(idx, "label", e.target.value)}
                                                    style={{ width: "100%" }}
                                                    placeholder="wip"
                                                />
                                            </div>
                                        )}

                                        {a.type === "addComment" && (
                                            <div>
                                                <label>Comment body</label>
                                                <textarea
                                                    value={String(a.params.body ?? "")}
                                                    onChange={(e) => setActionParam(idx, "body", e.target.value)}
                                                    style={{ width: "100%" }}
                                                    rows={3}
                                                    placeholder="Push detected (dev seed rule)"
                                                />
                                            </div>
                                        )}

                                        {a.type === "setProjectStatus" && (
                                            <div>
                                                <label>Status</label>
                                                <input
                                                    value={String(a.params.status ?? "")}
                                                    onChange={(e) => setActionParam(idx, "status", e.target.value)}
                                                    style={{ width: "100%" }}
                                                    placeholder="In Review"
                                                />
                                            </div>
                                        )}

                                        {touched.actions && actionErr && (
                                            <p style={{ margin: "0.5rem 0 0", color: "#b00020" }}>
                                                {actionErr}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {feedback && (
                    <div
                        style={{
                            padding: "0.75rem",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: feedback.kind === "success" ? "#f2fff2" : "#fff2f2",
                            color: "#111",
                        }}
                    >
                        <strong>{feedback.kind === "success" ? "Success" : "Error"}:</strong>{" "}
                        {feedback.message}
                    </div>
                )}

                <button type="button" onClick={onSubmit} disabled={submitting}>
                    {submitting ? "Saving..." : mode === "create" ? "Create Workflow" : "Save Changes"}
                </button>

            </div>
        </div>
    );
}
