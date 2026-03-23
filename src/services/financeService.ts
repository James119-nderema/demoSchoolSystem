import { APIService } from './baseUrl';

const BASE = '/api/finance/budget';
const AUTH: 'staff' = 'staff';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/* ─── Budget ─────────────────────────────────────────────────────────────── */

export interface BudgetItem {
  id?: string;
  category?: string;
  school_id?: string;
  name: string;
  planned_amount: number;
  actual_amount: number;
  variance?: number;
  variance_pct?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCategory {
  id?: string;
  budget_period?: string;
  school_id?: string;
  name: string;
  category_type: 'revenue' | 'expenditure';
  description?: string;
  sort_order?: number;
  items?: BudgetItem[];
  total_planned?: number;
  total_actual?: number;
  created_at?: string;
}

export interface BudgetPeriod {
  id?: string;
  school_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'closed';
  notes?: string;
  categories?: BudgetCategory[];
  total_revenue_planned?: number;
  total_revenue_actual?: number;
  total_expenditure_planned?: number;
  total_expenditure_actual?: number;
  surplus_deficit_planned?: number;
  surplus_deficit_actual?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetPeriodListItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  total_revenue_planned: number;
  total_expenditure_planned: number;
  created_at: string;
}

export interface BudgetSimulationSummary {
  revenue_planned: number;
  revenue_actual: number;
  revenue_variance: number;
  expenditure_planned: number;
  expenses_recorded: number;
  expenses_paid: number;
  payroll_paid: number;
  total_actual_expenditure: number;
  surplus_planned: number;
  surplus_actual: number;
}

export interface BudgetSimulation {
  period: BudgetPeriod;
  summary: BudgetSimulationSummary;
}

export interface BudgetPlanningAssumptions {
  assumptions: {
    total_students: number;
    fee_collection_rate: number;
    assumed_fee_payers: number;
    period_months: number;
    salary_months_selected: number;
    monthly_salary_base: number;
    salary_structure_monthly?: number;
    latest_completed_monthly_paid: number;
  };
  suggestions: {
    yearly_fee_per_student: number;
    fee_base_full_collection: number;
    fee_actual_projection: number;
    fee_planned_projection: number;
    salary_actual_gross_total: number;
    salary_actual_deductions_total: number;
    salary_actual_net_total: number;
    salary_actual_total_payment?: number;
    salary_planned_gross_total: number;
    salary_planned_deductions_total: number;
    salary_planned_net_total: number;
    salary_planned_total_payment?: number;
  };
  salary_staff: {
    staff_id: string;
    staff_name: string;
    months: number;
    monthly_gross: number;
    monthly_paye_without_reliefs?: number;
    monthly_deductions: number;
    monthly_net: number;
    monthly_total_payment?: number;
    actual_gross: number;
    actual_deductions: number;
    actual_net: number;
    actual_total_payment?: number;
  }[];
  generated_at: string;
}

/* ─── Balance Sheet ──────────────────────────────────────────────────────── */

export interface BalanceSheetEntry {
  id?: string;
  school_id?: string;
  entry_type: 'asset' | 'liability' | 'equity';
  sub_type: string;
  name: string;
  amount: number;
  as_of_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BalanceSheetComputed {
  cash_and_bank: number;
  accounts_receivable: number;
  accounts_payable: number;
  total_revenue_collected: number;
  adjusted_total_revenue?: number;
  total_outflow?: number;
  total_payroll_paid: number;
  total_expenses_paid: number;
  total_assets?: number;
  total_liabilities?: number;
  auto_equity?: number;
}

export interface BalanceSheetData {
  entries: BalanceSheetEntry[];
  totals: { assets: number; liabilities: number; equity: number };
  computed: BalanceSheetComputed;
}

/* ─── Expenses ───────────────────────────────────────────────────────────── */

export interface ExpenseCategory {
  id?: string;
  school_id?: string;
  name: string;
  description?: string;
  expense_count?: number;
  created_at?: string;
}

export interface ExpensePayment {
  id?: string;
  expense?: string;
  school_id?: string;
  payment_type: string;
  amount: number;
  destination?: string;
  status: string;
  reference?: string;
  conversation_id?: string;
  mpesa_receipt?: string;
  result_code?: string;
  result_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id?: string;
  school_id?: string;
  category?: string;
  category_name?: string;
  title: string;
  description?: string;
  amount: number;
  amount_paid?: number;
  balance?: number;
  status: string;
  payment_method: string;
  payee_name?: string;
  payee_phone?: string;
  payee_bank_name?: string;
  payee_bank_account?: string;
  payee_bank_code?: string;
  budget_item?: string;
  expense_date: string;
  due_date?: string;
  approved_by?: string;
  created_by?: string;
  receipt_number?: string;
  payments?: ExpensePayment[];
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseStats {
  total_expenses: number;
  total_paid: number;
  total_outstanding: number;
  pending_count: number;
  approved_count: number;
  total_count: number;
  by_category: {
    id: string;
    name: string;
    total: number;
    paid: number;
    count: number;
  }[];
}

export interface RevenueTransaction {
  id: string;
  transaction_date: string;
  transaction_type: 'inflow' | 'outflow';
  source: 'student_fee_payment' | 'expense_payment' | 'payroll_payment' | string;
  description: string;
  reference: string;
  method: string;
  student_name: string;
  amount_in: number;
  amount_out: number;
  net_amount: number;
  running_balance: number;
}

export interface RevenueLedgerSummary {
  opening_balance: number;
  total_in: number;
  total_out: number;
  net_change: number;
  closing_balance: number;
  transaction_count: number;
  generated_at: string;
}

export interface RevenueLedgerResponse {
  summary: RevenueLedgerSummary;
  transactions: RevenueTransaction[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Service
// ═══════════════════════════════════════════════════════════════════════════════

export const financeService = {
  /* ─── Budget Periods ───────────────────────────────────────────────────── */
  async getBudgetPeriods(): Promise<BudgetPeriodListItem[]> {
    return APIService.get(`${BASE}/periods/`, undefined, AUTH);
  },
  async getBudgetPeriod(id: string): Promise<BudgetPeriod> {
    return APIService.get(`${BASE}/periods/${id}/`, undefined, AUTH);
  },
  async createBudgetPeriod(data: Partial<BudgetPeriod>): Promise<BudgetPeriod> {
    return APIService.post(`${BASE}/periods/`, data, AUTH);
  },
  async updateBudgetPeriod(id: string, data: Partial<BudgetPeriod>): Promise<BudgetPeriod> {
    return APIService.put(`${BASE}/periods/${id}/`, data, AUTH);
  },
  async deleteBudgetPeriod(id: string): Promise<void> {
    return APIService.delete(`${BASE}/periods/${id}/`, AUTH);
  },

  /* ─── Budget Categories ────────────────────────────────────────────────── */
  async createBudgetCategory(data: Partial<BudgetCategory>): Promise<BudgetCategory> {
    return APIService.post(`${BASE}/categories/`, data, AUTH);
  },
  async updateBudgetCategory(id: string, data: Partial<BudgetCategory>): Promise<BudgetCategory> {
    return APIService.put(`${BASE}/categories/${id}/`, data, AUTH);
  },
  async deleteBudgetCategory(id: string): Promise<void> {
    return APIService.delete(`${BASE}/categories/${id}/`, AUTH);
  },

  /* ─── Budget Items ─────────────────────────────────────────────────────── */
  async createBudgetItem(data: Partial<BudgetItem>): Promise<BudgetItem> {
    return APIService.post(`${BASE}/items/`, data, AUTH);
  },
  async updateBudgetItem(id: string, data: Partial<BudgetItem>): Promise<BudgetItem> {
    return APIService.put(`${BASE}/items/${id}/`, data, AUTH);
  },
  async deleteBudgetItem(id: string): Promise<void> {
    return APIService.delete(`${BASE}/items/${id}/`, AUTH);
  },

  /* ─── Budget Simulation ────────────────────────────────────────────────── */
  async getBudgetSimulation(periodId: string): Promise<BudgetSimulation> {
    return APIService.get(`${BASE}/simulation/?period_id=${periodId}`, undefined, AUTH);
  },

  async getBudgetPlanningAssumptions(params?: {
    period_id?: string;
    yearly_fee_per_student?: number;
    salary_months?: number;
    staff_months?: Record<string, number>;
  }): Promise<BudgetPlanningAssumptions> {
    try {
      return await APIService.post(`${BASE}/planning-assumptions/`, params || {}, AUTH);
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      if (status !== 405) throw error;

      const qs = new URLSearchParams();
      if (params?.period_id) qs.set('period_id', params.period_id);
      if (typeof params?.yearly_fee_per_student === 'number') qs.set('yearly_fee_per_student', String(params.yearly_fee_per_student));
      if (typeof params?.salary_months === 'number') qs.set('salary_months', String(params.salary_months));
      if (params?.staff_months && Object.keys(params.staff_months).length > 0) qs.set('staff_months', JSON.stringify(params.staff_months));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return APIService.get(`${BASE}/planning-assumptions/${query}`, undefined, AUTH);
    }
  },

  /* ─── Balance Sheet ────────────────────────────────────────────────────── */
  async getBalanceSheet(asOfDate?: string): Promise<BalanceSheetData> {
    const qs = asOfDate ? `?as_of_date=${asOfDate}` : '';
    return APIService.get(`${BASE}/balance-sheet/${qs}`, undefined, AUTH);
  },
  async createBalanceSheetEntry(data: Partial<BalanceSheetEntry>): Promise<BalanceSheetEntry> {
    return APIService.post(`${BASE}/balance-sheet/`, data, AUTH);
  },
  async updateBalanceSheetEntry(id: string, data: Partial<BalanceSheetEntry>): Promise<BalanceSheetEntry> {
    return APIService.put(`${BASE}/balance-sheet/${id}/`, data, AUTH);
  },
  async deleteBalanceSheetEntry(id: string): Promise<void> {
    return APIService.delete(`${BASE}/balance-sheet/${id}/`, AUTH);
  },

  /* ─── Expense Categories ───────────────────────────────────────────────── */
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return APIService.get(`${BASE}/expense-categories/`, undefined, AUTH);
  },
  async createExpenseCategory(data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    return APIService.post(`${BASE}/expense-categories/`, data, AUTH);
  },
  async updateExpenseCategory(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    return APIService.put(`${BASE}/expense-categories/${id}/`, data, AUTH);
  },
  async deleteExpenseCategory(id: string): Promise<void> {
    return APIService.delete(`${BASE}/expense-categories/${id}/`, AUTH);
  },

  /* ─── Expenses ─────────────────────────────────────────────────────────── */
  async getExpenses(filters?: { status?: string; category?: string }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return APIService.get(`${BASE}/expenses/${qs}`, undefined, AUTH);
  },
  async getExpense(id: string): Promise<Expense> {
    return APIService.get(`${BASE}/expenses/${id}/`, undefined, AUTH);
  },
  async createExpense(data: Partial<Expense>): Promise<Expense> {
    return APIService.post(`${BASE}/expenses/`, data, AUTH);
  },
  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    return APIService.put(`${BASE}/expenses/${id}/`, data, AUTH);
  },
  async deleteExpense(id: string): Promise<void> {
    return APIService.delete(`${BASE}/expenses/${id}/`, AUTH);
  },

