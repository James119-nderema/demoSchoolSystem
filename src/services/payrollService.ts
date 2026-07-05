import { APIService } from './baseUrl';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface SalaryStructure {
  id?: number;
  staff: string;
  staff_name?: string;
  staff_email?: string;
  staff_phone?: string;
  staff_role?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  tax_deduction: number;
  sha_deduction: number;
  nssf_deduction: number;
  housing_levy_deduction: number;
  insurance_deduction: number;
  nhif_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  pay_frequency: 'monthly' | 'once' | 'yearly';
  payment_method: 'mpesa' | 'bank';
  phone_number: string;
  // Optional extended payroll/contact fields used in the frontend forms
  kra_pin?: string;
  mpesa_number?: string;
  bank_account?: string;
  nhif_number?: string;
  nssf_number?: string;
  department?: string;
  bank_name: string;
  bank_account_number: string;
  bank_code: string;
  gross_salary?: number;
  total_deductions?: number;
  net_salary?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StaffForPayroll {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
}

export interface PayrollRecord {
  id: number;
  staff_name: string;
  staff_email: string;
  staff_role: string;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  payment_method: string;
  payment_destination: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  failure_reason: string;
}

export interface PayrollRun {
  id: number;
  month: number;
  month_name?: string;
  year: number;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  total_amount: number;
  processed_count: number;
  failed_count: number;
  record_count?: number;
  notes: string;
  created_by: string;
  created_at: string;
  records?: PayrollRecord[];
}

export interface PaymentTransaction {
  id: number;
  transaction_type: 'b2c' | 'b2b';
  amount: number;
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  conversation_id: string;
  originator_conversation_id: string;
  mpesa_receipt: string;
  result_code: string;
  result_description: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollDashboardStats {
  total_staff: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_runs: number;
  latest_run: PayrollRun | null;
}

export interface RevenueStats {
  total_revenue: number;
  total_paid_out: number;
  total_pending: number;
  available_balance: number;
  monthly_obligation: number;
}

export interface PAYEBracket {
  id?: string;
  lower_limit: number;
  upper_limit: number | null;
  rate: number;
  order: number;
}

export interface DeductionConfig {
  id?: string;
  school_id?: string;
  sha_enabled: boolean;
  sha_rate: number;
  nssf_enabled: boolean;
  nssf_tier1_rate: number;
  nssf_tier1_limit: number;
  nssf_tier2_rate: number;
  nssf_tier2_limit: number;
  housing_levy_enabled: boolean;
  housing_levy_rate: number;
  paye_enabled: boolean;
  personal_relief: number;
  insurance_relief_rate: number;
  insurance_enabled: boolean;
  insurance_rate: number;
  insurance_name: string;
  paye_brackets: PAYEBracket[];
  created_at?: string;
  updated_at?: string;
}

export interface DeductionPreview {
  paye: number;
  sha: number;
  nssf: number;
  housing_levy: number;
  insurance: number;
  loan_deduction: number;
  total_deductions: number;
  net_salary: number;
}

export interface PaymentIntegrationSettings {
  id?: string;
  school_id?: string;
  provider: 'daraja' | 'bank';
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_branch: string;
  bank_swift_code: string;
  daraja_environment: 'sandbox' | 'production';
  daraja_paybill: string;
  daraja_consumer_key: string;
  daraja_consumer_secret?: string;
  daraja_access_token?: string;
  daraja_initiator_name: string;
  daraja_initiator_password?: string;
  daraja_b2c_queue_url: string;
  daraja_b2c_result_url: string;
  daraja_b2b_queue_url: string;
  daraja_b2b_result_url: string;
  jenga_api_key: string;
  jenga_api_secret?: string;
  jenga_merchant_code: string;
  jenga_api_base_url: string;
  has_daraja_consumer_secret?: boolean;
  has_daraja_access_token?: boolean;
  has_daraja_initiator_password?: boolean;
  has_jenga_api_secret?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

const BASE = '/api/payroll';
const AUTH: 'staff' = 'staff';

// ═══════════════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════════════

export const payrollService = {
  // ─── Dashboard ──────────────────────────────────────────────────────────
  async getDashboardStats(): Promise<PayrollDashboardStats> {
    return APIService.get(`${BASE}/dashboard/`, undefined, AUTH);
  },

  // ─── Revenue Stats ────────────────────────────────────────────────────
  async getRevenueStats(): Promise<RevenueStats> {
    return APIService.get(`${BASE}/revenue/`, undefined, AUTH);
  },

  // ─── Deduction Config ─────────────────────────────────────────────────
  async getDeductionConfig(): Promise<DeductionConfig> {
    return APIService.get(`${BASE}/deductions/config/`, undefined, AUTH);
  },

  async getPaymentIntegrationSettings(): Promise<PaymentIntegrationSettings> {
    return APIService.get(`${BASE}/payment-settings/`, undefined, AUTH);
  },

  async updatePaymentIntegrationSettings(data: Partial<PaymentIntegrationSettings>): Promise<PaymentIntegrationSettings> {
    return APIService.put(`${BASE}/payment-settings/`, data, AUTH);
  },

  async updateDeductionConfig(data: Partial<DeductionConfig>): Promise<DeductionConfig> {
    return APIService.put(`${BASE}/deductions/config/`, data, AUTH);
  },

  async updatePAYEBrackets(brackets: Omit<PAYEBracket, 'id'>[]): Promise<PAYEBracket[]> {
    return APIService.put(`${BASE}/deductions/brackets/`, { brackets }, AUTH);
  },

  async previewDeductions(gross_salary: number, loan_deduction?: number): Promise<DeductionPreview> {
    return APIService.post(`${BASE}/deductions/preview/`, { gross_salary, loan_deduction: loan_deduction || 0 }, AUTH);
  },

  async recalculateAllSalaries(): Promise<{ message: string; count: number }> {
    return APIService.post(`${BASE}/deductions/recalculate/`, {}, AUTH);
  },

  // ─── Staff (for salary assignment dropdown) ─────────────────────────────
  async getStaffList(): Promise<StaffForPayroll[]> {
    return APIService.get(`${BASE}/staff/`, undefined, AUTH);
  },

  // ─── Salary Structures ─────────────────────────────────────────────────
  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return APIService.get(`${BASE}/salaries/`, undefined, AUTH);
  },

  async createSalaryStructure(data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return APIService.post(`${BASE}/salaries/`, data, AUTH);
  },

  async updateSalaryStructure(id: number, data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return APIService.put(`${BASE}/salaries/${id}/`, data, AUTH);
  },

  async deleteSalaryStructure(id: number): Promise<void> {
    return APIService.delete(`${BASE}/salaries/${id}/`, AUTH);
  },

  // ─── Payroll Runs ──────────────────────────────────────────────────────
  async getPayrollRuns(): Promise<PayrollRun[]> {
    return APIService.get(`${BASE}/runs/`, undefined, AUTH);
  },

  async getPayrollRun(id: number): Promise<PayrollRun> {
    return APIService.get(`${BASE}/runs/${id}/`, undefined, AUTH);
  },

  async createPayrollRun(month: number, year: number, staffIds?: string[]): Promise<PayrollRun> {
    const payload: Record<string, unknown> = { month, year };
    if (staffIds && staffIds.length > 0) payload.staff_ids = staffIds;
    return APIService.post(`${BASE}/runs/`, payload, AUTH);
  },

  async deletePayrollRun(id: number): Promise<void> {
    return APIService.delete(`${BASE}/runs/${id}/`, AUTH);
  },

  // ─── Process / Pay ────────────────────────────────────────────────────
  async processPayrollRun(payrollRunId: number, recordIds?: string[]): Promise<PayrollRun> {
    const payload: Record<string, unknown> = { payroll_run_id: payrollRunId, simulate: true };
    if (recordIds && recordIds.length > 0) payload.record_ids = recordIds;
    return APIService.post(`${BASE}/process/`, payload, AUTH);
  },

  async singlePayment(data: {
    staff_id: string;
    amount: number;
    payment_method: 'mpesa' | 'bank';
    destination: string;
    description?: string;
  }): Promise<{ success: boolean; transaction_id?: number; error?: string }> {
    return APIService.post(`${BASE}/pay/`, { ...data, simulate: true }, AUTH);
  },

  // ─── Transactions ─────────────────────────────────────────────────────
  async getTransactions(): Promise<PaymentTransaction[]> {
    return APIService.get(`${BASE}/transactions/`, undefined, AUTH);
  },
};
