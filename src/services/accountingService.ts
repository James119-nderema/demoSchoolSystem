import { APIService } from './baseUrl';

const AUTH: 'staff' = 'staff';

const CORE_BASE = '/api/accounting/core';
const TRIAL_BALANCE_BASE = '/api/accounting/trial-balance';
const GENERAL_LEDGER_BASE = '/api/accounting/general-ledger';
const BANK_RECON_BASE = '/api/accounting/bank-reconciliation';
const REPORTS_BASE = '/api/accounting/reports';

const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val) qs.set(key, val);
  });
  const q = qs.toString();
  return q ? `?${q}` : '';
};

const getSchoolId = (): string => {
  try {
    const staffRaw = localStorage.getItem('staff_info');
    if (staffRaw) {
      const staff = JSON.parse(staffRaw);
      if (staff?.school_id) return String(staff.school_id);
    }

    const schoolRaw = localStorage.getItem('school_info');
    if (schoolRaw) {
      const school = JSON.parse(schoolRaw);
      if (school?.id) return String(school.id);
    }
  } catch {
    // no-op
  }
  return '';
};

export interface AccountingAccount {
  id?: string;
  school_id?: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  normal_balance: 'debit' | 'credit';
  parent?: string | null;
  is_bank_account?: boolean;
  is_cash_account?: boolean;
  is_active?: boolean;
}

