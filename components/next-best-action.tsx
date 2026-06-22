import type { NextBestAction } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { Zap, ArrowUpRight, Clock, User, Check } from "lucide-react"

const toneStyles: Record<
  NextBestAction["tone"],
  { wrap: string; icon: string; chip: string; button: string }
> = {
  success: {
    wrap: "border-success/40 bg-success-muted/40",
    icon: "bg-success text-success-foreground",
    chip: "border-success/30 bg-card text-success",
    button: "bg-success text-success-foreground hover:bg-success/90",
  },
  info: {
    wrap: "border-info/40 bg-info-muted/40",
    icon: "bg-info text-info-foreground",
    chip: "border-info/30 bg-card text-info",
    button: "bg-info text-info-foreground hover:bg-info/90",
  },
  warning: {
    wrap: "border-warning/40 bg-warning-muted/40",
    icon: "bg-warning text-warning-foreground",
    chip: "border-warning/30 bg-card text-warning",
    button: "bg-warning text-warning-foreground hover:bg-warning/90",
  },
  critical: {
    wrap: "border-critical/50 bg-critical-muted/50 ring-1 ring-critical/20",
    icon: "bg-critical text-critical-foreground",
    chip: "border-critical/30 bg-card text-critical",
    button: "bg-critical text-critical-foreground hover:bg-critical/90",
  },
}

export function NextBestActionCard({
  action,
  onRun,
  done = false,
}: {
  action: NextBestAction
  onRun: () => void
  done?: boolean
}) {
  const s = toneStyles[action.tone]
  return (
    <section className={cn("flex h-full flex-col rounded-xl border p-6 shadow-sm", s.wrap)}>
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-md", s.icon)}>
          <Zap className="size-4" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Next Best Action</h2>
      </div>

      <h3 className="mt-4 text-xl font-bold leading-snug tracking-tight text-foreground text-balance">
        {action.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">{action.detail}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", s.chip)}>
          <ArrowUpRight className="size-3.5" />
          {action.recovery} Pulse
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <User className="size-3.5" />
          {action.owner}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          {action.eta}
        </span>
      </div>

      <button
        onClick={onRun}
        disabled={done}
        className={cn(
          "mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
          done
            ? "cursor-default border border-success/30 bg-success-muted text-success"
            : s.button,
        )}
      >
        {done ? (
          <>
            <Check className="size-4" />
            Action taken
          </>
        ) : (
          <>
            {action.cta}
            <ArrowUpRight className="size-4" />
          </>
        )}
      </button>
    </section>
  )
}
