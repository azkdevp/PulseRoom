import { NextResponse } from "next/server"
import { loadOrSeedDashboard } from "@/lib/dynamodb"
import { selectMetrics } from "@/lib/pulse-live"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

// GET /api/dashboard — load the full dashboard state (seeds baseline if empty).
export async function GET() {
  try {
    const state = await loadOrSeedDashboard()
    return NextResponse.json({ state, metrics: selectMetrics(state) })
  } catch (error) {
    return apiError("GET /api/dashboard", error)
  }
}
