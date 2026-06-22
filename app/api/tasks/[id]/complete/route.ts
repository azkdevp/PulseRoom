import { NextResponse } from "next/server"
import { loadOrSeedDashboard, saveDashboard } from "@/lib/dynamodb"
import { liveReducer, selectMetrics } from "@/lib/pulse-live"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

// POST /api/tasks/[id]/complete — mark a task complete and persist new state.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const current = await loadOrSeedDashboard()

    const task = current.tasks.find((t) => t.id === id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const next = liveReducer(current, { type: "COMPLETE_TASK", id })
    await saveDashboard(next)
    return NextResponse.json({ state: next, metrics: selectMetrics(next) })
  } catch (error) {
    return apiError("POST /api/tasks/[id]/complete", error)
  }
}