  /* ─── Expense Actions ──────────────────────────────────────────────────── */
  async payExpense(data: {
    expense_id: string;
    amount: number;
    payment_type: string;
    destination?: string;
    reference?: string;
  }): Promise<{ success: boolean; payment: ExpensePayment; expense: Expense }> {
    return APIService.post(`${BASE}/expenses/pay/`, data, AUTH);
  },
  async approveExpense(expenseId: string): Promise<Expense> {
    return APIService.post(`${BASE}/expenses/approve/`, { expense_id: expenseId }, AUTH);
  },
  async getExpenseStats(): Promise<ExpenseStats> {
    return APIService.get(`${BASE}/expenses/stats/`, undefined, AUTH);
  },

  async getRevenueLedger(filters?: {
    start_date?: string;
    end_date?: string;
    year?: number;
    limit?: number;
  }): Promise<RevenueLedgerResponse> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    if (typeof filters?.year === 'number') params.set('year', String(filters.year));
    if (typeof filters?.limit === 'number') params.set('limit', String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return APIService.get(`${BASE}/revenue-transactions/${qs}`, undefined, AUTH);
  },

  /* ─── Enhanced Analytics ───────────────────────────────────────────────── */
  async getEnhancedAnalytics(year?: number): Promise<EnhancedAnalytics> {
    const params = year ? { year: String(year) } : undefined;
    return APIService.get(`${BASE}/analytics/`, params, AUTH);
  },
};

/* ─── Enhanced Analytics Types ───────────────────────────────────────────── */

export interface MonthlyTrendItem {
  month: string;
  revenue: number;
  expenses: number;
  payroll: number;
}

export interface ClassCollectionItem {
  class_name: string;
  invoiced: number;
  paid: number;
  outstanding: number;
  collection_rate: number;
  student_count: number;
}

export interface ExpenseByCategoryItem {
  category: string;
  total: number;
  paid: number;
  pending: number;
  count: number;
}

export interface PaymentMethodItem {
  method: string;
  value: number;
  count: number;
}

export interface WeeklyTrendItem {
  week: string;
  amount: number;
}

export interface AnalyticsKPI {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  collection_rate: number;
  revenue_this_year: number;
  revenue_this_month: number;
  expenditure_this_year: number;
  total_expenses: number;
  total_expenses_paid: number;
  total_payroll: number;
  net_position: number;
  net_revenue_balance?: number;
  total_inflow_all_time?: number;
  total_outflow_all_time?: number;
  yoy_growth: number;
  prev_year_revenue: number;
}

export interface EnhancedAnalytics {
  year: number;
  kpi: AnalyticsKPI;
  monthly_trend: MonthlyTrendItem[];
  class_collection: ClassCollectionItem[];
  expense_by_category: ExpenseByCategoryItem[];
  payment_methods: PaymentMethodItem[];
  weekly_trend: WeeklyTrendItem[];
  top_outstanding: ClassCollectionItem[];
  recent_transactions?: RevenueTransaction[];
}
