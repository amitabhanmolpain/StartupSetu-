"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, X, BadgeCheck, Bot, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { Role } from "@/mock/types";
import { navByRole } from "./nav";
import { useStore } from "@/lib/store";
import { roleLabels } from "@/mock/users";
import { notificationsByRole } from "@/mock/notifications";
import { Logo, DemoBadge, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/format";

export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready, login, logout } = useStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Demo convenience: opening a dashboard URL directly signs in as that role's demo account.
  useEffect(() => {
    if (ready && (!user || user.role !== role)) login(role);
  }, [ready, user, role, login]);

  // Close the mobile drawer on navigation (state reset during render, no extra effect pass).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMobileOpen(false); }

  const onLogout = () => { logout(); router.push("/"); };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-white/[0.06] bg-ink-900 lg:block">
        <SidebarContent role={role} onLogout={onLogout} />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/70" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="absolute left-0 top-0 h-full w-[264px] border-r border-white/10 bg-ink-900">
              <button className="absolute right-3 top-5 text-slate-400" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              <SidebarContent role={role} onLogout={onLogout} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="border-t border-white/[0.05] px-8 py-4 text-xs text-slate-500">
          StartupSetu · All data is simulated · DEMO MODE: no real payments, identity checks or AI calls are made.
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const pathname = usePathname();
  const items = navByRole[role];
  const home = items[0].href;
  // Optimistic highlight: the clicked item lights up on pointer-down, before the next page has rendered.
  const [pending, setPending] = useState<string | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) { setSeenPath(pathname); setPending(null); }
  const isActive = (href: string) => (pending ? pending === href : href === home ? pathname === home : pathname.startsWith(href));
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5"><Logo href={home} /></div>
      <div className="mx-5 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
        Signed in as <span className="font-medium text-slate-200">{roleLabels[role]}</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main">
        {items.map((it) => {
          const active = isActive(it.href);
          const Icon = it.icon;
          return (
            <div key={it.href}>
              {it.section && <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{it.section}</p>}
              <Link
                href={it.href}
                onPointerDown={() => setPending(it.href)}
                onKeyDown={(e) => { if (e.key === "Enter") setPending(it.href); }}
                className={cn(
                  "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-100",
                  active ? "bg-setu-500/15 text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-setu-gradient" />}
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-setu-300" : "text-slate-500 group-hover:text-slate-300")} />
                <span className="flex-1">{it.label}</span>
                {it.badge && <span className="rounded-full bg-saffron-500/15 px-2 py-0.5 text-[10px] font-semibold text-saffron-300">{it.badge}</span>}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <button onClick={onLogout} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-danger-500/10 hover:text-danger-400">
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
      </div>
    </div>
  );
}

const nIcon = { info: Info, success: CheckCircle2, warning: AlertTriangle, ai: Bot };
const nTone = { info: "text-setu-300", success: "text-mint-400", warning: "text-warn-400", ai: "text-ai-300" };

function Topbar({ role, onMenu }: { role: Role; onMenu: () => void }) {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(notificationsByRole[role]);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials = (user?.name ?? "U").replace(/(Smt\.|Dr\.|Shri)\s*/g, "").split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-950/70 px-4 backdrop-blur-xl md:px-8">
      <button onClick={onMenu} className="focus-ring rounded-lg p-2 text-slate-300 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{user?.org ?? "…"}</p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{user?.title} · {roleLabels[role]}</p>
      </div>
      <DemoBadge className="hidden md:inline-flex" />
      <ThemeToggle />
      {role === "startup" && (
        <span className="hidden items-center gap-1 rounded-full bg-mint-500/10 px-2.5 py-1 text-xs font-medium text-mint-400 ring-1 ring-mint-400/25 sm:inline-flex">
          <BadgeCheck className="h-3.5 w-3.5" /> Verified Startup
        </span>
      )}
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen((o) => !o)} className="focus-ring relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 text-slate-300 hover:text-white" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-onaccent">{unread}</span>}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="glass absolute right-0 mt-2 w-[340px] bg-ink-850/95 p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <button className="text-xs text-setu-300 hover:underline" onClick={() => setNotes((n) => n.map((x) => ({ ...x, read: true })))}>Mark all read</button>
              </div>
              {notes.map((n) => {
                const I = nIcon[n.kind];
                return (
                  <div key={n.id} className={cn("flex gap-3 rounded-xl px-2 py-2.5", !n.read && "bg-white/[0.03]")}>
                    <I className={cn("mt-0.5 h-4 w-4 shrink-0", nTone[n.kind])} />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100">{n.title}</p>
                      <p className="text-xs text-slate-400">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{n.time}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-setu-gradient text-sm font-semibold text-onaccent" title={user?.name}>{initials}</div>
    </header>
  );
}
