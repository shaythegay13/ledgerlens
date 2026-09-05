# Product Requirements Document
## LedgerLens

**Hackathon Track:** MAXIMOR — Money Operations  
**Prompt:** Explain the Change  
**Build Window:** One-day hackathon  
**Product Type:** AI financial analysis agent  
**Primary Goal:** Explain what changed financially, why it changed, and which transactions caused the change.

---

# 1. Product Summary

LedgerLens is an AI financial investigator that compares financial results across periods, identifies the most important variances, drills into transaction-level data to determine their drivers, and produces concise, evidence-backed explanations.

Instead of simply reporting:

> Revenue increased 18%.

LedgerLens should explain:

> Revenue increased 18%, primarily due to growth in enterprise accounts. Three customers generated 64% of the increase, led by Acme Corp, whose monthly spend increased by $31,200.

Every meaningful conclusion must be supported by the underlying financial data.

LedgerLens also maintains **Business Memory** across analysis runs so that it progressively learns company-specific context, classifications, corrections, recurring patterns, and terminology.

The product should become more useful the more times a company uses it.

---

# 2. Problem

Financial reporting tools are good at showing that numbers changed.

They are much worse at explaining:

**What actually caused the change?**

A founder, finance operator, controller, or accountant may see:

- Revenue +18%
- Software expenses +23%
- Payroll +8%
- Gross margin -4%

But understanding why often requires manually:

1. Comparing periods.
2. Inspecting account categories.
3. Opening transaction exports.
4. Grouping customers and vendors.
5. Looking for unusual transactions.
6. Reconciling the results.
7. Writing a narrative explanation.

LedgerLens automates that investigation.

---

# 3. Core Product Promise

LedgerLens answers three questions:

### What changed?

Identify material differences between financial periods.

### Why did it change?

Determine which categories, customers, vendors, or transactions explain the variance.

### What is driving it?

Show the actual evidence responsible for the change.

---

# 4. Target Users

Primary users:

- Startup founders
- Finance teams
- Controllers
- Accountants
- FP&A teams
- Small-business operators

The MVP should be understandable to someone who is financially literate but not necessarily an accountant.

---

# 5. Primary User Story

As a finance operator, I want to upload financial summaries and transaction data from multiple periods and receive a concise explanation of the most meaningful changes so that I do not have to manually investigate every variance.

---

# 6. Core Demo Flow

## Step 1 — Upload Data

User uploads:

**Period A financial summary**

Example:

June 2026

and

**Period B financial summary**

Example:

July 2026

plus transaction-level CSV data for those periods.

---

## Step 2 — Normalize Data

LedgerLens parses the files and identifies fields such as:

- Date
- Amount
- Category
- Description
- Vendor
- Customer
- Account
- Transaction type

If column names differ, the system should map them into a common internal schema.

---

## Step 3 — Compare Periods

LedgerLens calculates:

- Absolute change
- Percentage change
- Revenue changes
- Expense changes
- Category-level changes
- Customer-level changes
- Vendor-level changes

The calculations should happen deterministically in code.

The LLM should not perform basic financial arithmetic.

---

## Step 4 — Rank Meaningful Variances

LedgerLens identifies the most important changes.

Example:

### Largest Changes

1. Enterprise revenue: +$84,200 / +32%
2. Infrastructure expense: +$21,400 / +41%
3. Contractor expense: -$17,600 / -22%
4. SMB revenue: -$11,700 / -6%

The system should prioritize material financial changes rather than listing every difference.

---

## Step 5 — Investigate Drivers

For each important variance, LedgerLens drills into transaction-level data.

Example:

**Enterprise revenue increased $84,200.**

Drivers:

- Acme Corp: +$31,200
- Globex: +$14,700
- Stark Industries: +$8,000

Together, the three largest customers contributed:

**64% of the increase.**

---

## Step 6 — Generate Explanation

The AI converts the structured analysis into a concise financial narrative.

Example:

> Revenue increased 18% month-over-month, primarily because enterprise revenue grew 32%. Three customers accounted for 64% of the increase, led by Acme Corp, which contributed an additional $31,200. SMB revenue declined 6%, partially offsetting the enterprise gains.

---

## Step 7 — Show Evidence

Users can click or expand any claim.

Example:

**Why did enterprise revenue increase?**

LedgerLens displays:

- Supporting customers
- Supporting transactions
- Dollar contribution
- Percentage contribution
- Source period
- Relevant CSV rows

The user should never have to trust an unexplained AI statement.

---

## Step 8 — Ask Follow-Up Questions

