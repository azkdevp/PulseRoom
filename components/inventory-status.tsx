"use client"

import type { InventoryItem, InventoryStatus } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { RefreshCw, Check } from "lucide-react"

const statusTone: Record<InventoryStatus, string> = {
  LOW: "bg-critical-muted text-critical",
  WATCH: "bg-warning-muted text-warning",
  OK: "bg-success-muted text-success",
}

export function InventoryStatus({
  items,
  onRestock,
  onMarkChecked,
  highlightItem,
}: {
  items: InventoryItem[]
  onRestock: (item: string) => void
  onMarkChecked: (item: string) => void
  highlightItem?: string
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Inventory</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Item</th>
              <th className="px-3 py-2.5 font-medium">Stock</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((row) => {
              const needsAttention = row.status !== "OK"
              const spotlighted = highlightItem === row.item
              return (
                <tr
                  key={row.item}
                  className={cn(
                    row.status === "LOW" && "bg-critical-muted/30",
                    spotlighted && "bg-warning-muted/60 ring-1 ring-inset ring-warning/40",
                  )}
                >
                  <td className="px-5 py-3 font-medium text-foreground">
                    <span className="flex items-center gap-1.5">
                      {row.item}
                      {spotlighted && (
                        <span className="rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-warning-foreground">
                          RESTOCKING
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-foreground">
                    {row.stock}
                    <span className="ml-1 text-xs text-muted-foreground">/ {row.threshold}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                        statusTone[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {needsAttention ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onRestock(row.item)}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <RefreshCw className="size-3" />
                          Restock
                        </button>
                        <button
                          onClick={() => onMarkChecked(row.item)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                        >
                          <Check className="size-3" />
                          Checked
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">{row.runout}</p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
