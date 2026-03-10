# Finance Technical Architecture

> A high-level overview of the technologies, services, and data-flow that power the school finance system.

---

## System Overview

The finance module is built on a **Django 5.2** backend using **Django REST Framework** to expose RESTful JSON APIs, paired with a **React / TypeScript** single-page application bundled by **Vite** and styled with **Tailwind CSS**. Six Django apps collaborate to cover the full financial lifecycle: *finance* (budget planning, balance sheets, expense management and school payment-method configuration), *invoice* (fee invoicing with auto-numbering, per-student / per-class billing, and payment recording), *mpesa* (Safaricom Daraja STK-Push integration for C2B fee collection with asynchronous callback handling), *payroll* (salary structures with auto-calculated PAYE, NHIF, NSSF, SHA and Housing Levy deductions, plus M-Pesa B2C and B2B disbursement for staff salaries), *subscriptions* (SaaS plan management with M-Pesa-powered payments), and *sms_credits* (SMS top-up via M-Pesa / bank transfer routed through Ping Africa Bulk SMS). All models use **UUID primary keys** and are persisted in an **SQLite** database, while authentication is handled by **JWT tokens** issued via `djangorestframework-simplejwt`, with every frontend request carrying a Bearer token through a shared Axios interceptor layer.

On the client side, two dedicated service modules — **financeService** (budgets, balance sheets, expenses, analytics) and **payrollService** (salaries, deductions, payroll runs, transactions) — abstract every API call behind type-safe functions and feed data to six React components: *School_Finance* (invoicing and bursar dashboard), *BudgetPlanning* (period / category / item CRUD with real-data simulation), *BalanceSheet* (auto-computed assets, liabilities and equity with an accounting-equation check), *SchoolExpenses* (approval workflow and M-Pesa / bank expense payments), *FinanceAnalytics* (KPI cards, monthly trend charts, per-class collection and payment-method distribution), and *FinanceGuide* (interactive user documentation with native-PDF export). The payment pipeline supports **13+ Kenyan payment methods** — M-Pesa, Airtel Money, T-Kash and accounts at KCB, Equity, Co-op, ABSA, Stanbic, Standard Chartered, DTB, NCBA, Family Bank, I&M Bank and more — with Safaricom's Daraja API serving as the primary gateway for both inbound fee collection (STK Push C2B) and outbound salary disbursement (B2C to phone, B2B to bank), while bank transfers follow a manual-confirmation reconciliation flow managed through the bursar's reconciliation page.

---

## Data-Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│            Frontend — React + TypeScript (Vite / Vercel)        │
│                                                                 │
│   School_Finance  ·  BudgetPlanning  ·  BalanceSheet            │
│   SchoolExpenses  ·  FinanceAnalytics  ·  FinanceGuide          │
│                                                                 │
│   Services: financeService  ·  payrollService  (Axios + JWT)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / JSON + JWT Bearer
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Backend — Django 5.2 + Django REST Framework          │
│                                                                 │
│   finance (budget, expenses, balance sheet, payment methods)    │
│   invoice (fees, payments, bursar dashboard)                    │
│   mpesa   (STK Push C2B, callbacks)                             │
│   payroll (salaries, B2C / B2B disbursement)                    │
│   subscriptions + sms_credits                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Django ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Database — SQLite (UUID primary keys)                │
│                                                                 │
│   Invoice · Payment · Transaction · BudgetPeriod · Category     │
│   SalaryStructure · PayrollRun · DeductionConfig                │
│   Expense · ExpensePayment · BalanceSheetEntry                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP Callbacks + API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            External Services                                    │
│                                                                 │
│   Safaricom M-Pesa Daraja — STK Push (C2B fee collection)      │
│   Safaricom M-Pesa Daraja — B2C / B2B (payroll disbursement)   │
│   Ping Africa Bulk SMS                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| **Frontend**     | React 18, TypeScript, Vite, Tailwind CSS, Axios, jsPDF                    |
| **Backend**      | Django 5.2, Django REST Framework, djangorestframework-simplejwt           |
| **Database**     | SQLite with UUID primary keys                                              |
| **Auth**         | JWT (Bearer tokens via Axios interceptor)                                  |
| **Payments**     | Safaricom M-Pesa Daraja (STK Push C2B, B2C, B2B), 14+ Kenyan bank methods |
| **SMS**          | Ping Africa Bulk SMS                                                       |
| **Deployment**   | Vercel (frontend)                                                          |
