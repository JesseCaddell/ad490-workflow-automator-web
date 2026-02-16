export const SUPPORTED_TRIGGER_EVENTS = [
    "push",

    "issue.opened",
    "issue.assigned",
    "issue.closed",
    "issue.reopened",

    "pull_request.opened",
    "pull_request.draft",
    "pull_request.ready",
    "pull_request.closed",
    "pull_request.merged",

    "pull_request_review.changes_requested",
] as const;

export type SupportedTriggerEvent = (typeof SUPPORTED_TRIGGER_EVENTS)[number];

export const SUPPORTED_ACTION_TYPES = [
    "setProjectStatus",
    "addLabel",
    "addComment",
    "removeLabel",
] as const;

export type SupportedActionType = (typeof SUPPORTED_ACTION_TYPES)[number];

export type ActionStep = {
    type: SupportedActionType;
    params: Record<string, unknown>;
};
