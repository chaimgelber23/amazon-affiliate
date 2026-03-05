"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "Deals", href: "/deals" },
    { label: "About", href: "/about" },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-[var(--color-surface)]">
                        Pure<span className="text-[var(--color-accent)]">Find</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="text-sm font-medium text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] transition-colors">
                            {link.label}
                        </Link>
                    ))}
                    <Link href="/deals" className="bg-[var(--color-accent)] text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors">
                        Live Deals
                    </Link>
                </nav>

                <button className="md:hidden p-2 text-[var(--color-surface-muted)]"
                    onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {mobileOpen && (
                <nav className="md:hidden border-t border-[var(--color-border)] bg-white px-4 py-3 space-y-1">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="block text-sm font-medium text-[var(--color-surface-muted)] hover:text-[var(--color-surface)] py-2.5 transition-colors"
                            onClick={() => setMobileOpen(false)}>
                            {link.label}
                        </Link>
                    ))}
                </nav>
            )}
        </header>
    );
}
