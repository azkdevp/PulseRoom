import {
  scenarios,
  type ScenarioId,
  type Scenario,
  type PulseStatus,
  type PulseEvent,
  type SmartAlert,
  type ActionTask,
  type InventoryItem,
  type StaffMember,
  type Zone,
  type NextBestAction,
  type Metric,
  type Priority,
} from "@/lib/pulse-data"

export type QuickEventKind =
  | "new-order"
  | "complete-order"
  | "sell-latte"
  | "staff-checkin"
  | "inventory-drop"
  | "queue-spike"

export type StaffActionKind = "counter" | "stockroom" | "done"

export interface LiveAlert extends SmartAlert {
  resolved?: boolean
}
export interface LiveTask extends ActionTask {
  done?: boolean
}

export interface CoreMetrics {
  revenue: number
  revenueDelta?: string
  revenueDeltaTone?: "up" | "down" | "neutral"
  activeOrders: number
  avgWait: number
  staffOn: number
  staffTotal: number
}

export interface LiveState {
  scenarioId: ScenarioId
  pulseScore: number
  pulseStatus: PulseStatus
  pulseSubtitle: string
  criticalBanner?: string
  nextBestAction: NextBestAction
  zones: Zone[]
  events: PulseEvent[]
  alerts: LiveAlert[]
  tasks: LiveTask[]
  inventory: InventoryItem[]
  staff: StaffMember[]
  core: CoreMetrics
  seq: number
  nextOrderNo: number
  updateTick: number
  /** Item name to spotlight in the inventory table (e.g. after dispatching a restock). */
  highlightInventory?: string
  /** Spotlight open prep tasks on the Action Board. */
  highlightTasks: boolean
  /** Whether the Next Best Action for the current scenario has been executed. */
  nbaDone: boolean
}

const priorityRank: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }

function parseRecovery(recovery: string): number {
  const m = recovery.match(/-?\d+/)
  return m ? Number.parseInt(m[0], 10) : 0
}

function parseMoney(value: string): number {
  return Number.parseInt(value.replace(/[^0-9]/g, ""), 10) || 0
}

function parseInt0(value: string): number {
  const m = value.match(/-?\d+/)
  return m ? Number.parseInt(m[0], 10) : 0
}

function deriveStatus(score: number): PulseStatus {
  if (score >= 80) return "Healthy"
  if (score >= 60) return "Busy"
  return "Critical"
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function initLiveState(scenarioId: ScenarioId): LiveState {
  const s: Scenario = scenarios[scenarioId]
  const revenueMetric = s.metrics.find((m) => m.label === "Revenue Today")
  const activeOrders = parseInt0(s.metrics.find((m) => m.label === "Active Orders")?.value ?? "0")
  const avgWait = parseInt0(s.metrics.find((m) => m.label === "Avg Wait Time")?.value ?? "0")
  const staffRaw = s.metrics.find((m) => m.label === "Staff On Shift")?.value ?? "0/0"
  const [staffOn, staffTotal] = staffRaw.split("/").map((n) => parseInt0(n))

  return {
    scenarioId,
    pulseScore: s.pulseScore,
    pulseStatus: s.pulseStatus,
    pulseSubtitle: s.pulseSubtitle,
    criticalBanner: s.criticalBanner,
    nextBestAction: s.nextBestAction,
    zones: s.zones.map((z) => ({ ...z })),
    events: s.events.map((e) => ({ ...e })),
    alerts: s.alerts.map((a) => ({ ...a })),
    tasks: s.tasks.map((t) => ({ ...t })),
    inventory: s.inventory.map((i) => ({ ...i })),
    staff: s.staff.map((m) => ({ ...m })),
    core: {
      revenue: parseMoney(revenueMetric?.value ?? "$0"),
      revenueDelta: revenueMetric?.delta,
      revenueDeltaTone: revenueMetric?.deltaTone,
      activeOrders,
      avgWait,
      staffOn,
      staffTotal,
    },
    seq: 100,
    nextOrderNo: 1060,
    updateTick: 0,
    highlightInventory: undefined,
    highlightTasks: false,
    nbaDone: false,
  }
}

function pushEvent(
  state: LiveState,
  category: PulseEvent["category"],
  severity: PulseEvent["severity"],
  message: string,
): PulseEvent[] {
  const event: PulseEvent = {
    id: `live-${state.seq + 1}`,
    category,
    severity,
    message,
    time: "just now",
  }
  // Age existing "just now" labels so the newest stays distinct.
  const aged = state.events.map((e) => (e.time === "just now" ? { ...e, time: "moments ago" } : e))
  return [event, ...aged].slice(0, 12)
}

function highestOpenTask(tasks: LiveTask[]): LiveTask | undefined {
  return tasks
    .filter((t) => !t.done)
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])[0]
}

