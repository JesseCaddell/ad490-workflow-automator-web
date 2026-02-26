// src/components/ui/states/ErrorState.tsx

"use client";

type Props = {
    message: string;
    onRetryAction?: () => void;
    retryLabel?: string;
};

export function ErrorState({ message, onRetryAction, retryLabel = "Retry" }: Props) {
    return (
        <div className="ui-state ui-state--error" role="alert" aria-live="assertive">
            <p className="ui-state__title">Error</p>
            <p className="ui-state__body">{message}</p>

            {onRetryAction ? (
                <div className="ui-state__actions">
                    <button type="button" className="btn" onClick={onRetryAction}>
                        {retryLabel}
                    </button>
                </div>
            ) : null}
        </div>
    );
}