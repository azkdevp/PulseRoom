"use client"

import useSWR from "swr"
import { toast } from "sonner"
import type { ScenarioId } from "@/lib/pulse-data"
import { selectMetrics, type LiveState, type QuickEventKind, type StaffActionKind } from "@/lib/pulse-live"
import { cn } from "@/lib/utils"
import { TopBar } from "@/components/top-bar"
import { PulseScoreCard } from "@/components/pulse-score-card"
import { NextBestActionCard } from "@/components/next-best-action"
import { OperationsMap } from "@/components/operations-map"
import { MetricCards } from "@/components/metric-cards"
import { EventStream } from "@/components/event-stream"
import { SmartAlerts } from "@/components/smart-alerts"
import { ActionBoard } from "@/components/action-board"
import { InventoryStatus } from "@/components/inventory-status"
import { StaffStatus } from "@/components/staff-status"
import { DemoControls } from "@/components/demo-controls"
import { scenarios } from "@/lib/pulse-data"

interface DashboardResponse {
  state: LiveState
}

class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

const fetcher = async (url: string): Promise<DashboardResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? "Failed to load dashboard", body.code)
  }
  return res.json()
}

async function postJson(url: string, body?: unknown): Promise<DashboardResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error("Request failed")
  return res.json()
}

const quickEventLabels: Record<QuickEventKind, string> = {
  "new-order": "New order recorded",
  "complete-order": "Order completed",
  "sell-latte": "Iced latte sold",
  "staff-checkin": "Staff checked in",
  "inventory-drop": "Inventory updated",
  "queue-spike": "Queue spike recorded",
}

export function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>("/api/dashboard", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  // Run an action that returns fresh state, then refetch /api/dashboard so the
  // database stays the single source of truth. Optimistically populate the
  // SWR cache with the action response to avoid a flash.
  const runAction = async (action: () => Promise<DashboardResponse>) => {
    try {
      const result = await action()
      await mutate(result, { revalidate: true })
    } catch {
      toast.error("Something went wrong", { description: "Could not reach the server. Please try again." })
      await mutate()
    }
  }

  if (isLoading && !data && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="text-sm font-medium">Loading live operations…</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isMissingEnv = error instanceof ApiError && error.code === "MISSING_ENV"
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <p className="text-base font-semibold text-foreground">
            {isMissingEnv ? "DynamoDB isn't configured yet" : "Couldn't load the dashboard"}
          </p>
          {isMissingEnv ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                The app couldn&apos;t find its AWS credentials in this environment. Add these variables to the
                project&apos;s <span className="font-medium text-foreground">Development</span> environment, then retry:
              </p>
              <ul className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-left font-mono text-xs text-foreground">
                <li>AWS_REGION</li>
                <li>AWS_ACCESS_KEY_ID</li>
                <li>AWS_SECRET_ACCESS_KEY</li>
                <li>DYNAMODB_TABLE_NAME</li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t reach DynamoDB. Check your connection and try again.
            </p>
          )}
          <button
            onClick={() => mutate()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="text-sm font-medium">Loading live operations…</p>
        </div>
      </div>
    )
  }

  const state = data.state
  const isCritical = state.pulseStatus === "Critical"
  const metrics = selectMetrics(state)

  const handleSelect = (id: ScenarioId) => {
    toast(`Scenario: ${scenarios[id].label}`, { description: "Live state reset to scenario baseline." })
    void runAction(() => postJson("/api/demo/trigger", { type: "scenario", scenarioId: id }))
  }

  const handleReset = () => {
    toast("Scenario reset", { description: "Restored the current scenario to its original data." })
    void runAction(() => postJson("/api/demo/trigger", { type: "reset" }))
  }

  const handleResetData = () => {
    toast("Demo data reset", { description: "Database restored to the baseline scenario." })
    void runAction(() => postJson("/api/seed", { scenarioId: "normal" }))
  }

  const handleComplete = (id: string) => {
    const task = state.tasks.find((t) => t.id === id)
    if (task && !task.done) toast.success("Task completed", { description: task.title })
    void runAction(() => postJson(`/api/tasks/${id}/complete`))
  }

  const handleResolve = (id: string) => {
    const alert = state.alerts.find((a) => a.id === id)
    if (alert && !alert.resolved) toast.success("Alert resolved", { description: alert.title })
    void runAction(() => postJson(`/api/alerts/${id}/resolve`))
  }

  const handleRestock = (item: string) => {
    toast.success("Inventory restocked", { description: `${item} returned to a safe level.` })
    void runAction(() => postJson("/api/demo/trigger", { type: "restock", item }))
  }

  const handleMarkChecked = (item: string) => {
    toast.success("Stock checked", { description: `${item} marked as verified.` })
    void runAction(() => postJson("/api/demo/trigger", { type: "mark-checked", item }))
  }

  const handleStaffAction = (name: string, action: StaffActionKind) => {
    const label =
      action === "counter" ? "moved to counter" : action === "stockroom" ? "sent to stockroom" : "task marked done"
    toast(`${name} ${label}`)
    void runAction(() => postJson("/api/demo/trigger", { type: "staff", name, action }))
  }

  const handleQuickEvent = (kind: QuickEventKind) => {
    toast("New event recorded", { description: quickEventLabels[kind] })
    void runAction(() => postJson("/api/demo/trigger", { type: "quick-event", kind }))
  }

  const handleRunNba = () => {
    if (state.nbaDone) return
    toast.success("Next Best Action taken", { description: state.nextBestAction.cta })
    void runAction(() => postJson("/api/demo/trigger", { type: "nba" }))
  }

  return (
    <div className={cn("min-h-screen bg-background transition-colors", isCritical && "bg-critical-muted/20")}>
      <TopBar
        lastUpdated="just now"
        scenarioLabel={scenarios[state.scenarioId].label}
        status={state.pulseStatus}
        critical={isCritical}
      />

      {isCritical && (
        <div className="border-b border-critical/30 bg-critical text-critical-foreground">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2 text-sm font-medium sm:px-6">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-critical-foreground opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-critical-foreground" />
            </span>
            {state.criticalBanner ?? `Critical condition active — ${state.pulseSubtitle}. Immediate action recommended.`}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Hero command row */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
            <PulseScoreCard
              score={state.pulseScore}
              status={state.pulseStatus}
              subtitle={state.pulseSubtitle}
              updateTick={state.updateTick}
            />
            <NextBestActionCard action={state.nextBestAction} onRun={handleRunNba} done={state.nbaDone} />
            <OperationsMap zones={state.zones} />
          </div>

          {/* Metrics */}
          <MetricCards metrics={metrics} />

          {/* Working area */}
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
            <div className="flex flex-col gap-6">
              <EventStream events={state.events} />
              <SmartAlerts alerts={state.alerts} onResolve={handleResolve} />
            </div>
            <div className="flex flex-col gap-6">
              <ActionBoard tasks={state.tasks} onComplete={handleComplete} highlight={state.highlightTasks} />
              <InventoryStatus
                items={state.inventory}
                onRestock={handleRestock}
                onMarkChecked={handleMarkChecked}
                highlightItem={state.highlightInventory}
              />
              <StaffStatus staff={state.staff} onStaffAction={handleStaffAction} />
            </div>
          </div>

          <DemoControls
            active={state.scenarioId}
            onSelect={handleSelect}
            onQuickEvent={handleQuickEvent}
            onReset={handleReset}
            onResetData={handleResetData}
          />
        </div>
      </main>
    </div>
  )
}
