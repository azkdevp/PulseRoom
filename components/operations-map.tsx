"use client"

import { useState } from "react"
import type { Zone, ZoneStatus } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { Coffee, CookingPot, LayoutGrid, Store } from "lucide-react"

const zoneIcons: Record<string, typeof Coffee> = {
  Counter: Store,
  "Barista Station": Coffee,
  Kitchen: CookingPot,
  Floor: LayoutGrid,
}

const statusStyles: Record<
  ZoneStatus,
  { tile: string; dot: string; bar: string; label: string }
> = {
  OK: { tile: "border-success/30 bg-success-muted/40", dot: "bg-success", bar: "bg-success", label: "text-success" },
  BUSY: { tile: "border-warning/30 bg-warning-muted/40", dot: "bg-warning", bar: "bg-warning", label: "text-warning" },
  ALERT: { tile: "border-critical/40 bg-critical-muted/50", dot: "bg-critical", bar: "bg-critical", label: "text-critical" },
  IDLE: { tile: "border-border bg-muted/40", dot: "bg-muted-foreground", bar: "bg-muted-foreground", label: "text-muted-foreground" },
}

export function OperationsMap({ zones }: { zones: Zone[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedZone = zones.find((z) => z.name === selected) ?? null

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Operations Map</h2>
        <p className="text-xs text-muted-foreground">Live status by café zone</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {zones.map((z) => {
          const s = statusStyles[z.status]
          const Icon = zoneIcons[z.name] ?? Store
          const isSelected = selected === z.name
          return (
            <button
              key={z.name}
              type="button"
              onClick={() => setSelected(isSelected ? null : z.name)}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-all",
                "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                s.tile,
                isSelected && "ring-2 ring-primary/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className={cn("size-4", s.label)} />
                  <span className="text-sm font-semibold text-foreground">{z.name}</span>
                </span>
                <span className="relative flex size-2.5">
                  {z.status === "ALERT" && (
                    <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", s.dot)} />
                  )}
                  <span className={cn("relative inline-flex size-2.5 rounded-full", s.dot)} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{z.detail}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all duration-700", s.bar)} style={{ width: `${z.load}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
                  {z.load}%
                </span>
              </div>
            </button>
          )
        })}
      </div>
      {selectedZone ? (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className={cn("font-semibold", statusStyles[selectedZone.status].label)}>{selectedZone.name}</span>
            {" — "}
            {selectedZone.status} · {selectedZone.detail} · running at {selectedZone.load}% load.
          </p>
        </div>
      ) : null}
    </section>
  )
}