Users can ask questions such as:

- Why did expenses increase?
- Which customers drove revenue growth?
- Was growth broad-based?
- Which vendors changed the most?
- Were there any unusual transactions?
- What caused margin compression?
- What is the single biggest financial change this month?
- Which expense increases look recurring versus one-time?

The agent answers using the uploaded financial data.

---

# 7. Business Memory

This is a CORE requirement, not a stretch goal.

LedgerLens should learn company-specific context across runs.

Example:

### Run 1

LedgerLens identifies:

> AWS — Software Expense

User corrects it:

> We classify AWS as Infrastructure.

LedgerLens saves:

```text
Vendor: Amazon Web Services
Preferred Category: Infrastructure
Source: User confirmed
```

### Run 2

AWS transactions are automatically interpreted as Infrastructure.

The user should not need to make the same correction again.

---

# 8. What Business Memory Can Store

The MVP should support memory for:

### Vendor classifications

Example:

AWS → Infrastructure

### Customer information

Example:

Acme Corp → Enterprise customer

### Recurring expenses

Example:

Insurance payment occurs annually in September.

### Company terminology

Example:

"Contractors" refers primarily to engineering contractors.

### Accounting context

Example:

Founder salary began in July.

### User corrections

Example:

A transaction classified as Marketing is actually Recruiting.

### Known business events

Example:

Enterprise pricing changed in June.

---

# 9. Memory Structure

A simple structure is sufficient.

```text
memory_id
business_id
type
subject
fact
source
created_at
updated_at
```

Example:

```json
{
  "type": "vendor_classification",
  "subject": "Amazon Web Services",
  "fact": "Classify as Infrastructure",
  "source": "user_confirmed"
}
```

---

# 10. Memory Behavior

Before generating an analysis:

1. Retrieve relevant Business Memory.
2. Apply known classifications and context.
3. Run deterministic calculations.
4. Pass calculated results + relevant memory to the AI.
5. Generate the explanation.

When a user provides a correction or new business fact:

1. Extract the fact.
2. Confirm the interpretation if necessary.
3. Save it.
4. Apply it to subsequent analyses.

The agent should not repeatedly ask the user something it already knows.

---

# 11. Data Input

## Required

At minimum:

### Financial summary

Period-level totals such as:

```text
Category,Amount
Revenue,250000
Payroll,90000
Software,22000
Marketing,18000
```

### Transaction CSV

Example:

```text
Date,Description,Amount,Category,Counterparty
2026-07-01,Acme Corp,14200,Revenue,Acme Corp
2026-07-03,AWS,-4300,Software,Amazon Web Services
```

---

# 12. Normalized Transaction Schema

Internally, normalize transactions into something similar to:

```text
transaction_id
date
period
description
amount
category
counterparty
account
type
source_file
source_row
```

The original row reference should be preserved so LedgerLens can show evidence.

---

# 13. Deterministic Analysis Engine

Financial calculations should occur in code before the AI is called.

Calculate:

### Period Totals

- Revenue
- Expenses
- Net change

### Category Variance

For each category:

```text
Period A amount
Period B amount
Absolute difference
Percentage difference
```

### Counterparty Variance

Calculate changes by:

- Customer
- Vendor
- Counterparty

### Contribution Analysis

Example:

```text
customer increase / total revenue increase
```

This allows statements such as:

> Three customers contributed 64% of the increase.

### Materiality Ranking

Rank changes based primarily on financial impact.

Avoid overwhelming the user with insignificant differences.

---

# 14. AI Responsibilities

The AI should:

- Interpret deterministic calculations
- Determine which changes deserve explanation
- Write concise financial narratives
- Explain relationships between changes
- Use Business Memory
- Answer follow-up questions
- Identify when additional context would improve the explanation
- Clearly distinguish evidence from inference

The AI should NOT:

- Invent transactions
- Invent customers
- Perform unreliable arithmetic
- Assume missing business context
- Present unsupported causal claims as facts

---

# 15. Evidence Model

Every major claim generated by LedgerLens should ideally have an internal evidence object.

Example:

```json
{
  "claim": "Three enterprise customers drove 64% of revenue growth.",
  "evidence": [
    {
      "counterparty": "Acme Corp",
      "change": 31200
    },
    {
      "counterparty": "Globex",
      "change": 14700
    },
    {
      "counterparty": "Stark Industries",
      "change": 8000
    }
  ],
  "confidence": "high"
}
```

Evidence should be viewable from the UI.

---

# 16. Confidence

Use simple confidence labels:

