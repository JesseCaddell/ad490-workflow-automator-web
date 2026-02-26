// src/components/ui/states/LoadingState.tsx

"use client";

type Props = {
    message?: string;
};

export function LoadingState({ message = "Loading..." }: Props) {
    return (
        <div className="ui-state ui-state--loading" role="status" aria-live="polite">
            <p className="ui-state__title">{message}</p>
        </div>
    );
}