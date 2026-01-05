import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/environment";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface MonthlyPayment {
  month: string;
  amount: number;
}

interface ClassPayment {
  class_name: string;
  amount: number;
  count: number;
}

interface PaymentMethod {
  method: string;
  value: number;
  count: number;
}

interface FinanceAnalytics {
  kpi: {
    total_invoiced: number;
    total_paid: number;
    total_unpaid: number;
    students_with_balance: number;
    collections_this_year: number;
    collections_this_month: number;
  };
  monthly_payments: MonthlyPayment[];
  class_payments: ClassPayment[];
  payment_methods: PaymentMethod[];
  year: number;
}

const SchoolFinance: React.FC = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    const schoolInfo = localStorage.getItem("school_info");
    if (schoolInfo) {
      try {
        const parsedInfo = JSON.parse(schoolInfo);
        setSchoolId(parsedInfo.id);
      } catch (error) {
        console.error("Error parsing school_info:", error);
      }
    } else {
      console.error("School info not found in local storage.");
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("staff_access_token");
      const response = await axios.get<FinanceAnalytics>(
        `${API_BASE_URL}/api/finance/analytics/?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load finance analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMethods = () => {
    navigate(`/school/${schoolId}/fee-payment-methods`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Colors for pie chart
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  // Generate year options (current year and 4 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="p-6 font-sans bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 font-sans bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpi = analytics?.kpi || {
    total_invoiced: 0,
    total_paid: 0,
    total_unpaid: 0,
    students_with_balance: 0,
    collections_this_year: 0,
    collections_this_month: 0,
  };

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            School Finance Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time financial insights and payment analytics
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(kpi.total_paid)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Outstanding Fees</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(kpi.total_unpaid)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{kpi.students_with_balance} students with balance</p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Year</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(kpi.collections_this_year)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Month</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(kpi.collections_this_month)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Payments Line Chart - Full Row */}
      <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Monthly Payments ({selectedYear})</h3>
          <div className="text-sm text-gray-500">
            Total: {formatCurrency(analytics?.monthly_payments?.reduce((acc, item) => acc + item.amount, 0) || 0)}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.monthly_payments || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#1D4ED8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payments by Class Line Chart - Full Row */}
      <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Payments by Class</h3>
          <div className="text-sm text-gray-500">
            {analytics?.class_payments?.length || 0} classes
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.class_payments || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="class_name" 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'amount') return [formatCurrency(value), 'Total Amount'];
                if (name === 'count') return [value, 'Payments'];
                return [value, name];
              }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods Pie Chart - Full Row */}
      <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Payment Methods Distribution</h3>
          <div className="text-sm text-gray-500">
            {analytics?.payment_methods?.reduce((acc, item) => acc + item.count, 0) || 0} total transactions
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analytics?.payment_methods || []}
                  dataKey="value"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  label={(props: any) => `${props.name} (${(props.percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {(analytics?.payment_methods || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:pl-8">
            <div className="space-y-4">
              {(analytics?.payment_methods || []).map((method, index) => (
                <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium text-gray-700">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(method.value)}</p>
                    <p className="text-xs text-gray-500">{method.count} transactions</p>
                  </div>
                </div>
              ))}
              {(!analytics?.payment_methods || analytics.payment_methods.length === 0) && (
                <p className="text-gray-500 text-center py-4">No payment data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleViewMethods}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-3 transition-colors"
          >
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Payment Methods</p>
              <p className="text-sm text-gray-500">Manage payment options</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/staff/finance/payments')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl flex items-center gap-3 transition-colors"
          >
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Record Payment</p>
              <p className="text-sm text-gray-500">Add new payment</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/staff/finance/invoices')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center gap-3 transition-colors"
          >
            <div className="p-2 bg-purple-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">View Invoices</p>
              <p className="text-sm text-gray-500">Manage fee invoices</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolFinance;
