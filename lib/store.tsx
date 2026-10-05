"use client";

/**
 * Mock application state: auth (localStorage), application statuses, audit trail and toasts.
 * Everything is frontend-only — no backend, no real auth.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import type { ApplicationStatus, AuditEvent, DemoUser, Role } from "@/mock/types";
import { applications } from "@/mock/applications";
import { auditEvents as seedAudit } from "@/mock/audit";
import { userForRole } from "@/mock/users";
import { randomRef } from "./format";

type ToastKind = "success" | "info" | "warning" | "error";
interface Toast { id: number; kind: ToastKind; title: string; body?: string }

interface Ctx {
  user: DemoUser | null;
  ready: boolean;
  login: (role: Role, overrides?: Partial<DemoUser>) => DemoUser;
  logout: () => void;
  statusOf: (appId: string) => ApplicationStatus;
  setStatus: (appId: string, status: ApplicationStatus) => void;
  audit: AuditEvent[];
  addAudit: (e: Omit<AuditEvent, "id" | "ref" | "timestamp"> & { timestamp?: string }) => AuditEvent;
  toast: (kind: ToastKind, title: string, body?: string) => void;
  approvedMilestones: string[];
  approveMilestone: (key: string) => void;
  liveEval: any;
  setLiveEval: (data: any) => void;
}

const StoreCtx = createContext<Ctx | null>(null);
const LS_USER = "startupsetu.user";
const LS_STATE = "startupsetu.state";

function safeGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function safeSet(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [extraAudit, setExtraAudit] = useState<AuditEvent[]>([]);
  const [approvedMilestones, setApproved] = useState<string[]>([]);
  const [liveEval, setLiveEval] = useState<any>(null);

  useEffect(() => {
    setUser(safeGet<DemoUser>(LS_USER));
    const s = safeGet<{ statuses: Record<string, ApplicationStatus>; audit: AuditEvent[]; milestones: string[]; liveEval: any }>(LS_STATE);
    if (s) { setStatuses(s.statuses ?? {}); setExtraAudit(s.audit ?? []); setApproved(s.milestones ?? []); setLiveEval(s.liveEval ?? null); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) safeSet(LS_STATE, { statuses, audit: extraAudit, milestones: approvedMilestones, liveEval });
  }, [statuses, extraAudit, approvedMilestones, liveEval, ready]);

  // Toasts live in <Toaster>'s own state: showing one re-renders only the toaster, not every page.
  const toast = useCallback((kind: ToastKind, title: string, body?: string) => pushToast({ kind, title, body }), []);

  const login = useCallback((role: Role, overrides?: Partial<DemoUser>) => {
    const u = { ...userForRole(role), ...overrides };
    setUser(u); safeSet(LS_USER, u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(LS_USER); } catch { /* ignore */ }
  }, []);

  const statusOf = useCallback(
    (id: string) => statuses[id] ?? applications.find((a) => a.id === id)?.status ?? "Submitted",
    [statuses],
  );
  const setStatus = useCallback((id: string, s: ApplicationStatus) => setStatuses((m) => ({ ...m, [id]: s })), []);

  const addAudit: Ctx["addAudit"] = useCallback((e) => {
    const ev: AuditEvent = { ...e, id: `x${Date.now()}`, ref: randomRef(), timestamp: e.timestamp ?? new Date().toISOString() };
    setExtraAudit((a) => [...a, ev]);
    return ev;
  }, []);

  const approveMilestone = useCallback((k: string) => setApproved((m) => (m.includes(k) ? m : [...m, k])), []);

  const audit = useMemo(
    () => [...seedAudit, ...extraAudit].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [extraAudit],
  );

  // Stable context value: consumers re-render only when demo state actually changes.
  const value = useMemo(
    () => ({ user, ready, login, logout, statusOf, setStatus, audit, addAudit, toast, approvedMilestones, approveMilestone, liveEval, setLiveEval }),
    [user, ready, login, logout, statusOf, setStatus, audit, addAudit, toast, approvedMilestones, approveMilestone, liveEval, setLiveEval],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <Toaster />
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside AppProviders");
  return c;
}

const toastIcon = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle };
const toastTone = {
  success: "text-mint-400 border-mint-400/30",
  info: "text-setu-300 border-setu-400/30",
  warning: "text-warn-400 border-warn-400/30",
  error: "text-danger-400 border-danger-400/30",
};

type ToastInput = Omit<Toast, "id">;
let toastListener: ((t: ToastInput) => void) | null = null;
function pushToast(t: ToastInput) { toastListener?.(t); }

function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    toastListener = (t) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { ...t, id }]);
      const timer = setTimeout(() => { timers.delete(timer); setToasts((list) => list.filter((x) => x.id !== id)); }, 4200);
      timers.add(timer);
    };
    return () => { toastListener = null; timers.forEach(clearTimeout); };
  }, []);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = toastIcon[t.kind];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.16 }}
              className={`glass pointer-events-auto flex items-start gap-3 border px-4 py-3 ${toastTone[t.kind]}`}
              role="status"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-slate-400">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
