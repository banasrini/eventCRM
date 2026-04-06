"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "@/components/chat/ChatPanel";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sponsors", label: "Sponsors", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-white">
        {/* Wordmark */}
        <div className="flex h-14 items-center border-b px-5">
          <span className="font-display text-base tracking-tight text-black" style={{ fontFamily: "var(--font-display)" }}>
            Event<span className="text-[#E73D00]">CRM</span>
          </span>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium transition-colors border-l-2",
                  active
                    ? "border-[#E73D00] text-[#E73D00] bg-orange-50"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <p className="text-[10px] font-medium tracking-widest text-neutral-400 uppercase">EventCRM v1</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Floating chat */}
      <ChatPanel />
    </div>
  );
}
