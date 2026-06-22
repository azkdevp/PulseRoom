import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb"
import {
  initLiveState,
  type LiveState,
  type LiveAlert,
  type LiveTask,
} from "@/lib/pulse-live"
import type {
  PulseEvent,
  InventoryItem,
  StaffMember,
} from "@/lib/pulse-data"

/**
 * Custom AWS SDK v3 connection to an existing DynamoDB table.
 *
 * Uses ONLY these existing Vercel environment variables:
 *   - AWS_REGION
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - DYNAMODB_TABLE_NAME
 *
 * Single-table design. Every item for the demo business shares one
 * partition key and is distinguished by a typed sort key:
 *
 *   pk = "BUSINESS#bean-co"
 *   sk = "PROFILE"                       -> business profile item
 *        "SNAPSHOT"                      -> latest snapshot item (scalars + derived state)
 *        "EVENT#<ts>#<id>"               -> event items with timestamp and id
 *        "ALERT#<id>"                    -> alert items with id
 *        "TASK#<id>"                     -> task items with id
 *        "INVENTORY#<id>"                -> inventory items with id
 *        "STAFF#<id>"                    -> staff items with id
 *
 * The table must have a String partition key named `PK` and a String
 * sort key named `SK`.
 */

export const BUSINESS_ID = "bean-co"
export const BUSINESS_PK = `BUSINESS#${BUSINESS_ID}`

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME

/**
 * Validate that all four required variables are present before we try to
 * talk to DynamoDB. This turns the AWS SDK's cryptic "Region is missing"
 * into a clear, actionable message naming exactly which vars are unset.
 */
export function assertDynamoEnv(): void {
  const required = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "DYNAMODB_TABLE_NAME",
  ]
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing DynamoDB environment variable(s): ${missing.join(", ")}. ` +
        `Add them to the project's Development environment so the dev server can read them.`,
    )
  }
}

let _docClient: DynamoDBDocumentClient | null = null

function getDocClient(): DynamoDBDocumentClient {
  assertDynamoEnv()
  if (!_docClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })
    _docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    })
  }
  return _docClient
}

// Table key attribute names. The table's key schema uses uppercase PK/SK,
// so every write, query, and delete MUST use these exact names.
const PK_ATTR = "PK"
const SK_ATTR = "SK"

// Sort key prefixes / constants.
const SK = {
  profile: "PROFILE",
  snapshot: "SNAPSHOT",
  event: "EVENT#",
  alert: "ALERT#",
  task: "TASK#",
  inventory: "INVENTORY#",
  staff: "STAFF#",
} as const

