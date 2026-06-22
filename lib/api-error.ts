import { NextResponse } from "next/server"

/**
 * Map an error thrown by the data layer to an API response.
 *
 * Missing DynamoDB environment variables produce a clear 503 with an
 * actionable message; everything else is a generic 500.
 */
export function apiError(context: string, error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error)
  console.log(`[v0] ${context} failed:`, message)

  if (message.startsWith("Missing DynamoDB environment variable")) {
    return NextResponse.json(
      { error: message, code: "MISSING_ENV" },
      { status: 503 },
    )
  }

  return NextResponse.json({ error: `Failed: ${context}` }, { status: 500 })
}
