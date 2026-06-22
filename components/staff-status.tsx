"use client"

import type { StaffMember, StaffStatus } from "@/lib/pulse-data"
import type { StaffActionKind } from "@/lib/pulse-live"
import { cn } from "@/lib/utils"
import { Store, Package, Check } from "lucide-react"

const statusTone: Record<StaffStatus, string> = {
  ACTIVE: "bg-success-muted text-success",
  BUSY: "bg-info-muted text-info",
  OVERDUE: "bg-critical-muted text-critical",
}

export function StaffStatus({
  staff,
  onStaffAction,
}: {
  staff: StaffMember[]
  onStaffAction: (name: string, action: StaffActionKind) => void
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Staff on Shift</h2>
      </div>
      <ul className="divide-y divide-border">
        {staff.map((s) => (
          <li key={s.name} className="px-5 py-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  statusTone[s.status],
                )}
                aria-hidden="true"
              >
                {s.name.charAt(0)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.role} · {s.task}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                  statusTone[s.status],
                )}
              >
                {s.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
              <button
                onClick={() => onStaffAction(s.name, "counter")}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <Store className="size-3" />
                Counter
              </button>
              <button
                onClick={() => onStaffAction(s.name, "stockroom")}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <Package className="size-3" />
                Stockroom
              </button>
              <button
                onClick={() => onStaffAction(s.name, "done")}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <Check className="size-3" />
                Task done
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
