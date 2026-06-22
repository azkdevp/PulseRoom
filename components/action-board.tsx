"use client"

import type { LiveTask } from "@/lib/pulse-live"
import type { Priority } from "@/lib/pulse-data"
import { cn } from "@/lib/utils"
import { Check, ArrowUpRight } from "lucide-react"

const priorityTone: Record<Priority, string> = {
  HIGH: "bg-critical-muted text-critical",
  MEDIUM: "bg-warning-muted text-warning",
  LOW: "bg-info-muted text-info",
}

export function ActionBoard({
  tasks,
  onComplete,
  highlight = false,
}: {
  tasks: LiveTask[]
  onComplete: (id: string) => void
  highlight?: boolean
}) {
  const openCount = tasks.filter((t) => !t.done).length
  return (
    <section
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-colors",
        highlight && openCount > 0 ? "border-info ring-1 ring-info/30" : "border-border",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Action Board</h2>
          {highlight && openCount > 0 && (
            <span className="rounded-full bg-info-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-info">
              PREP TASKS
            </span>
          )}
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {openCount} open
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">No tasks for this scenario.</p>
      ) : (
        <ul className="divide-y divide-border">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 transition-opacity",
                t.done && "opacity-55",
                highlight && !t.done && "bg-info-muted/30",
              )}
            >
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                  t.done ? "bg-success-muted text-success" : priorityTone[t.priority],
                )}
              >
                {t.done ? "DONE" : t.priority}
              </span>
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium text-foreground",
                    t.done && "line-through",
                  )}
                >
                  {t.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Assigned to {t.assignee}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success-muted px-1.5 py-0.5 text-[10px] font-bold text-success">
                    <ArrowUpRight className="size-3" />
                    {t.recovery}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onComplete(t.id)}
                disabled={t.done}
                aria-label={t.done ? `${t.title} completed` : `Complete task: ${t.title}`}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                  t.done
                    ? "cursor-default border-success bg-success text-success-foreground"
                    : "border-success/30 bg-success-muted text-success hover:bg-success hover:text-success-foreground",
                )}
              >
                <Check className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
