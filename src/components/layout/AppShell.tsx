"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, PlusCircle, TrendingUp } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/orders/new", label: "New Order", icon: PlusCircle },
  { href: "/production", label: "Production", icon: ListChecks },
  { href: "/sales", label: "Sales", icon: TrendingUp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white md:flex md:flex-col">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <Image src="/logo.jpg" alt="Kovai" width={36} height={36} className="rounded-lg" />
          <div>
            <p className="font-display text-sm font-bold tracking-tight text-ink">
              Kovai Customizes
            </p>
            <p className="text-xs text-ink-muted">Production Orders</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-tint text-brand-dark"
                    : "text-ink-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center gap-2.5 border-b border-border bg-white px-4 py-3 md:hidden">
        <Image src="/logo.jpg" alt="Kovai" width={32} height={32} className="rounded-lg" />
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-ink">Kovai Customizes</p>
          <p className="text-xs text-ink-muted">Production Orders</p>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-border bg-white md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-brand-dark" : "text-ink-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
