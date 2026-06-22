"use client"

import type { LiveAlert } from "@/lib/pulse-live"
import type { AlertSeverity } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { AlertOctagon, AlertTriangle, Info, TrendingDown, ArrowRight, CheckCircle2 } from "lucide-react"

const severityStyles: Record<
  AlertSeverity,
  { card: string; chip: string; icon: typeof Info; iconWrap: string }
> = {
  CRITICAL: {
    card: "border-l-critical bg-critical-muted/30",
    chip: "bg-critical-muted text-critical",
    icon: AlertOctagon,
    iconWrap: "text-critical",
  },
  WARNING: {
    card: "border-l-warning",
    chip: "bg-warning-muted text-warning",
    icon: AlertTriangle,
    iconWrap: "text-warning",
  },
  INFO: {
    card: "border-l-info",
    chip: "bg-info-muted text-info",
    icon: Info,
    iconWrap: "text-info",
  },
}

export function SmartAlerts({
  alerts,
  onResolve,
}: {
  alerts: LiveAlert[]
  onResolve: (id: string) => void
}) {
  const activeCount = alerts.filter((a) => !a.resolved).length
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Smart Alerts</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {activeCount} active
        </span>
      </div>
      {alerts.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">No active alerts. All clear.</p>
      ) : (
        <ul className="flex flex-col gap-3 p-4">
          {alerts.map((a) => {
            const s = severityStyles[a.severity]
            const Icon = a.resolved ? CheckCircle2 : s.icon
            return (
              <li
                key={a.id}
                className={cn(
                  "rounded-lg border border-border border-l-4 p-4 transition-opacity",
                  a.resolved ? "border-l-success opacity-60" : s.card,
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", a.resolved ? "text-success" : s.iconWrap)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                          a.resolved ? "bg-success-muted text-success" : s.chip,
                        )}
                      >
                        {a.resolved ? "RESOLVED" : a.severity}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.description}</p>

                    {!a.resolved && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5">
                          <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Impact</p>
                            <p className="text-xs text-foreground">{a.impact}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5">
                          <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Recommended</p>
                            <p className="text-xs text-foreground">{a.recommendedAction}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!a.resolved && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onResolve(a.id)}
                      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
