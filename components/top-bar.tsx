import type { PulseStatus } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"

const statusStyles: Record<PulseStatus, { dot: string; chip: string }> = {
  Healthy: { dot: "bg-success", chip: "border-success/30 bg-success-muted text-success" },
  Busy: { dot: "bg-warning", chip: "border-warning/30 bg-warning-muted text-warning" },
  Critical: { dot: "bg-critical", chip: "border-critical/30 bg-critical-muted text-critical" },
  Recovering: { dot: "bg-info", chip: "border-info/30 bg-info-muted text-info" },
}

export function TopBar({
  lastUpdated,
  scenarioLabel,
  status,
  critical,
}: {
  lastUpdated: string
  scenarioLabel: string
  status: PulseStatus
  critical: boolean
}) {
  const s = statusStyles[status]
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b bg-card/95 backdrop-blur transition-colors",
        critical ? "border-critical/30" : "border-border",
      )}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">PulseRoom</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Bean &amp; Co. Café</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              s.chip,
            )}
          >
            <span className="relative flex size-2">
              <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", s.dot)} />
              <span className={cn("relative inline-flex size-2 rounded-full", s.dot)} />
            </span>
            {scenarioLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Live
          </span>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </div>
    </header>
  )
}
