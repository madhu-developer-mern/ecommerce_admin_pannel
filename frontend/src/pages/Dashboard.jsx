import { TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function StatCard({ icon: Icon, title, value, change, bgColor, onClick, clickable }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          {change && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> {change}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${bgColor}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ analytics, socket }) {
  const navigate = useNavigate();
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoadingCategories(true);
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        const categories = response.data.categories || [];
        
        const counts = {};
        for (const cat of categories) {
          const prodResponse = await axios.get(`${API_BASE_URL}/api/products/${cat}`);
          counts[cat] = prodResponse.data.products?.length || 0;
        }
        setCategoryProducts(counts);
      } catch (error) {
        console.error("Failed to fetch category products", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategoryProducts();
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${(analytics.totalRevenue || 0).toLocaleString()}`}
          change="12"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={(analytics.totalOrders || 0).toLocaleString()}
          change="8"
          bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Package}
          title="Total Products"
          value={(analytics.totalProducts || 0).toLocaleString()}
          change="5"
          clickable={true}
          onClick={() => navigate("/products-details")}
          bgColor="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Today's Revenue"
          value={`₹${(analytics.todayRevenue || 0).toLocaleString()}`}
          change="15"
          bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Order #{1000 + i}</p>
                  <p className="text-sm text-gray-600">Customer order processed</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status</h3>
          <div className="space-y-3">
            {analytics.orderStatus?.map((status) => (
              <div key={status._id} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{status._id}</span>
                <span className="font-bold text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Today's Orders</span>
              <span className="font-bold text-gray-900">{analytics.todayOrders || 0}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-bold text-gray-900">
                ₹{Math.floor((analytics.totalRevenue || 0) / Math.max(analytics.totalOrders || 1, 1)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">Total Categories</span>
              <span className="font-bold text-gray-900">8</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Categories</h3>
          <div className="space-y-3">
            {["Electronics", "Fashion", "Accessories"].map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${100 - i * 20}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">{100 - i * 20}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Products by Category</h3>
        {loadingCategories ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(categoryProducts).map(([category, count]) => (
              <div
                key={category}
                onClick={() => navigate("/products-details", { state: { category } })}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md hover:border-blue-400 transition cursor-pointer"
              >
                <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{count}</p>
                <p className="text-xs text-gray-500 mt-1">products</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
