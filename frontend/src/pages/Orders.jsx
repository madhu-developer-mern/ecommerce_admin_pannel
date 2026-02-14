import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, CheckCircle, Truck, Package } from "lucide-react";
import { API_BASE_URL } from "../config/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700"
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: CheckCircle
};

export default function Orders({ socket }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("order_created", (data) => {
      setOrders(prev => [data.order, ...prev]);
    });

    socket.on("order_updated", (data) => {
      setOrders(prev =>
        prev.map(o => o._id === data.order._id ? data.order : o)
      );
    });

    return () => {
      socket.off("order_created");
      socket.off("order_updated");
    };
  }, [socket]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        { status: newStatus }
      );
      setMessage("Order status updated!");
      fetchOrders();
    } catch (error) {
      setMessage("Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
        <p className="text-gray-600 mt-1">Manage and track customer orders</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = statusIcons[order.status] || Package;
            return (
              <div
                key={order._id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="text-lg font-bold text-gray-900">{order.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="text-lg font-bold text-gray-900">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">₹{order.totalAmount}</p>
                  </div>
                  <div className="flex items-end">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                      <StatusIcon size={16} />
                      <span className="capitalize font-medium">{order.status}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-bold text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600">
                        <span>{item.productName} x{item.quantity}</span>
                        <span className="font-medium text-gray-900">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4 flex gap-2">
                  {["pending", "processing", "shipped", "delivered"].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(order._id, status)}
                      disabled={order.status === status}
                      className={`px-3 py-1 text-sm rounded-lg capitalize font-medium transition ${
                        order.status === status
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