function actionFromTask(task: LiveTask): NextBestAction {
  const tone =
    task.priority === "HIGH" ? "critical" : task.priority === "MEDIUM" ? "warning" : "info"
  return {
    title: task.title,
    detail: `${task.assignee} is assigned. Completing this is projected to recover ${task.recovery} on the Pulse Score.`,
    owner: task.assignee,
    recovery: task.recovery,
    eta: task.priority === "HIGH" ? "Now" : task.priority === "MEDIUM" ? "10 min" : "Today",
    cta: `Mark "${task.title}" done`,
    tone,
  }
}

const steadyAction: NextBestAction = {
  title: "All actions cleared",
  detail: "No open tasks. Keep monitoring the live feed and stock levels to hold the Pulse Score steady.",
  owner: "Sarah",
  recovery: "+0 pts",
  eta: "Ongoing",
  cta: "View prep checklist",
  tone: "info",
}

const restockLevels: Record<string, string> = {
  Milk: "12L",
  "Oat Milk": "9L",
  Croissants: "18",
  "Coffee Beans": "3kg",
  Cups: "200",
}

export type LiveAction =
  | { type: "SELECT_SCENARIO"; id: ScenarioId }
  | { type: "RESET" }
  | { type: "COMPLETE_TASK"; id: string }
  | { type: "RESOLVE_ALERT"; id: string }
  | { type: "RESTOCK_ITEM"; item: string }
  | { type: "MARK_CHECKED"; item: string }
  | { type: "STAFF_ACTION"; name: string; action: StaffActionKind }
  | { type: "QUICK_EVENT"; kind: QuickEventKind }
  | { type: "RUN_NBA" }

function bump(state: LiveState, delta: number): { pulseScore: number; pulseStatus: PulseStatus } {
  const pulseScore = clampScore(state.pulseScore + delta)
  return { pulseScore, pulseStatus: deriveStatus(pulseScore) }
}

