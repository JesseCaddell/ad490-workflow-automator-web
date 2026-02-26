"use client";

import type { ReactNode } from "react";

type Props = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    "aria-label"?: string;

    // either label or children (children wins if provided)
    label?: string;
    children?: ReactNode;
};

export function Toggle({
                           checked,
                           onChange,
                           disabled,
                           id,
                           label,
                           children,
                           "aria-label": ariaLabel,
                       }: Props) {
    const inputId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;

    return (
        <label className={`toggle ${disabled ? "toggle--disabled" : ""}`} htmlFor={inputId}>
            <input
                id={inputId}
                className="toggle__input"
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                aria-label={ariaLabel}
            />
            <span className="toggle__track" aria-hidden="true" />
            {children ? <span className="toggle__label">{children}</span> : label ? <span className="toggle__label">{label}</span> : null}
        </label>
    );
}