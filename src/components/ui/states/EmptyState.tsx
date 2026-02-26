// src/components/ui/states/EmptyState.tsx

"use client";

import type { ReactNode } from "react";

type Props = {
    title: string;
    body?: string;
    actionSlot?: ReactNode;
};

export function EmptyState({ title, body, actionSlot }: Props) {
    return (
        <div className="ui-state ui-state--empty">
            <p className="ui-state__title">{title}</p>
            {body ? <p className="ui-state__body">{body}</p> : null}
            {actionSlot ? <div className="ui-state__actions">{actionSlot}</div> : null}
        </div>
    );
}