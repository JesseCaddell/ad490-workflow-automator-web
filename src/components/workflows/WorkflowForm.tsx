"use client";

import { useMemo, useState } from "react";
import {
    createWorkflow,
    updateWorkflow,
    type Workflow,
} from "@/lib/api";
import { getDemoScope } from "@/lib/demo/demoScope";
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
    if (!step.type) return "Action type is required.";

    if (step.type === "addLabel") {
        const label = step.params.label;
        if (typeof label !== "string" || label.trim().length === 0) {
            return "addLabel requires params.label (string).";
        }
    }

    if (step.type === "addComment") {
        const body = step.params.body;
        if (typeof body !== "string" || body.trim().length === 0) {
            return "addComment requires params.body (string).";
        }
    }

    if (step.type === "setProjectStatus") {
        const status = step.params.status;
        if (typeof status !== "string" || status.trim().length === 0) {
            return "setProjectStatus requires params.status (string).";
        }
    }

    return null;
}

export function WorkflowForm({ mode, initial }: Props) {
    const scope = useMemo(() => getDemoScope(), []);

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

        return parsed.length > 0 ? parsed : [{ type: "addLabel", params: defaultParamsFor("addLabel") }];
    });

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

    function addAction() {
        setActions((prev) => [
            ...prev,
            { type: "addLabel", params: defaultParamsFor("addLabel") },
        ]);
    }

    function removeAction(index: number) {
        setActions((prev) => prev.filter((_, i) => i !== index));
    }

    function setActionType(index: number, nextType: SupportedActionType) {
        setActions((prev) =>
            prev.map((a, i) =>
                i === index ? { type: nextType, params: defaultParamsFor(nextType) } : a
            )
        );
    }

    function setActionParam(index: number, key: string, value: string) {
        setActions((prev) =>
            prev.map((a, i) =>
                i === index
                    ? { ...a, params: { ...a.params, [key]: value } }
                    : a
            )
        );
    }

    function moveUp(index: number) {
        setActions((prev) => moveItem(prev, index, index - 1));
    }

    function moveDown(index: number) {
        setActions((prev) => moveItem(prev, index, index + 1));
    }

    function validateForm(): string | null {
        if (name.trim().length === 0) return "Name is required.";

        if (!(SUPPORTED_TRIGGER_EVENTS as readonly string[]).includes(triggerEvent)) {
            return "Trigger event is not supported.";
        }

        if (actions.length === 0) return "Add at least one action.";

        for (const a of actions) {
            const err = validateAction(a);
            if (err) return err;
        }

        return null;
    }

    async function onSubmit() {
        const error = validateForm();
        if (error) {
            setFeedback({ kind: "error", message: error });
            return;
        }

        setSubmitting(true);
        setFeedback(null);

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
                if (!initial) throw new Error("Missing initial workflow for edit.");

                await updateWorkflow(scope, initial.id, {
                    name: name.trim(),
                    enabled,
                });

                // NOTE: API PATCH currently supports only name/description/enabled.
                // Trigger + steps editing requires extending validatePatchPayload + PATCH handler.
                setFeedback({
                    kind: "success",
                    message:
                        "Workflow updated (name/enabled). Trigger/actions editing requires API support.",
                });
            }
        } catch (err: any) {
            setFeedback({
                kind: "error",
                message: err?.message ?? "Failed to submit workflow.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    const isEdit = mode === "edit";

    return (
        <div style={{ maxWidth: 720 }}>
            <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                    <label>Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%" }}
                        placeholder="e.g. Label WIP PRs"
                    />
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
                            onChange={(e) => setTriggerEvent(e.target.value as SupportedTriggerEvent)}
                            disabled={isEdit}
                            style={{ width: "100%" }}
                            title={isEdit ? "Editing trigger requires API PATCH support." : undefined}
                        >
                            {SUPPORTED_TRIGGER_EVENTS.map((ev) => (
                                <option key={ev} value={ev}>
                                    {ev}
                                </option>
                            ))}
                        </select>
                        {isEdit && (
                            <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                                Trigger editing is disabled until API PATCH supports trigger/steps.
                            </p>
                        )}
                    </div>
                </div>

                <section>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ margin: 0 }}>Actions</h2>
                        <button type="button" onClick={addAction} disabled={isEdit}>
                            Add Action
                        </button>
                    </div>

                    {isEdit && (
                        <p style={{ marginTop: "0.25rem", color: "#666" }}>
                            Actions editing is disabled until API PATCH supports steps.
                        </p>
                    )}

                    <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
                        {actions.map((a, idx) => (
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
                                        onChange={(e) => setActionType(idx, e.target.value as SupportedActionType)}
                                        disabled={isEdit}
                                    >
                                        {SUPPORTED_ACTION_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>

                                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                                        <button type="button" onClick={() => moveUp(idx)} disabled={isEdit || idx === 0}>
                                            Up
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveDown(idx)}
                                            disabled={isEdit || idx === actions.length - 1}
                                        >
                                            Down
                                        </button>
                                        <button type="button" onClick={() => removeAction(idx)} disabled={isEdit}>
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
                                                disabled={isEdit}
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
                                                disabled={isEdit}
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
                                                disabled={isEdit}
                                                style={{ width: "100%" }}
                                                placeholder="In Review"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {feedback && (
                    <div
                        style={{
                            padding: "0.75rem",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: feedback.kind === "success" ? "#f2fff2" : "#fff2f2",
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
