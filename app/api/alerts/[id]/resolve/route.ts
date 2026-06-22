import { NextResponse } from "next/server"
import { loadOrSeedDashboard, saveDashboard } from "@/lib/dynamodb"
import { liveReducer, selectMetrics } from "@/lib/pulse-live"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

// POST /api/alerts/[id]/resolve — resolve an alert and persist new state.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const current = await loadOrSeedDashboard()

    const alert = current.alerts.find((a) => a.id === id)
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    const next = liveReducer(current, { type: "RESOLVE_ALERT", id })
    await saveDashboard(next)
    return NextResponse.json({ state: next, metrics: selectMetrics(next) })
  } catch (error) {
    return apiError("POST /api/alerts/[id]/resolve", error)
  }
}
