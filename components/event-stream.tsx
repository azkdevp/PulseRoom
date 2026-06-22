import type { PulseEvent, EventCategory, Severity } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { ShoppingBag, Package, Users, AlertTriangle } from "lucide-react"

const borderTone: Record<Severity, string> = {
  info: "border-l-info",
  warning: "border-l-warning",
  critical: "border-l-critical",
}

const iconTone: Record<EventCategory, string> = {
  ORDER: "bg-info-muted text-info",
  STOCK: "bg-critical-muted text-critical",
  STAFF: "bg-warning-muted text-warning",
  ALERT: "bg-critical-muted text-critical",
}

const categoryIcon: Record<EventCategory, typeof ShoppingBag> = {
  ORDER: ShoppingBag,
  STOCK: Package,
  STAFF: Users,
  ALERT: AlertTriangle,
}

export function EventStream({ events }: { events: PulseEvent[] }) {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Live Events</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <ul className="divide-y divide-border">
        {events.map((e, i) => {
          const Icon = categoryIcon[e.category]
          const isNewest = i === 0
          return (
            <li
              key={e.id}
              className={cn(
                "flex items-start gap-3 border-l-2 px-5 py-3 transition-colors",
                borderTone[e.severity],
                isNewest && "bg-muted/50",
              )}
            >
              <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", iconTone[e.category])}>
                <Icon className="size-3.5" />
              </span>
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-foreground">{e.message}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{e.category}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{e.time}</span>
                </div>
              </div>
              {isNewest && (
                <span className="mt-0.5 shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  New
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        Demo events simulate POS, inventory, staff tasks, and manual inputs written to DynamoDB.
      </p>
    </section>
  )
}
