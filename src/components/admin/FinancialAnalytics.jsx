import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export function FinancialAnalytics() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0
  });

  useEffect(() => {
    calculateFinancials();
  }, []);

  const calculateFinancials = () => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

    // 1. Get last 7 days dates
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    // 2. Aggregate Data
    const chartData = last7Days.map(dateStr => {
      // Revenue: Sum of completed/paid orders for this date
      const dailyRevenue = orders
        .filter(o => 
          new Date(o.createdAt).toDateString() === dateStr && 
          o.status !== 'cancelled'
        )
        .reduce((sum, o) => sum + o.total, 0);

      // Expenses: Sum of expenses for this date
      const dailyExpense = expenses
        .filter(e => new Date(e.date).toDateString() === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        date: new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        revenue: dailyRevenue,
        expense: dailyExpense,
        profit: dailyRevenue - dailyExpense
      };
    });

    // 3. Calculate Totals (All time or Monthly could be better, but using Chart Window for now)
    const totalRev = chartData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExp = chartData.reduce((acc, curr) => acc + curr.expense, 0);
    const net = totalRev - totalExp;
    const margin = totalRev > 0 ? (net / totalRev) * 100 : 0;

    setData(chartData);
    setSummary({
      totalRevenue: totalRev,
      totalExpense: totalExp,
      netProfit: net,
      profitMargin: margin
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground mb-2">Financial Analytics</h1>
        <p className="text-muted-foreground">Profit & Loss overview for the last 7 days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-200 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-green-800 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-green-900">Rs. {summary.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-200 rounded-full">
              <TrendingDown className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-red-800 font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-red-900">Rs. {summary.totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 border ${summary.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${summary.netProfit >= 0 ? 'bg-blue-200' : 'bg-orange-200'}`}>
              <DollarSign className={`h-5 w-5 ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`} />
            </div>
            <div>
              <p className={`text-xs font-medium ${summary.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Net Profit</p>
              <p className={`text-xl font-bold ${summary.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                Rs. {summary.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-full">
              <Activity className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xs text-purple-800 font-medium">Profit Margin</p>
              <p className="text-xl font-bold text-purple-900">{summary.profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <Card className="p-6">
          <h3 className="mb-6 font-semibold">Income vs Expenses (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`Rs. ${value}`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Net Profit Trend */}
        <Card className="p-6">
          <h3 className="mb-6 font-semibold">Net Profit Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`Rs. ${value}`, 'Profit']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Net Profit" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}