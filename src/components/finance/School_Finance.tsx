import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

const SchoolFinance: React.FC = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
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
      // Redirect to login in later update
    }
  }, []);

  const handleViewMethods = () => {
    navigate(`/school/${schoolId}/fee-payment-methods`);
  };

  // Dummy data for charts
  const incomeData = [
    { month: "Jan", income: 12000 },
    { month: "Feb", income: 15000 },
    { month: "Mar", income: 10000 },
    { month: "Apr", income: 18000 },
    { month: "May", income: 14000 },
  ];

  const expenseData = [
    { name: "Salaries", value: 5000 },
    { name: "Utilities", value: 2000 },
    { name: "Supplies", value: 1000 },
    { name: "Maintenance", value: 1500 },
  ];

  const COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545"];

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        School Finance Dashboard
      </h2>
      <p className="text-gray-600 mb-6">
        Manage financial settings, fee payments, and get insights into your school’s financial health.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-2xl p-4 text-center">
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">Ksh 75,000</p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 text-center">
          <h3 className="text-lg font-semibold">Outstanding Fees</h3>
          <p className="text-2xl font-bold text-red-500">Ksh 15,000</p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 text-center">
          <h3 className="text-lg font-semibold">Total Expenses</h3>
          <p className="text-2xl font-bold text-orange-500">Ksh 9,500</p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 text-center">
          <h3 className="text-lg font-semibold">Net Balance</h3>
          <p className="text-2xl font-bold text-blue-600">Ksh 65,500</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="text-xl font-semibold mb-2">Monthly Income</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#007bff" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="text-xl font-semibold mb-2">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleViewMethods}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-md transition"
        >
          View Payment Methods
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-md transition">
          Generate Report
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl shadow-md transition">
          Manage Expenses
        </button>
      </div>
    </div>
  );
};

export default SchoolFinance;
