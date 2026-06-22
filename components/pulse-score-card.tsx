"use client"

import { useEffect, useState } from "react"
import type { PulseStatus } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"

const statusStyles: Record<PulseStatus, { badge: string; ring: string; accent: string }> = {
  Healthy: { badge: "border-success/30 bg-success-muted text-success", ring: "text-success", accent: "border-l-success" },
  Recovering: { badge: "border-info/30 bg-info-muted text-info", ring: "text-info", accent: "border-l-info" },
  Busy: { badge: "border-warning/30 bg-warning-muted text-warning", ring: "text-warning", accent: "border-l-warning" },
  Critical: { badge: "border-critical/30 bg-critical-muted text-critical", ring: "text-critical", accent: "border-l-critical" },
}

export function PulseScoreCard({
  score,
  status,
  subtitle,
  updateTick = 0,
}: {
  score: number
  status: PulseStatus
  subtitle: string
  updateTick?: number
}) {
  const styles = statusStyles[status]
  const isCritical = status === "Critical"
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Flash an "updated just now" pulse whenever the live state changes.
  const [justUpdated, setJustUpdated] = useState(false)
  useEffect(() => {
    if (updateTick === 0) return
    setJustUpdated(true)
    const id = setTimeout(() => setJustUpdated(false), 2000)
    return () => clearTimeout(id)
  }, [updateTick])

  return (
    <section
      className={cn(
        "flex h-full flex-col justify-between rounded-xl border border-l-4 bg-card p-6 shadow-sm",
        styles.accent,
        isCritical ? "border-critical/40 ring-1 ring-critical/20" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pulse Score</h2>
        </div>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles.badge)}>
          {status}
        </span>
      </div>

      <div className="flex items-center gap-6 py-2">
        <div className="relative flex size-40 shrink-0 items-center justify-center">
          <svg className="size-40 -rotate-90" viewBox="0 0 150 150" aria-hidden="true">
            <circle cx="75" cy="75" r={radius} fill="none" strokeWidth="11" className="stroke-muted" />
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-[stroke-dashoffset] duration-700 ease-out", styles.ring)}
              stroke="currentColor"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">{score}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">out of 100</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className={cn("text-2xl font-bold tracking-tight", styles.ring)}>{status}</span>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Composite of orders, stock, staffing &amp; wait time.
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium transition-opacity duration-300",
            justUpdated ? "text-success opacity-100" : "text-muted-foreground opacity-70",
          )}
        >
          <span className="relative flex size-1.5">
            {justUpdated && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            )}
            <span className={cn("relative inline-flex size-1.5 rounded-full", justUpdated ? "bg-success" : "bg-muted-foreground")} />
          </span>
          {justUpdated ? "Updated just now" : "Live"}
        </span>
      </div>
    </section>
  )
}
