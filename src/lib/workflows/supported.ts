export const SUPPORTED_TRIGGER_EVENTS = [
    "push",
    "pull_request.opened",
    "pull_request.labeled",
] as const;

export type SupportedTriggerEvent = (typeof SUPPORTED_TRIGGER_EVENTS)[number];

export const SUPPORTED_ACTION_TYPES = [
    "addLabel",
    "addComment",
    "setProjectStatus",
] as const;

export type SupportedActionType = (typeof SUPPORTED_ACTION_TYPES)[number];

export type ActionStep = {
    type: SupportedActionType;
    params: Record<string, unknown>;
};
