import { NextResponse } from "next/server"
import { loadOrSeedDashboard, saveDashboard, seedDashboard } from "@/lib/dynamodb"
import { liveReducer, selectMetrics, type QuickEventKind } from "@/lib/pulse-live"
import type { ScenarioId } from "@/lib/pulse-data"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const SCENARIOS: ScenarioId[] = ["normal", "lunch", "stock", "staff", "recovery"]
const QUICK_EVENTS: QuickEventKind[] = [
  "new-order",
  "complete-order",
  "sell-latte",
  "staff-checkin",
  "inventory-drop",
  "queue-spike",
]

/**
 * POST /api/demo/trigger
 *
 * Body:
 *   { type: "scenario", scenarioId } — reset live state to a scenario baseline
 *   { type: "reset" }                — restore the current scenario baseline
 *   { type: "nba" }                  — run the current Next Best Action
 *   { type: "quick-event", kind }    — apply a quick event
 *   { type: "staff", name, action }  — apply a staff action
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const type = body?.type

    // Scenario switching resets the partition to the baseline for that scenario.
    if (type === "scenario") {
      if (!SCENARIOS.includes(body.scenarioId)) {
        return NextResponse.json({ error: "Invalid scenarioId" }, { status: 400 })
      }
      const state = await seedDashboard(body.scenarioId)
      return NextResponse.json({ state, metrics: selectMetrics(state) })
    }

    const current = await loadOrSeedDashboard()

    if (type === "reset") {
      const state = await seedDashboard(current.scenarioId)
      return NextResponse.json({ state, metrics: selectMetrics(state) })
    }

    let next = current
    switch (type) {
      case "nba":
        next = liveReducer(current, { type: "RUN_NBA" })
        break
      case "quick-event":
        if (!QUICK_EVENTS.includes(body.kind)) {
          return NextResponse.json({ error: "Invalid quick event kind" }, { status: 400 })
        }
        next = liveReducer(current, { type: "QUICK_EVENT", kind: body.kind })
        break
      case "staff":
        if (!body.name || !["counter", "stockroom", "done"].includes(body.action)) {
          return NextResponse.json({ error: "Invalid staff action" }, { status: 400 })
        }
        next = liveReducer(current, { type: "STAFF_ACTION", name: body.name, action: body.action })
        break
      case "restock":
        if (!body.item) {
          return NextResponse.json({ error: "Missing item" }, { status: 400 })
        }
        next = liveReducer(current, { type: "RESTOCK_ITEM", item: body.item })
        break
      case "mark-checked":
        if (!body.item) {
          return NextResponse.json({ error: "Missing item" }, { status: 400 })
        }
        next = liveReducer(current, { type: "MARK_CHECKED", item: body.item })
        break
      default:
        return NextResponse.json({ error: "Unknown trigger type" }, { status: 400 })
    }

    await saveDashboard(next)
    return NextResponse.json({ state: next, metrics: selectMetrics(next) })
  } catch (error) {
    return apiError("POST /api/demo/trigger", error)
  }
}
