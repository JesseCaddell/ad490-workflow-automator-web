//src/components/layout/AppShell.tsx

"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
    children: ReactNode;
};

function GlobalLoadingIndicator() {
    return (
        <div className="app-loading" role="status" aria-live="polite" aria-label="Loading">
            <span className="sr-only">Loading</span>
            <div className="app-loading-bar" />
        </div>
    );
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="app-root">
            <Sidebar />

            <div className="app-shell">
                <header className="app-topbar" aria-label="Top bar">
                    <div className="app-topbar__inner">
                        <div className="app-topbar__spacer" />
                    </div>
                    <GlobalLoadingIndicator />
                </header>

                <main className="app-main">
                    <div className="app-container">{children}</div>
                </main>
            </div>
        </div>
    );
}
