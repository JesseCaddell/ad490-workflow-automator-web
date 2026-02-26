// src/components/ui/states/ErrorState.tsx

"use client";

type Props = {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
};

export function ErrorState({ message, onRetry, retryLabel = "Retry" }: Props) {
    return (
        <div className="ui-state ui-state--error" role="alert" aria-live="assertive">
            <p className="ui-state__title">Error</p>
            <p className="ui-state__body">{message}</p>

            {onRetry ? (
                <div className="ui-state__actions">
                    <button type="button" className="btn" onClick={onRetry}>
                        {retryLabel}
                    </button>
                </div>
            ) : null}
        </div>
    );
}