/** Inventory/staff items are keyed by a slug of their human-readable name. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

type AnyItem = Record<string, unknown>

/** Build the list of DynamoDB items that represent a full LiveState. */
function serializeState(state: LiveState): AnyItem[] {
  const items: AnyItem[] = []

  // Business profile item.
  items.push({
    [PK_ATTR]: BUSINESS_PK,
    [SK_ATTR]: SK.profile,
    type: "profile",
    businessId: BUSINESS_ID,
    name: "Bean & Co. Café",
    timezone: "local",
  })

  // Latest snapshot item — scalar + derived fields.
  items.push({
    [PK_ATTR]: BUSINESS_PK,
    [SK_ATTR]: SK.snapshot,
    type: "snapshot",
    businessId: BUSINESS_ID,
    scenarioId: state.scenarioId,
    pulseScore: state.pulseScore,
    pulseStatus: state.pulseStatus,
    pulseSubtitle: state.pulseSubtitle,
    criticalBanner: state.criticalBanner,
    nextBestAction: state.nextBestAction,
    zones: state.zones,
    core: state.core,
    seq: state.seq,
    nextOrderNo: state.nextOrderNo,
    updateTick: state.updateTick,
    highlightInventory: state.highlightInventory,
    highlightTasks: state.highlightTasks,
    nbaDone: state.nbaDone,
    updatedAt: Date.now(),
  })

  // Event items with timestamp + id. Newest first in the array, so assign a
  // descending ts to preserve order on reload.
  const baseTs = Date.now()
  state.events.forEach((e, index) => {
    const ts = baseTs - index
    items.push({
      [PK_ATTR]: BUSINESS_PK,
      [SK_ATTR]: `${SK.event}${ts}#${e.id}`,
      type: "event",
      ts,
      eventId: e.id,
      category: e.category,
      severity: e.severity,
      message: e.message,
      time: e.time,
    })
  })

  // Alert items with id.
  state.alerts.forEach((a) => {
    items.push({
      [PK_ATTR]: BUSINESS_PK,
      [SK_ATTR]: `${SK.alert}${a.id}`,
      type: "alert",
      alertId: a.id,
      severity: a.severity,
      title: a.title,
      description: a.description,
      impact: a.impact,
      recommendedAction: a.recommendedAction,
      resolved: a.resolved ?? false,
    })
  })

  // Task items with id.
  state.tasks.forEach((t) => {
    items.push({
      [PK_ATTR]: BUSINESS_PK,
      [SK_ATTR]: `${SK.task}${t.id}`,
      type: "task",
      taskId: t.id,
      priority: t.priority,
      title: t.title,
      assignee: t.assignee,
      recovery: t.recovery,
      done: t.done ?? false,
    })
  })

  // Inventory items with id.
  state.inventory.forEach((i, index) => {
    items.push({
      [PK_ATTR]: BUSINESS_PK,
      [SK_ATTR]: `${SK.inventory}${slug(i.item)}`,
      type: "inventory",
      itemId: slug(i.item),
      order: index,
      item: i.item,
      stock: i.stock,
      threshold: i.threshold,
      status: i.status,
      runout: i.runout,
    })
  })

  // Staff items with id.
  state.staff.forEach((m, index) => {
    items.push({
      [PK_ATTR]: BUSINESS_PK,
      [SK_ATTR]: `${SK.staff}${slug(m.name)}`,
      type: "staff",
      staffId: slug(m.name),
      order: index,
      name: m.name,
      role: m.role,
      status: m.status,
      task: m.task,
    })
  })

  return items
}

/** Reconstruct a LiveState from the raw DynamoDB items of the business partition. */
function deserializeState(items: AnyItem[]): LiveState | null {
  const snapshot = items.find((i) => i[SK_ATTR] === SK.snapshot)
  if (!snapshot) return null

  const events: PulseEvent[] = items
    .filter((i) => typeof i[SK_ATTR] === "string" && (i[SK_ATTR] as string).startsWith(SK.event))
    .sort((a, b) => (b.ts as number) - (a.ts as number))
    .map((i) => ({
      id: i.eventId as string,
      category: i.category as PulseEvent["category"],
      severity: i.severity as PulseEvent["severity"],
      message: i.message as string,
      time: i.time as string,
    }))

  const alerts: LiveAlert[] = items
    .filter((i) => typeof i[SK_ATTR] === "string" && (i[SK_ATTR] as string).startsWith(SK.alert))
    .map((i) => ({
      id: i.alertId as string,
      severity: i.severity as LiveAlert["severity"],
      title: i.title as string,
      description: i.description as string,
      impact: i.impact as string,
      recommendedAction: i.recommendedAction as string,
      resolved: Boolean(i.resolved),
    }))

  const tasks: LiveTask[] = items
    .filter((i) => typeof i[SK_ATTR] === "string" && (i[SK_ATTR] as string).startsWith(SK.task))
    .map((i) => ({
      id: i.taskId as string,
      priority: i.priority as LiveTask["priority"],
      title: i.title as string,
      assignee: i.assignee as string,
      recovery: i.recovery as string,
      done: Boolean(i.done),
    }))

  const inventory: InventoryItem[] = items
    .filter((i) => typeof i[SK_ATTR] === "string" && (i[SK_ATTR] as string).startsWith(SK.inventory))
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((i) => ({
      item: i.item as string,
      stock: i.stock as string,
      threshold: i.threshold as string,
      status: i.status as InventoryItem["status"],
      runout: i.runout as string,
    }))

  const staff: StaffMember[] = items
    .filter((i) => typeof i[SK_ATTR] === "string" && (i[SK_ATTR] as string).startsWith(SK.staff))
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((i) => ({
      name: i.name as string,
      role: i.role as string,
      status: i.status as StaffMember["status"],
      task: i.task as string,
    }))

  return {
    scenarioId: snapshot.scenarioId as LiveState["scenarioId"],
    pulseScore: snapshot.pulseScore as number,
    pulseStatus: snapshot.pulseStatus as LiveState["pulseStatus"],
    pulseSubtitle: snapshot.pulseSubtitle as string,
    criticalBanner: snapshot.criticalBanner as string | undefined,
    nextBestAction: snapshot.nextBestAction as LiveState["nextBestAction"],
    zones: snapshot.zones as LiveState["zones"],
    core: snapshot.core as LiveState["core"],
    events,
    alerts,
    tasks,
    inventory,
    staff,
    seq: snapshot.seq as number,
    nextOrderNo: snapshot.nextOrderNo as number,
    updateTick: snapshot.updateTick as number,
    highlightInventory: snapshot.highlightInventory as string | undefined,
    highlightTasks: Boolean(snapshot.highlightTasks),
    nbaDone: Boolean(snapshot.nbaDone),
  }
}