**High**

Directly supported by calculations and transaction data.

**Medium**

Supported by the data but requires some interpretation.

**Needs Context**

The data shows a change but does not explain the business reason.

Example:

> Consulting expense increased $18,000 because of three payments to Deloitte.

That is supported.

But:

> Consulting expense increased because the company is preparing for fundraising.

That cannot be claimed unless the company has provided that context.

LedgerLens should instead ask:

> I found three new Deloitte payments totaling $18,000. Do you know what these were related to?

The answer can then become Business Memory.

---

# 17. User Interface

## Screen 1 — Upload

**LedgerLens**

### Understand what changed. And why.

Upload financial data from two periods.

[ Period A Summary ]

[ Period B Summary ]

[ Transaction CSV ]

**Analyze Changes**

---

# 18. Analysis Dashboard

Top section:

### Executive Summary

Example:

> Revenue grew 18%, but operating expenses grew 24%, causing operating margin to decline 3.2 percentage points.

---

### Biggest Changes

Cards showing:

**Enterprise Revenue**
+$84,200
+32%

**Infrastructure**
+$21,400
+41%

**Contractors**
-$17,600
-22%

---

### What Drove It

For each variance:

- Largest contributors
- Percentage contribution
- Transactions
- Explanation

---

# 19. Evidence Drawer

Clicking an insight should reveal:

### Evidence

**Claim**

Enterprise revenue increased $84,200.

**Primary Drivers**

Acme Corp +$31,200  
Globex +$14,700  
Stark Industries +$8,000

**Source Transactions**

Show relevant rows.

---

# 20. Ask LedgerLens

Chat interface:

> Ask about these financial changes.

Suggested questions:

**Why did revenue increase?**

**What is driving higher expenses?**

**Which customers changed the most?**

**Anything unusual this month?**

The chat must remain grounded in the analyzed dataset and Business Memory.

---

# 21. Teach LedgerLens

The interface should provide a simple way to correct or teach the agent.

Example:

User:

> AWS belongs under Infrastructure, not Software.

LedgerLens:

> Got it. I'll classify AWS as Infrastructure for future analyses.

Store this information in Business Memory.

---

# 22. Persistence

Recommended MVP storage:

**Supabase**

Persist:

- Business Memory
- Analysis runs
- Saved conclusions
- User corrections

Raw uploaded CSVs do not necessarily need permanent storage for the MVP.

The main persistence requirement is proving that LedgerLens remembers context between analyses.

---

# 23. Recommended Technical Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### CSV Parsing

- Papa Parse or equivalent

### AI

- OpenAI SDK
- Vercel AI SDK if useful for chat/streaming

### Persistence

- Supabase

### Observability

- PRISM

### Deployment

- Vercel

---

# 24. PRISM Integration

PRISM must observe meaningful agent activity.

Trace at minimum:

### Initial Analysis

Input financial context → AI explanation

### Follow-Up Questions

User question → agent response

### Business Memory Interaction

New business context → updated understanding

### Second Analysis

Demonstrate that stored context affected the new result.

The PRISM demo should make the improvement process visible.

---

# 25. Recommended Agent Architecture

Do NOT create an unnecessarily complicated multi-agent system.

Use one primary financial analyst agent backed by deterministic tools.

Conceptually:

```text
User
  ↓
LedgerLens Agent
  ↓
Financial Analysis Tools
  ├── Compare periods
  ├── Calculate variances
  ├── Rank material changes
  ├── Drill into transactions
  └── Retrieve Business Memory
  ↓
Evidence-backed explanation
```

This is simpler, easier to debug, and more reliable for a one-day build.

---

# 26. Core Tools Available to the Agent

The agent should conceptually have access to functions such as:

```text
compare_periods()
```

```text
find_top_variances()
```

```text
find_transaction_drivers()
```

```text
analyze_counterparty_change()
```

```text
retrieve_business_memory()
```

```text
save_business_memory()
```

The AI decides what information it needs.

The tools provide factual results.

---

# 27. P0 — MUST BUILD

Do not move to lower-priority features until these work.

### P0 Requirements

- Upload two periods
- Upload transaction CSV
- Parse and normalize data
- Calculate period changes
- Rank top variances
- Drill into transactions
- Generate AI explanation
- Show evidence
- Ask follow-up question
- Store at least one piece of Business Memory
- Use that memory in a second analysis
- PRISM tracing works
- Demo is deployed or reliably runnable

---

# 28. P1 — BUILD IF P0 IS SOLID

