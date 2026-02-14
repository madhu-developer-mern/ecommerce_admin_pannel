import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics({ socket }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("analytics_update", (data) => {
      setAnalytics(data);
    });

    return () => {
      socket.off("analytics_update");
    };
  }, [socket]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue",
        data: [12000, 15000, 18000, 14000, 22000, 25000, 20000],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const ordersChartData = {
    labels: ["Processing", "Shipped", "Delivered", "Cancelled"],
    datasets: [
      {
        label: "Orders by Status",
        data: [45, 32, 78, 12],
        backgroundColor: [
          "#fbbf24",
          "#a78bfa",
          "#34d399",
          "#f87171"
        ],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom"
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600 mt-1">Detailed insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
          <Line data={revenueChartData} options={chartOptions} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h3>
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <p className="text-gray-700 text-sm font-medium">Total Revenue</p>
          <h3 className="text-3xl font-bold text-blue-900 mt-2">
            ₹{analytics?.totalRevenue?.toLocaleString() || "0"}
          </h3>
          <p className="text-xs text-blue-700 mt-2">↑ 12% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <p className="text-gray-700 text-sm font-medium">Total Orders</p>
          <h3 className="text-3xl font-bold text-purple-900 mt-2">
            {analytics?.totalOrders?.toLocaleString() || "0"}
          </h3>
          <p className="text-xs text-purple-700 mt-2">↑ 8% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <p className="text-gray-700 text-sm font-medium">Average Order Value</p>
          <h3 className="text-3xl font-bold text-green-900 mt-2">
            ₹{analytics?.totalOrders ? Math.floor(analytics.totalRevenue / analytics.totalOrders).toLocaleString() : "0"}
          </h3>
          <p className="text-xs text-green-700 mt-2">↑ 5% from last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {[
              { name: "iPhone 15 Pro", sales: 342, revenue: "₹442,00,000" },
              { name: "MacBook Pro 16\"", sales: 145, revenue: "₹362,50,000" },
              { name: "Sony WH-1000XM5", sales: 567, revenue: "₹141,75,000" },
              { name: "iPad Pro 12.9\"", sales: 156, revenue: "₹186,95,000" }
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
                <p className="font-bold text-gray-900">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Repeat Customers</span>
                <span className="text-sm font-bold text-gray-900">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="text-sm font-bold text-gray-900">4.7/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Mobile Traffic</span>
                <span className="text-sm font-bold text-gray-900">58%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "58%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
