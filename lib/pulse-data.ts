export type Severity = "info" | "warning" | "critical"
export type EventCategory = "ORDER" | "STOCK" | "STAFF" | "ALERT"
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO"
export type Priority = "HIGH" | "MEDIUM" | "LOW"
export type InventoryStatus = "LOW" | "WATCH" | "OK"
export type StaffStatus = "ACTIVE" | "BUSY" | "OVERDUE"
export type PulseStatus = "Healthy" | "Busy" | "Critical" | "Recovering"
export type ZoneStatus = "OK" | "BUSY" | "ALERT" | "IDLE"

export type ScenarioId = "normal" | "lunch" | "stock" | "staff" | "recovery"

export interface PulseEvent {
  id: string
  category: EventCategory
  severity: Severity
  message: string
  time: string
}

export interface Metric {
  label: string
  value: string
  delta?: string
  deltaTone?: "up" | "down" | "neutral"
  tone?: "default" | "warning" | "info"
}

export interface SmartAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  impact: string
  recommendedAction: string
}

export interface ActionTask {
  id: string
  priority: Priority
  title: string
  assignee: string
  recovery: string
}

export interface InventoryItem {
  item: string
  stock: string
  threshold: string
  status: InventoryStatus
  runout: string
}

export interface StaffMember {
  name: string
  role: string
  status: StaffStatus
  task: string
}

export interface Zone {
  name: string
  status: ZoneStatus
  detail: string
  load: number
}

export interface NextBestAction {
  title: string
  detail: string
  owner: string
  recovery: string
  eta: string
  cta: string
  tone: "info" | "warning" | "critical" | "success"
}

export interface Scenario {
  id: ScenarioId
  label: string
  pulseScore: number
  pulseStatus: PulseStatus
  pulseSubtitle: string
  criticalBanner?: string
  nextBestAction: NextBestAction
  zones: Zone[]
  metrics: Metric[]
  events: PulseEvent[]
  alerts: SmartAlert[]
  tasks: ActionTask[]
  inventory: InventoryItem[]
  staff: StaffMember[]
}

const baseInventory: InventoryItem[] = [
  { item: "Milk", stock: "8L", threshold: "10L", status: "LOW", runout: "38 min" },
  { item: "Coffee Beans", stock: "2.4kg", threshold: "1kg", status: "OK", runout: "—" },
  { item: "Croissants", stock: "12", threshold: "10", status: "OK", runout: "—" },
  { item: "Oat Milk", stock: "4L", threshold: "3L", status: "WATCH", runout: "2.1 hrs" },
  { item: "Cups", stock: "180", threshold: "50", status: "OK", runout: "—" },
]

