import { useEffect, useState } from 'react';
import { accountingService, type IncomeStatement, type StatementBalanceSheet, type CashFlowStatement } from '../../../services/accountingService';

const nowDate = () => new Date().toISOString().slice(0, 10);
const yearStart = () => `${new Date().getFullYear()}-01-01`;
const money = (v: number) => `KES ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancialStatements() {
  const [startDate, setStartDate] = useState(yearStart());
  const [endDate, setEndDate] = useState(nowDate());
  const [asOfDate, setAsOfDate] = useState(nowDate());

  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<StatementBalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [income, balance, cash] = await Promise.all([
        accountingService.getIncomeStatement({ start_date: startDate, end_date: endDate }),
        accountingService.getBalanceSheet(asOfDate),
        accountingService.getCashFlow({ start_date: startDate, end_date: endDate }),
      ]);
      setIncomeStatement(income);
      setBalanceSheet(balance);
      setCashFlow(cash);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load financial statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Financial Statements</h1>
      <p className="text-sm text-gray-500 mb-4">Income statement, balance sheet, and cash flow from accounting journals.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Balance Sheet As Of</label>
          <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">Refresh Statements</button>
      </div>

      {message && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{message}</div>}
      {loading && <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 text-sm">Loading...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Income Statement</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Income</span><span className="font-medium">{money(incomeStatement?.income || 0)}</span></div>
            <div className="flex justify-between"><span>Expenses</span><span className="font-medium">{money(incomeStatement?.expenses || 0)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Profit / Loss</span><span className={(incomeStatement?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}>{money(incomeStatement?.profit || 0)}</span></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Balance Sheet</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Assets</span><span className="font-medium">{money(balanceSheet?.assets || 0)}</span></div>
            <div className="flex justify-between"><span>Liabilities</span><span className="font-medium">{money(balanceSheet?.liabilities || 0)}</span></div>
            <div className="flex justify-between"><span>Equity</span><span className="font-medium">{money(balanceSheet?.equity || 0)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Status</span>
              <span className={(balanceSheet?.is_balanced ?? false) ? 'text-emerald-600' : 'text-red-600'}>{(balanceSheet?.is_balanced ?? false) ? 'Balanced' : 'Not Balanced'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Cash Flow</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Operating</span><span className="font-medium">{money(cashFlow?.operating || 0)}</span></div>
            <div className="flex justify-between"><span>Investing</span><span className="font-medium">{money(cashFlow?.investing || 0)}</span></div>
            <div className="flex justify-between"><span>Financing</span><span className="font-medium">{money(cashFlow?.financing || 0)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Net Cash Flow</span><span className={(cashFlow?.net_cash_flow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}>{money(cashFlow?.net_cash_flow || 0)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