- Better charts
- Automatic column mapping
- More advanced anomaly detection
- Multiple historical periods
- Suggested follow-up questions
- Downloadable management summary
- Better evidence visualization

---

# 29. P2 — DO NOT PRIORITIZE TODAY

- QuickBooks integration
- Plaid
- Bank connections
- ERP integrations
- Automatic journal entries
- Forecasting
- Budget creation
- Financial planning
- Full accounting reconciliation
- Multi-company support
- Complex user permissions
- Mobile app

These features increase demo risk without materially improving the hackathon submission.

---

# 30. One-Day Build Order

## Phase 1 — Data

Build:

- CSV upload
- Parsing
- Normalization
- Period comparison

Do not touch AI until the numbers are correct.

---

## Phase 2 — Investigation Engine

Build:

- Category variance
- Customer/vendor variance
- Contribution calculations
- Materiality ranking
- Transaction drilldown

Verify calculations manually.

---

## Phase 3 — AI

Feed structured results into the model.

Generate:

- Executive summary
- Top explanations
- Follow-up Q&A

---

## Phase 4 — Evidence

Connect claims to:

- Calculations
- Counterparties
- Transactions
- Source rows

---

## Phase 5 — Memory

Add:

- User correction
- Persist correction
- Load correction on next run
- Demonstrate changed behavior

---

## Phase 6 — PRISM

Verify real agent interactions are being traced.

---

## Phase 7 — Polish

Only now add:

- Charts
- Animation
- Styling
- Suggested prompts
- Demo conveniences

---

# 31. Demo Data Strategy

Use a carefully designed synthetic business dataset if the hackathon does not provide required data.

The dataset should contain enough structure to create an interesting story.

Example:

### June

Revenue: $500,000

### July

Revenue: $590,000

+18%

But underneath:

Enterprise revenue: +$105,000  
SMB revenue: -$15,000

Three enterprise customers: +$67,000

Infrastructure: +$21,000

Marketing: +$9,000

Contractors: -$18,000

This produces a much richer explanation than simple across-the-board growth.

---

# 32. Critical Two-Run Demo

The submission should deliberately demonstrate learning.

### Run One

Upload June + July.

LedgerLens reports:

> Software expense increased significantly, with AWS responsible for most of the increase.

User says:

> We consider AWS infrastructure, not software.

LedgerLens saves the correction.

### Run Two

Upload July + August.

LedgerLens automatically treats AWS as Infrastructure.

Then highlight:

> LedgerLens remembered how this business categorizes AWS and applied that context automatically.

This directly demonstrates learning across agent runs.

---

# 33. Final Demo Script

### 1. Problem

"Financial reports tell you what changed. Figuring out why still requires someone to dig through the transactions."

### 2. Upload

Upload two periods.

### 3. Analysis

LedgerLens identifies:

> Revenue +18%.

### 4. Investigation

Open the explanation:

> Enterprise accounts drove the increase, with three customers contributing 64% of the growth.

### 5. Evidence

Click the claim.

Show the supporting customers and transactions.

### 6. Question

Ask:

> Was the revenue growth broad-based?

LedgerLens answers using the underlying data.

### 7. Teach

Tell LedgerLens:

> AWS should be classified as Infrastructure.

It remembers.

### 8. Second Run

Run another period.

Show that AWS is now classified correctly without being told again.

### 9. PRISM

Show the agent trajectory and improvement.

### 10. Close

"LedgerLens doesn't just tell finance teams what changed. It investigates why it changed — and learns how your business works every time it runs."

---

# 34. Success Criteria

The hackathon project is successful if:

- The user can upload financial data from multiple periods.
- All major financial calculations are deterministic.
- LedgerLens identifies the most material changes.
- It can identify transaction-level drivers.
- Explanations are concise.
- Important claims have visible evidence.
- Users can ask follow-up questions.
- Users can teach LedgerLens business context.
- That context persists.
- A second analysis demonstrably improves because of previous information.
- PRISM receives real traces.
- The entire core demo can be completed in under three minutes.

---

# 35. Non-Goals / Safety

LedgerLens should not:

- Move money
- Execute transactions
- Modify accounting records
- Provide tax advice
- Pretend uncertain explanations are known facts
- Invent missing financial information

It is an **analysis and explanation system**, not an autonomous accounting system.

---

# 36. Core Pitch

**LedgerLens is an AI financial investigator that tells you what changed, determines why it changed, and shows the transactions behind the answer.**

Unlike one-shot financial analysis tools, LedgerLens builds context about the business over time, so each analysis becomes more informed than the last.