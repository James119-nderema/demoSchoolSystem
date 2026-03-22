# Finance Technical Architecture

> A high-level overview of the technologies, services, and data-flow that power the school finance system.

Related guides:
- Backend implementation: `../../../../../schoolmanagementsystem-backend/ACCOUNTING_MODULES_GUIDE.md`
- Beginner explanation: `../../../../../schoolmanagementsystem-backend/FINANCE_FOR_BEGINNERS.md`

---

## System Overview

The finance module is built on a **Django 5.2** backend using **Django REST Framework** to expose RESTful JSON APIs, paired with a **React / TypeScript** single-page application bundled by **Vite** and styled with **Tailwind CSS**. Multiple Django apps collaborate to cover the full financial lifecycle: *finance* (budget planning, expenses, legacy balance sheet endpoints and school payment-method configuration), *invoice* (fee invoicing with auto-numbering, per-student / per-class billing, and payment recording), *mpesa* (Safaricom Daraja STK-Push integration for C2B fee collection with asynchronous callback handling), *payroll* (salary structures with auto-calculated PAYE, NHIF, NSSF, SHA and Housing Levy deductions, plus M-Pesa B2C and B2B disbursement for staff salaries), *subscriptions* (SaaS plan management with M-Pesa-powered payments), and *sms_credits* (SMS top-up via M-Pesa / bank transfer routed through Ping Africa Bulk SMS). In addition, the new accounting layer is modularized into: *accounting_core* (chart of accounts + journals), *trial_balance* (balancing report), *general_ledger* (per-account movement), *bank_reconciliation* (statement matching), and *financial_reports* (income statement, balance sheet, cash flow). All models use **UUID primary keys** and are persisted in an **SQLite** database, while authentication is handled by **JWT tokens** issued via `djangorestframework-simplejwt`, with every frontend request carrying a Bearer token through a shared Axios interceptor layer.

On the client side, three dedicated service modules — **financeService** (budgets, legacy balance sheets, expenses, analytics), **payrollService** (salaries, deductions, payroll runs, transactions), and **accountingService** (accounts, journals, trial balance, ledger, reconciliation, statements) — abstract API calls behind type-safe functions. The pages now include: *School_Finance*, *BudgetPlanning*, *BalanceSheet*, *SchoolExpenses*, *FinanceAnalytics*, plus the new accounting pages *ChartOfAccounts* (`/finance/accounts`), *JournalEntries* (`/finance/journals`), *TrialBalance* (`/finance/trial-balance`), *GeneralLedger* (`/finance/general-ledger`), *BankReconciliation* (`/finance/bank-reconciliation`), and *FinancialStatements* (`/finance/statements`). The payment pipeline supports **13+ Kenyan payment methods** — M-Pesa, Airtel Money, T-Kash and accounts at KCB, Equity, Co-op, ABSA, Stanbic, Standard Chartered, DTB, NCBA, Family Bank, I&M Bank and more — with Safaricom's Daraja API serving as the primary gateway for both inbound fee collection (STK Push C2B) and outbound salary disbursement (B2C to phone, B2B to bank), while bank transfers follow a manual-confirmation reconciliation flow managed through the bursar's reconciliation page.

---

## Data-Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│            Frontend — React + TypeScript (Vite / Vercel)        │
│                                                                 │
│   School_Finance  ·  BudgetPlanning  ·  BalanceSheet            │
│   SchoolExpenses  ·  FinanceAnalytics  ·  FinanceGuide          │
│   ChartOfAccounts  ·  JournalEntries  ·  TrialBalance           │
│   GeneralLedger  ·  BankReconciliation  ·  FinancialStatements  │
│                                                                 │
│   Services: financeService · payrollService · accountingService │
│                      (Axios + JWT)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / JSON + JWT Bearer
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Backend — Django 5.2 + Django REST Framework          │
│                                                                 │
│   finance (budget, expenses, legacy balance sheet, payment methods)│
│   invoice (fees, payments, bursar dashboard)                    │
│   mpesa   (STK Push C2B, callbacks)                             │
│   payroll (salaries, B2C / B2B disbursement)                    │
│   accounting_core + trial_balance + general_ledger              │
│   bank_reconciliation + financial_reports                        │
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