/** Query every item in the business partition. */
async function queryBusiness(): Promise<AnyItem[]> {
  const items: AnyItem[] = []
  let lastKey: AnyItem | undefined

  do {
    const res = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: { "#pk": PK_ATTR },
        ExpressionAttributeValues: { ":pk": BUSINESS_PK },
        ExclusiveStartKey: lastKey,
      }),
    )
    if (res.Items) items.push(...(res.Items as AnyItem[]))
    lastKey = res.LastEvaluatedKey as AnyItem | undefined
  } while (lastKey)

  return items
}

/** Batch-delete a set of items by their PK/SK keys. */
async function batchDelete(keys: AnyItem[]): Promise<void> {
  for (const group of chunk(keys, 25)) {
    await getDocClient().send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME as string]: group.map((Key) => ({ DeleteRequest: { Key } })),
        },
      }),
    )
  }
}

/** Batch-put a set of items. */
async function batchPut(items: AnyItem[]): Promise<void> {
  for (const group of chunk(items, 25)) {
    await getDocClient().send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME as string]: group.map((Item) => ({ PutRequest: { Item } })),
        },
      }),
    )
  }
}

/** Load the full dashboard state from DynamoDB. Returns null when unseeded. */
export async function loadDashboard(): Promise<LiveState | null> {
  const items = await queryBusiness()
  if (items.length === 0) return null
  return deserializeState(items)
}

/**
 * Persist the full dashboard state. Clears the existing business partition and
 * rewrites every item so the database always reflects the current LiveState.
 */
export async function saveDashboard(state: LiveState): Promise<void> {
  const existing = await queryBusiness()
  if (existing.length > 0) {
    await batchDelete(existing.map((i) => ({ [PK_ATTR]: i[PK_ATTR] as string, [SK_ATTR]: i[SK_ATTR] as string })))
  }
  await batchPut(serializeState(state))
}

/** Seed (or reset) the database to the given scenario baseline. Defaults to "normal". */
export async function seedDashboard(
  scenarioId: LiveState["scenarioId"] = "normal",
): Promise<LiveState> {
  const state = initLiveState(scenarioId)
  await saveDashboard(state)
  return state
}

/** Load existing state, or seed the default baseline if the table is empty. */
export async function loadOrSeedDashboard(): Promise<LiveState> {
  const existing = await loadDashboard()
  if (existing) return existing
  return seedDashboard("normal")
}
