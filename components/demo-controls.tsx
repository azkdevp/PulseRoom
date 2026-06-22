"use client"

import { scenarioControls, type ScenarioId } from "@/lib/pulse-data"
import type { QuickEventKind } from "@/lib/pulse-live"
import { cn } from "@/lib/utils"
import { Plus, CheckCircle2, Coffee, UserCheck, PackageMinus, Users, RotateCcw, DatabaseBackup } from "lucide-react"

const activeStyles: Record<ScenarioId, string> = {
  normal: "border-success bg-card text-success",
  lunch: "border-warning bg-warning text-warning-foreground",
  stock: "border-critical bg-critical text-critical-foreground",
  staff: "border-warning bg-card text-warning",
  recovery: "border-info bg-info text-info-foreground",
}

const idleStyles: Record<ScenarioId, string> = {
  normal: "border-success/40 text-success hover:bg-success-muted",
  lunch: "border-warning/40 text-warning hover:bg-warning-muted",
  stock: "border-critical/40 text-critical hover:bg-critical-muted",
  staff: "border-warning/40 text-warning hover:bg-warning-muted",
  recovery: "border-info/40 text-info hover:bg-info-muted",
}

const quickEvents: { kind: QuickEventKind; label: string; icon: typeof Plus }[] = [
  { kind: "new-order", label: "New Order", icon: Plus },
  { kind: "complete-order", label: "Complete Order", icon: CheckCircle2 },
  { kind: "sell-latte", label: "Sell Iced Latte", icon: Coffee },
  { kind: "staff-checkin", label: "Staff Check-in", icon: UserCheck },
  { kind: "inventory-drop", label: "Inventory Drop", icon: PackageMinus },
  { kind: "queue-spike", label: "Customer Queue Spike", icon: Users },
]

export function DemoControls({
  active,
  onSelect,
  onQuickEvent,
  onReset,
  onResetData,
}: {
  active: ScenarioId
  onSelect: (id: ScenarioId) => void
  onQuickEvent: (kind: QuickEventKind) => void
  onReset: () => void
  onResetData: () => void
}) {
  return (
    <section className="mt-2 border-t border-border pt-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scenario</p>
          <div className="flex flex-wrap gap-2">
            {scenarioControls.map((c) => {
              const isActive = c.id === active
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    isActive ? activeStyles[c.id] : cn("bg-card", idleStyles[c.id]),
                  )}
                >
                  {c.label}
                </button>
              )
            })}
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              Reset scenario
            </button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Event</p>
          <div className="flex flex-wrap gap-2">
            {quickEvents.map((q) => {
              const Icon = q.icon
              return (
                <button
                  key={q.kind}
                  onClick={() => onQuickEvent(q.kind)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="size-3.5" />
                  {q.label}
                </button>
              )
            })}
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 rounded-full border border-critical/40 bg-card px-3 py-1.5 text-sm font-medium text-critical transition-colors hover:bg-critical-muted"
            >
              <DatabaseBackup className="size-3.5" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
