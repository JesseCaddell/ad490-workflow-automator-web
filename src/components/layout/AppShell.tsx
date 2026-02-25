//src/components/layout/AppShell.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RepoSelector } from "@/components/repos/RepoSelector";

type AppShellProps = {
    children: ReactNode;
};

type NavItem = {
    href: string;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/workflows", label: "Workflows" },
];

function NavLink({ href, label }: NavItem) {
    const pathname = usePathname();

    // Basic active detection. This is intentionally simple for MVP.
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

    return (
        <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`app-nav-link ${isActive ? "app-nav-link--active" : ""}`}
        >
            {label}
        </Link>
    );
}

function GlobalLoadingIndicator() {
    // Placeholder only (no router event wiring yet).
    // We'll keep it visible as a subtle animated bar for now,
    // so the layout has a defined "global loading indicator" slot.
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
            <header className="app-header">
                <div className="app-header-inner">
                    <div className="app-brand">
                        <Link className="app-brand-link" href="/dashboard">
                            Workflow Automator
                        </Link>
                    </div>

                    <nav className="app-nav" aria-label="Primary">
                        {NAV_ITEMS.map((item) => (
                            <NavLink key={item.href} href={item.href} label={item.label} />
                        ))}
                    </nav>

                    <RepoSelector />
                </div>


                <GlobalLoadingIndicator />
            </header>

            <main className="app-main">
                <div className="app-container">{children}</div>
            </main>
        </div>
    );
}
