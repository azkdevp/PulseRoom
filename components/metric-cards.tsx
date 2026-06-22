"use client"

import { useState } from "react"
import type { Metric } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

const valueTone: Record<NonNullable<Metric["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning",
  info: "text-info",
}

// Short, human explanations shown in the inline detail popover per metric.
const metricDetails: Record<string, string[]> = {
  "Revenue Today": [
    "Gross sales since open, across all channels.",
    "Compared against the same time yesterday.",
    "Updates live as orders are completed.",
  ],
  "Active Orders": [
    "Orders currently in progress or queued.",
    "Includes counter, mobile, and delivery.",
    "A rising count signals building demand.",
  ],
  "Avg Wait Time": [
    "Average time from order to handoff.",
    "Measured across the last 30 minutes.",
    "Above 6 min usually means add a station.",
  ],
  "Staff On Shift": [
    "Team members clocked in vs. scheduled.",
    "Gaps here drive longer wait times.",
    "Call backup when coverage drops.",
  ],
  "Low Stock Items": [
    "Items at or below their reorder threshold.",
    "Each can block part of the menu.",
    "Restock to reopen affected drinks.",
  ],
  "Open Tasks": [
    "Action items still awaiting completion.",
    "Includes checks, prep, and restocks.",
    "Clearing these lifts your Pulse score.",
  ],
}

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => {
        const isOpen = openLabel === m.label
        const details = metricDetails[m.label] ?? ["No additional detail available."]
        return (
          <div key={m.label} className="relative">
            <button
              type="button"
              onClick={() => setOpenLabel(isOpen ? null : m.label)}
              aria-expanded={isOpen}
              className={cn(
                "w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-all",
                "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isOpen ? "border-primary/50 ring-1 ring-primary/30" : "border-border",
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <p className={cn("mt-1.5 text-2xl font-bold tabular-nums tracking-tight", valueTone[m.tone ?? "default"])}>
                {m.value}
              </p>
              {m.delta ? (
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    m.deltaTone === "down" ? "text-critical" : "text-success",
                  )}
                >
                  {m.deltaTone === "down" ? (
                    <TrendingDown className="size-3.5" />
                  ) : (
                    <TrendingUp className="size-3.5" />
                  )}
                  {m.delta}
                </p>
              ) : null}
            </button>

            {isOpen ? (
              <div
                role="dialog"
                aria-label={`${m.label} details`}
                className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-border bg-popover p-3 shadow-lg"
              >
                <p className="text-xs font-semibold text-foreground">{m.label}</p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {details.map((line) => (
                    <li key={line} className="text-[11px] leading-relaxed text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
