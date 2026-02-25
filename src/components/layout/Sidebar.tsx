//src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { Home, Workflow, FileText, Settings, User } from "lucide-react";
import { SidebarNavItem } from "@/components/navigation/SidebarNavItem";

export function Sidebar() {
    return (
        <aside className="sidebar" aria-label="Primary navigation">
            <div className="sidebar__top">
                <Link className="sidebar__logo" href="/dashboard" aria-label="Flowarden home" title="Flowarden">
                    <div className="sidebar__logoMark" aria-hidden="true" />
                </Link>
            </div>

            <div className="sidebar__nav">
                <SidebarNavItem href="/dashboard" label="Dashboard" icon={<Home size={22} />} exact />
                <SidebarNavItem href="/workflows" label="Workflows" icon={<Workflow size={22} />} />

                <SidebarNavItem href="/logs" label="Logs" icon={<FileText size={22} />} disabled />
                <SidebarNavItem href="/settings" label="Settings" icon={<Settings size={22} />} disabled />
            </div>

            <div className="sidebar__bottom">
                <div className="sidebar-item sidebar-item--disabled" aria-disabled="true" title="Account (after MVP)">
                    <div className="sidebar-item__icon" aria-hidden="true">
                        <User size={22} />
                    </div>
                    <span className="sr-only">Account</span>
                </div>
            </div>
        </aside>
    );
}