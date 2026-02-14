import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Package, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function ProductsDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        const cats = response.data.categories || [];
        setCategories(cats);
        
        const initial = location.state?.category || cats[0];
        setSelectedCategory(initial);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory();
    }
  }, [selectedCategory]);

  const fetchProductsByCategory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/products/${selectedCategory}`
      );
      const prods = response.data.products || [];
      setProducts(prods);
      
      // Calculate stats
      const stats = {
        total: prods.length,
        inStock: prods.filter(p => p.stock > 0).length,
        outOfStock: prods.filter(p => p.stock === 0).length,
        avgRating: prods.length > 0 
          ? (prods.reduce((sum, p) => sum + (p.rating || 0), 0) / prods.length).toFixed(1)
          : 0,
        avgPrice: prods.length > 0 
          ? Math.floor(prods.reduce((sum, p) => sum + (p.price || 0), 0) / prods.length)
          : 0
      };
      setCategoryStats(stats);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products Details</h2>
          <p className="text-gray-600 mt-1">View category-wise product information</p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Category</label>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition capitalize font-medium ${
                selectedCategory === cat
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Category Stats */}
      {selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{categoryStats.total}</p>
              </div>
              <Package className="text-blue-400 opacity-50" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{categoryStats.inStock}</p>
              </div>
              <Package className="text-green-400 opacity-50" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{categoryStats.outOfStock}</p>
              </div>
              <Package className="text-red-400 opacity-50" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{categoryStats.avgRating} ⭐</p>
              </div>
              <TrendingUp className="text-yellow-400 opacity-50" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">₹{categoryStats.avgPrice}</p>
              </div>
              <Package className="text-purple-400 opacity-50" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {selectedCategory} Products ({products.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No products found in this category
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">₹{product.price}</p>
                        {product.originalPrice > product.price && (
                          <p className="text-xs text-gray-500 line-through">₹{product.originalPrice}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.stock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{product.rating || 0} ⭐</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{product.sold || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{product.discount || 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