export function liveReducer(state: LiveState, action: LiveAction): LiveState {
  switch (action.type) {
    case "SELECT_SCENARIO":
      return initLiveState(action.id)

    case "RESET":
      return initLiveState(state.scenarioId)

    case "COMPLETE_TASK": {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task || task.done) return state
      const topBefore = highestOpenTask(state.tasks)
      const isCriticalCtx = state.pulseStatus === "Critical" || task.priority === "HIGH"
      const pts = parseRecovery(task.recovery)
      const delta = isCriticalCtx ? pts : Math.round(pts / 2)
      const tasks = state.tasks.map((t) => (t.id === action.id ? { ...t, done: true } : t))
      const events = pushEvent(state, "STAFF", "info", `${task.assignee} completed: ${task.title}`)
      const scoreState = bump(state, delta)
      // Update Next Best Action only when the highest-priority task was completed.
      let nextBestAction = state.nextBestAction
      if (topBefore && topBefore.id === action.id) {
        const newTop = highestOpenTask(tasks)
        nextBestAction = newTop ? actionFromTask(newTop) : steadyAction
      }
      return {
        ...state,
        tasks,
        events,
        nextBestAction,
        ...scoreState,
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "RESOLVE_ALERT": {
      const alert = state.alerts.find((a) => a.id === action.id)
      if (!alert || alert.resolved) return state
      const alerts = state.alerts.map((a) => (a.id === action.id ? { ...a, resolved: true } : a))
      const events = pushEvent(state, "ALERT", "info", `Alert resolved: ${alert.title}`)
      const delta = alert.severity === "CRITICAL" ? 4 : alert.severity === "WARNING" ? 2 : 1
      const scoreState = bump(state, delta)
      return {
        ...state,
        alerts,
        events,
        ...scoreState,
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "RESTOCK_ITEM": {
      const item = state.inventory.find((i) => i.item === action.item)
      if (!item) return state
      const safeLevel = restockLevels[action.item] ?? item.threshold
      const inventory = state.inventory.map((i) =>
        i.item === action.item ? { ...i, stock: safeLevel, status: "OK" as const, runout: "—" } : i,
      )
      const events = pushEvent(state, "STOCK", "info", `${action.item} restocked to ${safeLevel}`)
      // If milk is restocked during a shortage, reopen the Barista Station zone.
      let zones = state.zones
      if (action.item === "Milk") {
        zones = state.zones.map((z) =>
          z.name === "Barista Station" && z.status === "ALERT"
            ? { ...z, status: "OK" as const, detail: "Milk drinks back online", load: 55 }
            : z,
        )
      }
      const delta = action.item === "Milk" ? 5 : 2
      const scoreState = bump(state, delta)
      return {
        ...state,
        inventory,
        zones,
        events,
        ...scoreState,
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "MARK_CHECKED": {
      const item = state.inventory.find((i) => i.item === action.item)
      if (!item) return state
      const inventory = state.inventory.map((i) =>
        i.item === action.item ? { ...i, status: "OK" as const } : i,
      )
      const events = pushEvent(state, "STOCK", "info", `${action.item} stock check confirmed`)
      const scoreState = bump(state, 1)
      return {
        ...state,
        inventory,
        events,
        ...scoreState,
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "STAFF_ACTION": {
      const member = state.staff.find((m) => m.name === action.name)
      if (!member) return state
      let task = member.task
      let status = member.status
      let role = member.role
      let message = ""
      let delta = 1
      if (action.action === "counter") {
        task = "Serving at counter"
        status = "ACTIVE"
        role = "Counter"
        message = `${member.name} reassigned to the counter`
        delta = 2
      } else if (action.action === "stockroom") {
        task = "Storeroom restock"
        status = "BUSY"
        message = `${member.name} sent to the stockroom`
        delta = 1
      } else {
        task = "Available"
        status = "ACTIVE"
        message = `${member.name} marked current task done`
        delta = 2
      }
      const staff = state.staff.map((m) =>
        m.name === action.name ? { ...m, task, status, role } : m,
      )
      const events = pushEvent(state, "STAFF", "info", message)
      const scoreState = bump(state, delta)
      return {
        ...state,
        staff,
        events,
        ...scoreState,
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "QUICK_EVENT": {
      const core = { ...state.core }
      let category: PulseEvent["category"] = "ORDER"
      let severity: PulseEvent["severity"] = "info"
      let message = ""
      let delta = 0
      let nextOrderNo = state.nextOrderNo

      switch (action.kind) {
        case "new-order": {
          core.activeOrders += 1
          nextOrderNo += 1
          message = `New order #${nextOrderNo} received`
          delta = -1
          break
        }
        case "complete-order": {
          core.activeOrders = Math.max(0, core.activeOrders - 1)
          const amount = 12 + Math.floor(Math.random() * 30)
          core.revenue += amount
          nextOrderNo += 1
          message = `Order #${nextOrderNo} completed — $${amount}.00`
          delta = 1
          break
        }
        case "sell-latte": {
          core.revenue += 7
          message = "Iced latte sold — $6.50"
          delta = 1
          break
        }
        case "staff-checkin": {
          core.staffOn = Math.min(core.staffTotal, core.staffOn + 1)
          category = "STAFF"
          message = "Rayan checked in — back on shift"
          delta = 3
          break
        }
        case "inventory-drop": {
          category = "STOCK"
          severity = "warning"
          const milk = state.inventory.find((i) => i.item === "Milk")
          const current = milk ? parseInt0(milk.stock) : 0
          const next = Math.max(0, current - 3)
          message = `Milk dropped to ${next}L`
          delta = -3
          break
        }
        case "queue-spike": {
          core.activeOrders += 5
          core.avgWait += 2
          category = "ALERT"
          severity = "critical"
          message = "Customer queue spike — +5 orders incoming"
          delta = -4
          break
        }
      }

      let inventory = state.inventory
      if (action.kind === "inventory-drop") {
        inventory = state.inventory.map((i) => {
          if (i.item !== "Milk") return i
          const next = Math.max(0, parseInt0(i.stock) - 3)
          const status = next <= parseInt0(i.threshold) ? ("LOW" as const) : i.status
          return { ...i, stock: `${next}L`, status, runout: next === 0 ? "now" : "~25 min" }
        })
      }

      const events = pushEvent(state, category, severity, message)
      const pulseScore = clampScore(state.pulseScore + delta)
      return {
        ...state,
        core,
        inventory,
        events,
        nextOrderNo,
        pulseScore,
        pulseStatus: deriveStatus(pulseScore),
        seq: state.seq + 1,
        updateTick: state.updateTick + 1,
      }
    }

    case "RUN_NBA": {
      if (state.nbaDone) return state
      const pts = parseRecovery(state.nextBestAction.recovery)

      switch (state.scenarioId) {
        case "normal": {
          // Highlight prep tasks so the owner can run the morning checklist.
          const events = pushEvent(state, "STAFF", "info", "Prep checklist opened — morning tasks highlighted")
          const scoreState = bump(state, Math.max(2, Math.round(pts / 2)))
          return {
            ...state,
            events,
            highlightTasks: true,
            nbaDone: true,
            ...scoreState,
            seq: state.seq + 1,
            updateTick: state.updateTick + 1,
          }
        }

        case "lunch": {
          // Move Mike to counter support, easing the queue and wait time.
          const staff = state.staff.map((m) =>
            m.name === "Mike"
              ? { ...m, role: "Counter Support", status: "ACTIVE" as const, task: "Counter support" }
              : m,
          )
          const core = { ...state.core, avgWait: Math.max(0, state.core.avgWait - 2) }
          const zones = state.zones.map((z) =>
            z.name === "Counter"
              ? { ...z, status: "OK" as const, detail: "Second register open", load: 60 }
              : z,
          )
          const events = pushEvent(state, "STAFF", "info", "Mike moved to counter support — second register open")
          const scoreState = bump(state, pts || 9)
          return {
            ...state,
            staff,
            core,
            zones,
            events,
            nbaDone: true,
            ...scoreState,
            seq: state.seq + 1,
            updateTick: state.updateTick + 1,
          }
        }

        case "stock": {
          // Dispatch Sarah to the storeroom and spotlight the milk item.
          const staff = state.staff.map((m) =>
            m.name === "Sarah"
              ? { ...m, status: "BUSY" as const, task: "Restocking Milk" }
              : m,
          )
          const events = pushEvent(state, "STAFF", "info", "Sarah dispatched to storeroom for emergency milk restock")
          const scoreState = bump(state, Math.max(4, Math.round(pts / 3)))
          return {
            ...state,
            staff,
            events,
            highlightInventory: "Milk",
            nbaDone: true,
            ...scoreState,
            seq: state.seq + 1,
            updateTick: state.updateTick + 1,
          }
        }

        case "staff": {
          // Reassign the overdue floor check from Asha to Rayan.
          const staff = state.staff.map((m) => {
            if (m.name === "Asha") return { ...m, status: "ACTIVE" as const, task: "Reassigned to Rayan" }
            if (m.name === "Rayan") return { ...m, role: "Floor", status: "BUSY" as const, task: "Floor check" }
            return m
          })
          const tasks = state.tasks.map((t) =>
            t.title.toLowerCase().includes("floor")
              ? { ...t, assignee: "Rayan", title: t.title.replace(/reassign /i, "") }
              : t,
          )
          const zones = state.zones.map((z) =>
            z.name === "Floor"
              ? { ...z, status: "OK" as const, detail: "Rayan covering floor", load: 45 }
              : z,
          )
          const events = pushEvent(state, "STAFF", "info", "Overdue floor check reassigned to Rayan")
          const scoreState = bump(state, pts || 14)
          return {
            ...state,
            staff,
            tasks,
            zones,
            events,
            nbaDone: true,
            ...scoreState,
            seq: state.seq + 1,
            updateTick: state.updateTick + 1,
          }
        }

        case "recovery": {
          // Close out the recovery checklist: mark all tasks done and stabilize.
          const tasks = state.tasks.map((t) => ({ ...t, done: true }))
          const events = pushEvent(state, "ALERT", "info", "Recovery checklist closed — systems stabilized")
          const scoreState = bump(state, pts || 7)
          return {
            ...state,
            tasks,
            events,
            pulseSubtitle: "Recovery complete — systems stabilized",
            nextBestAction: steadyAction,
            nbaDone: true,
            ...scoreState,
            seq: state.seq + 1,
            updateTick: state.updateTick + 1,
          }
        }

        default:
          return state
      }
    }

    default:
      return state
  }
}

/** Build the display metric cards from live core values + derived counts. */
export function selectMetrics(state: LiveState): Metric[] {
  const lowStock = state.inventory.filter((i) => i.status === "LOW" || i.status === "WATCH").length
  const openTasks = state.tasks.filter((t) => !t.done).length
  const { core } = state
  return [
    {
      label: "Revenue Today",
      value: `$${core.revenue.toLocaleString()}`,
      delta: core.revenueDelta,
      deltaTone: core.revenueDeltaTone,
    },
    { label: "Active Orders", value: `${core.activeOrders}` },
    { label: "Avg Wait Time", value: `${core.avgWait} min`, tone: core.avgWait >= 5 ? "warning" : "default" },
    {
      label: "Staff On Shift",
      value: `${core.staffOn}/${core.staffTotal}`,
      tone: core.staffOn < core.staffTotal - 1 ? "warning" : "default",
    },
    { label: "Low Stock Items", value: `${lowStock}`, tone: lowStock > 0 ? "warning" : "default" },
    { label: "Open Tasks", value: `${openTasks}`, tone: openTasks > 0 ? "info" : "default" },
  ]
}
