//src/components/navigation/SidebarNavItem.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SidebarNavItemProps = {
    href: string;
    label: string;
    icon: ReactNode;
    disabled?: boolean;
    exact?: boolean;
};

export function SidebarNavItem({
                                   href,
                                   label,
                                   icon,
                                   disabled = false,
                                   exact = false,
                               }: SidebarNavItemProps) {
    const pathname = usePathname();

    const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    if (disabled) {
        return (
            <div
                className="sidebar-item sidebar-item--disabled"
                aria-disabled="true"
                title={`${label} (coming soon)`}
            >
                <div className="sidebar-item__icon" aria-hidden="true">
                    {icon}
                </div>
                <span className="sr-only">{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`sidebar-item ${isActive ? "sidebar-item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            title={label}
        >
            <div className="sidebar-item__icon" aria-hidden="true">
                {icon}
            </div>
            <span className="sr-only">{label}</span>
        </Link>
    );
}