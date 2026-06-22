import { NextResponse } from "next/server"
import { seedDashboard } from "@/lib/dynamodb"
import { selectMetrics } from "@/lib/pulse-live"
import type { ScenarioId } from "@/lib/pulse-data"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const SCENARIOS: ScenarioId[] = ["normal", "lunch", "stock", "staff", "recovery"]

// POST /api/seed — reset all demo data to a scenario baseline (defaults to "normal").
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const scenarioId: ScenarioId = SCENARIOS.includes(body?.scenarioId) ? body.scenarioId : "normal"

    const state = await seedDashboard(scenarioId)
    return NextResponse.json({ state, metrics: selectMetrics(state) })
  } catch (error) {
    return apiError("POST /api/seed", error)
  }
}