export interface JournalLineInput {
  account: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalLine {
  id: string;
  account: string;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  school_id: string;
  entry_date: string;
  description: string;
  reference?: string;
  source_module?: string;
  source_id?: string;
  posted_by?: string;
  total_debit?: number;
  total_credit?: number;
  is_balanced?: boolean;
  lines?: JournalLine[];
}

export interface TrialBalanceRow {
  account_id: string;
  code: string;
  name: string;
  account_type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceResponse {
  rows: TrialBalanceRow[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export interface GeneralLedgerRow {
  date: string;
  journal_entry_id: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface GeneralLedgerResponse {
  account: {
    id: string;
    code: string;
    name: string;
    normal_balance: string;
  };
  opening_balance: number;
  closing_balance: number;
  rows: GeneralLedgerRow[];
}

export interface BankStatementLine {
  id?: string;
  school_id?: string;
  bank_account_number?: string;
  statement_date: string;
  reference: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  matched?: boolean;
  notes?: string;
}

export interface ReconciliationSummary {
  book_balance: number;
  statement_balance: number;
  difference: number;
  unmatched_count: number;
  unmatched_amount: number;
}

export interface IncomeStatement {
  income: number;
  expenses: number;
  profit: number;
}

export interface StatementBalanceSheet {
  assets: number;
  liabilities: number;
  equity: number;
  is_balanced: boolean;
}

export interface CashFlowStatement {
  operating: number;
  investing: number;
  financing: number;
  net_cash_flow: number;
}

export const accountingService = {
  getSchoolId,

  async getAccounts(): Promise<AccountingAccount[]> {
    const schoolId = getSchoolId();
    return APIService.get(`${CORE_BASE}/accounts/`, { school_id: schoolId }, AUTH);
  },

  async createAccount(payload: AccountingAccount): Promise<AccountingAccount> {
    const schoolId = getSchoolId();
    return APIService.post(`${CORE_BASE}/accounts/`, { ...payload, school_id: schoolId }, AUTH);
  },

  async updateAccount(accountId: string, payload: Partial<AccountingAccount>): Promise<AccountingAccount> {
    return APIService.put(`${CORE_BASE}/accounts/${accountId}/`, payload, AUTH);
  },

  async getJournalEntries(filters?: { start_date?: string; end_date?: string }): Promise<JournalEntry[]> {
    const schoolId = getSchoolId();
    const endpoint = `${CORE_BASE}/journal-entries/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    return APIService.get(endpoint, undefined, AUTH);
  },

  async getJournalEntry(entryId: string): Promise<JournalEntry> {
    return APIService.get(`${CORE_BASE}/journal-entries/${entryId}/`, undefined, AUTH);
  },

  async createJournalEntry(payload: {
    entry_date: string;
    description: string;
    reference?: string;
    source_module?: string;
    source_id?: string;
    posted_by?: string;
    lines: JournalLineInput[];
  }): Promise<JournalEntry> {
    const schoolId = getSchoolId();
    return APIService.post(`${CORE_BASE}/journal-entries/`, { ...payload, school_id: schoolId }, AUTH);
  },

  async getTrialBalance(filters?: { start_date?: string; end_date?: string }): Promise<TrialBalanceResponse> {
    const schoolId = getSchoolId();
    const endpoint = `${TRIAL_BALANCE_BASE}/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return {
      ...data,
      total_debit: parseNumber(data.total_debit),
      total_credit: parseNumber(data.total_credit),
      rows: (data.rows || []).map((row: any) => ({ ...row, debit: parseNumber(row.debit), credit: parseNumber(row.credit) })),
    };
  },

  async getGeneralLedger(accountId: string, filters?: { start_date?: string; end_date?: string }): Promise<GeneralLedgerResponse> {
    const schoolId = getSchoolId();
    const endpoint = `${GENERAL_LEDGER_BASE}/accounts/${accountId}/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return {
      ...data,
      opening_balance: parseNumber(data.opening_balance),
      closing_balance: parseNumber(data.closing_balance),
      rows: (data.rows || []).map((row: any) => ({
        ...row,
        debit: parseNumber(row.debit),
        credit: parseNumber(row.credit),
        running_balance: parseNumber(row.running_balance),
      })),
    };
  },

  async getBankStatementLines(): Promise<BankStatementLine[]> {
    const schoolId = getSchoolId();
    return APIService.get(`${BANK_RECON_BASE}/statement-lines/`, { school_id: schoolId }, AUTH);
  },

  async addBankStatementLine(payload: BankStatementLine): Promise<BankStatementLine> {
    const schoolId = getSchoolId();
    return APIService.post(`${BANK_RECON_BASE}/statement-lines/`, { ...payload, school_id: schoolId }, AUTH);
  },

  async matchBankTransaction(payload: { statement_line_id: string; journal_line_id: string; matched_by?: string }) {
    const schoolId = getSchoolId();
    return APIService.post(`${BANK_RECON_BASE}/match/`, { ...payload, school_id: schoolId }, AUTH);
  },

  async getBankReconciliationSummary(filters?: { start_date?: string; end_date?: string }): Promise<ReconciliationSummary> {
    const schoolId = getSchoolId();
    const endpoint = `${BANK_RECON_BASE}/summary/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return {
      book_balance: parseNumber(data.book_balance),
      statement_balance: parseNumber(data.statement_balance),
      difference: parseNumber(data.difference),
      unmatched_count: parseNumber(data.unmatched_count),
      unmatched_amount: parseNumber(data.unmatched_amount),
    };
  },

  async getIncomeStatement(filters?: { start_date?: string; end_date?: string }): Promise<IncomeStatement> {
    const schoolId = getSchoolId();
    const endpoint = `${REPORTS_BASE}/income-statement/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return { income: parseNumber(data.income), expenses: parseNumber(data.expenses), profit: parseNumber(data.profit) };
  },

  async getBalanceSheet(as_of_date?: string): Promise<StatementBalanceSheet> {
    const schoolId = getSchoolId();
    const endpoint = `${REPORTS_BASE}/balance-sheet/${buildQuery({ school_id: schoolId, as_of_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return {
      assets: parseNumber(data.assets),
      liabilities: parseNumber(data.liabilities),
      equity: parseNumber(data.equity),
      is_balanced: Boolean(data.is_balanced),
    };
  },

  async getCashFlow(filters?: { start_date?: string; end_date?: string }): Promise<CashFlowStatement> {
    const schoolId = getSchoolId();
    const endpoint = `${REPORTS_BASE}/cash-flow/${buildQuery({ school_id: schoolId, start_date: filters?.start_date, end_date: filters?.end_date })}`;
    const data = await APIService.get<any>(endpoint, undefined, AUTH);
    return {
      operating: parseNumber(data.operating),
      investing: parseNumber(data.investing),
      financing: parseNumber(data.financing),
      net_cash_flow: parseNumber(data.net_cash_flow),
    };
  },
};
