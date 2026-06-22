# PulseRoom

**Live operating room for coffee shops and small businesses.**

PulseRoom is a real-time operations dashboard that helps small business owners understand what is happening during a shift, what is about to go wrong, and what action to take next.

It was built for the **H0: Hack the Zero Stack with Vercel v0 and AWS Databases** hackathon using **Vercel, v0, Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, and Amazon DynamoDB**.

---

## Problem

Small business owners often see operational problems too late.

In a coffee shop, a few missed signals can quickly become lost sales:

- A queue starts building before anyone reacts
- Milk or ingredients run low during service
- Staff get overloaded in the wrong zone
- Rush-period tasks are missed
- The owner has to rely on memory, staff messages, and quick checks

By the time the problem is visible, customers may already be waiting and revenue may already be at risk.

---

## Solution

PulseRoom gives small businesses one live screen for the shift.

The dashboard shows:

- **Pulse Score** — a single health metric for the business
- **Live Events** — real-time operational activity
- **Smart Alerts** — critical issues before they escalate
- **Next Best Action** — recommended action for the owner or manager
- **Inventory Status** — current stock and low-stock risks
- **Staff Status** — staff availability and task ownership
- **Operations Map** — visual view of pressure points
- **Action Board** — tasks created from operational signals

PulseRoom is not a static dashboard. It is a live decision layer for the shift.

---

## Demo Scenario

The demo is based on a fictional coffee shop called **Bean & Co. Café**.

Judges or users can test several operating states:

1. **Normal Service** — baseline café operations
2. **Morning Rush** — increased order pressure and wait time
3. **Stock Shortage** — critical milk shortage and blocked menu items
4. **Staff Delay** — staffing pressure and coverage issues
5. **Recovery** — café moves back toward a stable operating state

The app also includes quick event controls such as:

- New Order
- Complete Order
- Sell Iced Latte
- Staff Check-in
- Inventory Drop
- Customer Queue Spike

Each interaction updates the dashboard state and writes operational data to Amazon DynamoDB.

---

## Why DynamoDB

PulseRoom is event-driven, not report-driven.

A small business creates many small operational updates during a shift:

- Order flow changes
- Inventory checks
- Staff updates
- Task completions
- Alert state changes
- Manager actions
- Metric snapshots

Amazon DynamoDB is used as the operational memory of the business.

It was chosen because PulseRoom needs:

- Low-latency reads and writes for frequent operational changes
- Flexible item types in one table
- A scalable structure that can grow from one café to many businesses and locations
- Fast dashboard updates from changing business state

---

## Architecture

PulseRoom uses a Vercel-hosted Next.js application with backend API routes that read and write operational state to Amazon DynamoDB.

```text
Business Owner / Manager
        ↓
Vercel-hosted Next.js Frontend
        ↓
Next.js API Routes
        ↓
Amazon DynamoDB
        ↓
Live Dashboard State
```

DynamoDB stores the live state for Bean & Co. Café, including:

- Business profile
- Metric snapshots
- Inventory items
- Staff status
- Smart alerts
- Tasks
- Live events

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **AI/UI Build:** v0
- **Deployment:** Vercel
- **Database:** Amazon DynamoDB
- **Backend:** Next.js API Routes / Vercel Serverless Functions
- **AWS SDK:** AWS SDK v3

---

## Key Features

### Real-Time Pulse Score

The Pulse Score summarizes the current health of the business based on operational pressure, inventory state, staffing, tasks, and alerts.

### Smart Alerts

PulseRoom highlights critical issues such as stock shortages, staffing gaps, and service pressure.

### Next Best Action

Instead of only showing a problem, PulseRoom recommends what the owner or manager should do next.

### Action Board

Operational signals can create tasks, and task completions are recorded as part of the live business state.

### Live Events

Every important change is shown in the event stream so the owner can understand what happened during the shift.

### DynamoDB-Backed State

Scenario changes, quick events, task completions, alert resolutions, and reset actions update operational data in DynamoDB.

---

## Future Implementation

The MVP reacts to live operational changes. The next version will move toward predictive operations.

Planned modules include:

- **Order-time prediction**  
  Predict when active orders are likely to be delayed.

- **Shift pressure prediction**  
  Detect when staff coverage is likely to fall behind demand.

- **Inventory runout prediction**  
  Estimate when key items such as milk, cups, or ingredients may run out.

- **Queue logic with computer vision**  
  Count people in the queue line and combine queue length with order flow.

- **Staff notifications**  
  Send next best actions through WhatsApp, tablet, or a lightweight staff app.

- **Multi-location intelligence**  
  Help owners manage multiple stores from one operational command center.

Historical operational data stored in DynamoDB can become the foundation for prediction and optimization.

---

## Business Model

PulseRoom is designed as a monetizable B2B SaaS product.

Possible pricing:

- **Starter:** single-location cafés and small shops
- **Growth:** multi-location operators
- **Enterprise:** chains and franchise groups

Future add-ons could include:

- Prediction engine
- Staff notifications
- Computer vision queue counting
- Multi-location reporting
- Advanced operational analytics

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```bash
http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` file with the following values:

```bash
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE_NAME=
```

Make sure the DynamoDB table exists and that the AWS credentials have the required permissions to read and write items.

---

## Deployment

The project is designed to deploy on Vercel.

Required Vercel environment variables:

```bash
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DYNAMODB_TABLE_NAME
```

After adding environment variables, redeploy the project from Vercel.

---

## Hackathon Submission

Built for:

**H0: Hack the Zero Stack with Vercel v0 and AWS Databases**

Submission category:

**Monetizable B2B App**

AWS database used:

**Amazon DynamoDB**

---

## Author

Built by **Azkhan Abdul Salam**.