export const scenarios: Record<ScenarioId, Scenario> = {
  normal: {
    id: "normal",
    label: "Normal",
    pulseScore: 86,
    pulseStatus: "Healthy",
    pulseSubtitle: "All systems operating normally",
    nextBestAction: {
      title: "Monitor morning prep",
      detail: "All systems are steady ahead of the morning peak. Keep an eye on prep stations and stock levels so the team stays ahead of demand.",
      owner: "Sarah",
      recovery: "+6 pts",
      eta: "Ongoing",
      cta: "View prep checklist",
      tone: "info",
    },
    zones: [
      { name: "Counter", status: "OK", detail: "2 staff · steady", load: 45 },
      { name: "Barista Station", status: "BUSY", detail: "Queue of 4 drinks", load: 70 },
      { name: "Kitchen", status: "OK", detail: "Prep on track", load: 40 },
      { name: "Floor", status: "ALERT", detail: "Check overdue", load: 30 },
    ],
    metrics: [
      { label: "Revenue Today", value: "$2,847", delta: "+18% vs yesterday", deltaTone: "up" },
      { label: "Active Orders", value: "12" },
      { label: "Avg Wait Time", value: "4 min" },
      { label: "Staff On Shift", value: "5/6" },
      { label: "Low Stock Items", value: "1", tone: "warning" },
      { label: "Open Tasks", value: "3", tone: "info" },
    ],
    events: [
      { id: "e1", category: "ORDER", severity: "info", message: "Order #1047 completed — $28.50", time: "1 min ago" },
      { id: "e2", category: "STOCK", severity: "critical", message: "Milk stock low — 8L remaining, threshold 10L", time: "3 min ago" },
      { id: "e3", category: "STAFF", severity: "warning", message: "Floor check task overdue — Asha", time: "5 min ago" },
      { id: "e4", category: "ORDER", severity: "info", message: "Order #1046 completed — $14.00", time: "6 min ago" },
      { id: "e5", category: "ALERT", severity: "critical", message: "Order queue rising — avg wait 4 min", time: "8 min ago" },
      { id: "e6", category: "ORDER", severity: "info", message: "Order #1045 completed — $33.00", time: "10 min ago" },
    ],
    alerts: [
      {
        id: "a1",
        severity: "CRITICAL",
        title: "Milk will run out soon",
        description: "Current stock 8L. Estimated runout in 38 minutes at current rate.",
        impact: "Milk drinks pause · ~40% of orders affected",
        recommendedAction: "Restock 12L from storeroom now",
      },
      {
        id: "a2",
        severity: "WARNING",
        title: "Wait time rising",
        description: "Average wait time approaching 5 minutes.",
        impact: "Customer satisfaction dips · queue grows",
        recommendedAction: "Move one staff member to the counter",
      },
    ],
    tasks: [
      { id: "t1", priority: "HIGH", title: "Restock milk fridge", assignee: "Sarah", recovery: "+6 pts" },
      { id: "t2", priority: "HIGH", title: "Move staff to counter", assignee: "Mike", recovery: "+4 pts" },
      { id: "t3", priority: "MEDIUM", title: "Floor cleaning check", assignee: "Asha", recovery: "+2 pts" },
    ],
    inventory: baseInventory,
    staff: [
      { name: "Sarah", role: "Counter", status: "ACTIVE", task: "Serving customers" },
      { name: "Mike", role: "Barista", status: "BUSY", task: "Order queue" },
      { name: "Nimal", role: "Kitchen", status: "ACTIVE", task: "Food prep" },
      { name: "Asha", role: "Floor", status: "OVERDUE", task: "Floor check pending" },
      { name: "Rayan", role: "Delivery", status: "ACTIVE", task: "On route" },
    ],
  },
  lunch: {
    id: "lunch",
    label: "Morning Rush",
    pulseScore: 72,
    pulseStatus: "Busy",
    pulseSubtitle: "Morning rush in progress — high order volume",
    nextBestAction: {
      title: "Open a second register at the counter",
      detail: "Order volume is up 120%. A second register cuts the queue in half and pulls wait time back under 5 minutes.",
      owner: "Sarah",
      recovery: "+9 pts",
      eta: "2 min",
      cta: "Move Mike to counter",
      tone: "warning",
    },
    zones: [
      { name: "Counter", status: "BUSY", detail: "Long queue forming", load: 88 },
      { name: "Barista Station", status: "BUSY", detail: "12 drinks queued", load: 92 },
      { name: "Kitchen", status: "BUSY", detail: "Food backlog", load: 80 },
      { name: "Floor", status: "OK", detail: "Tables turning", load: 55 },
    ],
    metrics: [
      { label: "Revenue Today", value: "$3,612", delta: "+34% vs yesterday", deltaTone: "up" },
      { label: "Active Orders", value: "27" },
      { label: "Avg Wait Time", value: "7 min", tone: "warning" },
      { label: "Staff On Shift", value: "6/6" },
      { label: "Low Stock Items", value: "2", tone: "warning" },
      { label: "Open Tasks", value: "5", tone: "info" },
    ],
    events: [
      { id: "e1", category: "ALERT", severity: "warning", message: "Order queue surging — 27 active orders", time: "just now" },
      { id: "e2", category: "ORDER", severity: "info", message: "Order #1052 completed — $41.20", time: "1 min ago" },
      { id: "e3", category: "ALERT", severity: "critical", message: "Avg wait time spiked to 7 min", time: "2 min ago" },
      { id: "e4", category: "STAFF", severity: "info", message: "All staff moved to active service", time: "3 min ago" },
      { id: "e5", category: "ORDER", severity: "info", message: "Order #1051 completed — $19.50", time: "4 min ago" },
      { id: "e6", category: "STOCK", severity: "warning", message: "Oat milk running low — 4L remaining", time: "6 min ago" },
    ],
    alerts: [
      {
        id: "a1",
        severity: "WARNING",
        title: "Morning rush detected",
        description: "Order volume up 120% in the last 15 minutes.",
        impact: "Throughput maxed · wait time climbing",
        recommendedAction: "All hands to counter and barista",
      },
      {
        id: "a2",
        severity: "WARNING",
        title: "Wait time rising",
        description: "Average wait time at 7 minutes and climbing.",
        impact: "Walkouts likely above 8 min wait",
        recommendedAction: "Open a second register",
      },
    ],
    tasks: [
      { id: "t1", priority: "HIGH", title: "Open second register", assignee: "Sarah", recovery: "+9 pts" },
      { id: "t2", priority: "HIGH", title: "Expedite drink queue", assignee: "Mike", recovery: "+5 pts" },
      { id: "t3", priority: "MEDIUM", title: "Clear table backlog", assignee: "Asha", recovery: "+3 pts" },
    ],
    inventory: [
      baseInventory[0],
      baseInventory[1],
      { item: "Croissants", stock: "5", threshold: "10", status: "WATCH", runout: "1.2 hrs" },
      { item: "Oat Milk", stock: "4L", threshold: "3L", status: "WATCH", runout: "1.4 hrs" },
      baseInventory[4],
    ],
    staff: [
      { name: "Sarah", role: "Counter", status: "BUSY", task: "Taking orders" },
      { name: "Mike", role: "Barista", status: "BUSY", task: "Drink queue" },
      { name: "Nimal", role: "Kitchen", status: "BUSY", task: "Food backlog" },
      { name: "Asha", role: "Floor", status: "ACTIVE", task: "Clearing tables" },
      { name: "Rayan", role: "Delivery", status: "ACTIVE", task: "On route" },
    ],
  },
  stock: {
    id: "stock",
    label: "Stock Shortage",
    pulseScore: 54,
    pulseStatus: "Critical",
    pulseSubtitle: "Critical stock shortage — milk depleted",
    criticalBanner:
      "Critical stock shortage: milk depleted. 40% of menu affected. Immediate action recommended.",
    nextBestAction: {
      title: "Emergency milk restock from storeroom",
      detail: "Milk is at 0L and milk-based drinks are blocked. Restocking immediately reopens ~40% of the menu and stops order cancellations.",
      owner: "Sarah",
      recovery: "+18 pts",
      eta: "Now",
      cta: "Dispatch Sarah to storeroom",
      tone: "critical",
    },
    zones: [
      { name: "Counter", status: "ALERT", detail: "Refunding orders", load: 60 },
      { name: "Barista Station", status: "ALERT", detail: "Milk drinks blocked", load: 35 },
      { name: "Kitchen", status: "OK", detail: "Food prep normal", load: 45 },
      { name: "Floor", status: "ALERT", detail: "Check overdue", load: 30 },
    ],
    metrics: [
      { label: "Revenue Today", value: "$2,910", delta: "+12% vs yesterday", deltaTone: "up" },
      { label: "Active Orders", value: "14" },
      { label: "Avg Wait Time", value: "6 min", tone: "warning" },
      { label: "Staff On Shift", value: "5/6" },
      { label: "Low Stock Items", value: "3", tone: "warning" },
      { label: "Open Tasks", value: "6", tone: "info" },
    ],
    events: [
      { id: "e1", category: "STOCK", severity: "critical", message: "Milk OUT OF STOCK — 0L remaining", time: "just now" },
      { id: "e2", category: "ALERT", severity: "critical", message: "Milk-based drinks unavailable", time: "1 min ago" },
      { id: "e3", category: "STOCK", severity: "warning", message: "Oat milk low — 2L remaining", time: "3 min ago" },
      { id: "e4", category: "STAFF", severity: "info", message: "Sarah dispatched to storeroom", time: "4 min ago" },
      { id: "e5", category: "ORDER", severity: "info", message: "Order #1049 completed — $9.50", time: "7 min ago" },
      { id: "e6", category: "STOCK", severity: "warning", message: "Croissants below threshold — 6 left", time: "9 min ago" },
    ],
    alerts: [
      {
        id: "a1",
        severity: "CRITICAL",
        title: "Milk depleted",
        description: "Milk stock is at 0L right now.",
        impact: "Milk drinks blocked · ~40% of menu down",
        recommendedAction: "Restock immediately from storeroom",
      },
      {
        id: "a2",
        severity: "CRITICAL",
        title: "Oat milk critical",
        description: "Oat milk at 2L — the only dairy alternative left.",
        impact: "No fallback if oat milk also runs out",
        recommendedAction: "Pull backup supply from cold store",
      },
    ],
    tasks: [
      { id: "t1", priority: "HIGH", title: "Emergency milk restock", assignee: "Sarah", recovery: "+18 pts" },
      { id: "t2", priority: "HIGH", title: "Pause milk drink orders", assignee: "Mike", recovery: "+6 pts" },
      { id: "t3", priority: "MEDIUM", title: "Restock croissants", assignee: "Nimal", recovery: "+3 pts" },
    ],
    inventory: [
      { item: "Milk", stock: "0L", threshold: "10L", status: "LOW", runout: "now" },
      baseInventory[1],
      { item: "Croissants", stock: "6", threshold: "10", status: "WATCH", runout: "1.5 hrs" },
      { item: "Oat Milk", stock: "2L", threshold: "3L", status: "LOW", runout: "40 min" },
      baseInventory[4],
    ],
    staff: [
      { name: "Sarah", role: "Counter", status: "BUSY", task: "Storeroom restock" },
      { name: "Mike", role: "Barista", status: "BUSY", task: "Managing queue" },
      { name: "Nimal", role: "Kitchen", status: "ACTIVE", task: "Food prep" },
      { name: "Asha", role: "Floor", status: "OVERDUE", task: "Floor check pending" },
      { name: "Rayan", role: "Delivery", status: "ACTIVE", task: "On route" },
    ],
  },
  staff: {
    id: "staff",
    label: "Staff Delay",
    pulseScore: 61,
    pulseStatus: "Critical",
    pulseSubtitle: "Staffing gap — coverage below target",
    nextBestAction: {
      title: "Call in backup coverage",
      detail: "Only 3 of 6 staff are on shift and the barista station is empty. Calling backup restores coverage and pulls wait time down from 9 minutes.",
      owner: "Sarah",
      recovery: "+14 pts",
      eta: "10 min",
      cta: "Reassign task",
      tone: "critical",
    },
    zones: [
      { name: "Counter", status: "BUSY", detail: "1 staff covering 2", load: 90 },
      { name: "Barista Station", status: "ALERT", detail: "Unmanned", load: 15 },
      { name: "Kitchen", status: "BUSY", detail: "Helping at counter", load: 75 },
      { name: "Floor", status: "ALERT", detail: "Check overdue 20 min", load: 25 },
    ],
    metrics: [
      { label: "Revenue Today", value: "$2,540", delta: "-4% vs yesterday", deltaTone: "down" },
      { label: "Active Orders", value: "16" },
      { label: "Avg Wait Time", value: "9 min", tone: "warning" },
      { label: "Staff On Shift", value: "3/6", tone: "warning" },
      { label: "Low Stock Items", value: "1", tone: "warning" },
      { label: "Open Tasks", value: "7", tone: "info" },
    ],
    events: [
      { id: "e1", category: "STAFF", severity: "critical", message: "Mike clocked out — barista station unmanned", time: "just now" },
      { id: "e2", category: "ALERT", severity: "critical", message: "Wait time exceeded 9 min — understaffed", time: "2 min ago" },
      { id: "e3", category: "STAFF", severity: "warning", message: "Asha floor check overdue 20 min", time: "4 min ago" },
      { id: "e4", category: "STAFF", severity: "warning", message: "Only 3 of 6 staff on shift", time: "5 min ago" },
      { id: "e5", category: "ORDER", severity: "info", message: "Order #1043 completed — $22.00", time: "8 min ago" },
      { id: "e6", category: "ALERT", severity: "warning", message: "Order queue backing up", time: "11 min ago" },
    ],
    alerts: [
      {
        id: "a1",
        severity: "CRITICAL",
        title: "Understaffed",
        description: "Only 3 of 6 staff on shift.",
        impact: "Wait times rising fast · revenue down 4%",
        recommendedAction: "Call in backup coverage now",
      },
      {
        id: "a2",
        severity: "WARNING",
        title: "Barista station empty",
        description: "No one is currently at the barista station.",
        impact: "All drink orders stalled",
        recommendedAction: "Reassign a team member to drinks",
      },
    ],
    tasks: [
      { id: "t1", priority: "HIGH", title: "Call in backup staff", assignee: "Sarah", recovery: "+14 pts" },
      { id: "t2", priority: "HIGH", title: "Cover barista station", assignee: "Nimal", recovery: "+7 pts" },
      { id: "t3", priority: "MEDIUM", title: "Reassign floor duties", assignee: "Asha", recovery: "+3 pts" },
    ],
    inventory: baseInventory,
    staff: [
      { name: "Sarah", role: "Counter", status: "BUSY", task: "Covering two stations" },
      { name: "Mike", role: "Barista", status: "OVERDUE", task: "Clocked out" },
      { name: "Nimal", role: "Kitchen", status: "BUSY", task: "Helping at counter" },
      { name: "Asha", role: "Floor", status: "OVERDUE", task: "Floor check pending" },
      { name: "Rayan", role: "Delivery", status: "ACTIVE", task: "On route" },
    ],
  },
  recovery: {
    id: "recovery",
    label: "Recovery",
    pulseScore: 79,
    pulseStatus: "Recovering",
    pulseSubtitle: "Conditions stabilizing — metrics improving",
    nextBestAction: {
      title: "Confirm stock counts and close out alerts",
      detail: "Critical issues are resolved and metrics are climbing. A final stock count locks in the recovery and returns Pulse to healthy range.",
      owner: "Sarah",
      recovery: "+7 pts",
      eta: "8 min",
      cta: "Close recovery checklist",
      tone: "success",
    },
    zones: [
      { name: "Counter", status: "OK", detail: "Queue cleared", load: 40 },
      { name: "Barista Station", status: "OK", detail: "Back to normal", load: 50 },
      { name: "Kitchen", status: "OK", detail: "Prep on track", load: 42 },
      { name: "Floor", status: "OK", detail: "Check complete", load: 35 },
    ],
    metrics: [
      { label: "Revenue Today", value: "$3,180", delta: "+22% vs yesterday", deltaTone: "up" },
      { label: "Active Orders", value: "9" },
      { label: "Avg Wait Time", value: "3 min", tone: "default" },
      { label: "Staff On Shift", value: "6/6" },
      { label: "Low Stock Items", value: "0" },
      { label: "Open Tasks", value: "2", tone: "info" },
    ],
    events: [
      { id: "e1", category: "STOCK", severity: "info", message: "Milk restocked — 24L received", time: "just now" },
      { id: "e2", category: "STAFF", severity: "info", message: "Mike back on barista station", time: "2 min ago" },
      { id: "e3", category: "ALERT", severity: "info", message: "Wait time back to normal — 3 min", time: "3 min ago" },
      { id: "e4", category: "ORDER", severity: "info", message: "Order #1058 completed — $31.00", time: "5 min ago" },
      { id: "e5", category: "STAFF", severity: "info", message: "Floor check completed — Asha", time: "7 min ago" },
      { id: "e6", category: "ORDER", severity: "info", message: "Order #1057 completed — $16.50", time: "9 min ago" },
    ],
    alerts: [
      {
        id: "a1",
        severity: "INFO",
        title: "Systems recovering",
        description: "All critical alerts resolved.",
        impact: "Stock and staffing back to target",
        recommendedAction: "Confirm counts to close out",
      },
      {
        id: "a2",
        severity: "INFO",
        title: "Wait time normalized",
        description: "Average wait time down to 3 minutes.",
        impact: "Queue clearing steadily",
        recommendedAction: "Maintain current staffing",
      },
    ],
    tasks: [
      { id: "t1", priority: "MEDIUM", title: "Confirm stock counts", assignee: "Sarah", recovery: "+5 pts" },
      { id: "t2", priority: "MEDIUM", title: "End-of-rush cleanup", assignee: "Asha", recovery: "+2 pts" },
    ],
    inventory: [
      { item: "Milk", stock: "24L", threshold: "10L", status: "OK", runout: "—" },
      baseInventory[1],
      { item: "Croissants", stock: "18", threshold: "10", status: "OK", runout: "—" },
      { item: "Oat Milk", stock: "9L", threshold: "3L", status: "OK", runout: "—" },
      baseInventory[4],
    ],
    staff: [
      { name: "Sarah", role: "Counter", status: "ACTIVE", task: "Serving customers" },
      { name: "Mike", role: "Barista", status: "ACTIVE", task: "Drink prep" },
      { name: "Nimal", role: "Kitchen", status: "ACTIVE", task: "Food prep" },
      { name: "Asha", role: "Floor", status: "ACTIVE", task: "Floor maintained" },
      { name: "Rayan", role: "Delivery", status: "ACTIVE", task: "On route" },
    ],
  },
}

export const scenarioControls: { id: ScenarioId; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "lunch", label: "Morning Rush" },
  { id: "stock", label: "Stock Shortage" },
  { id: "staff", label: "Staff Delay" },
  { id: "recovery", label: "Recovery" },
]
