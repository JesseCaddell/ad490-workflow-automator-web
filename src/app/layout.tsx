//src/app/layout.tsx

import "./globals.css";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={inter.className}>
        <body>
        <AppShell>{children}</AppShell>
        </body>
        </html>
    );
}
