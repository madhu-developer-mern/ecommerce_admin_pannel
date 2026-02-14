const mongoose = require("mongoose");

function getOrderModel() {
  if (mongoose.models["Order"]) {
    return mongoose.models["Order"];
  }

  const orderSchema = new mongoose.Schema(
    {
      orderId: { type: String, required: true, unique: true },
      customerId: { type: String, required: true },
      customerName: { type: String, required: true },
      items: [
        {
          productId: mongoose.Schema.Types.ObjectId,
          productName: String,
          quantity: Number,
          price: Number
        }
      ],
      totalAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
      },
      paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid"
      }
    },
    { timestamps: true }
  );

  return mongoose.model("Order", orderSchema, "orders");
}

// Get all orders
const getOrders = async (req, res) => {
  try {
    const OrderModel = getOrderModel();
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// Create new order
const createOrder = async (req, res, io) => {
  try {
    const { customerId, customerName, items, totalAmount } = req.body;

    if (!customerId || !customerName || !items || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const OrderModel = getOrderModel();
    const orderId = `ORD-${Date.now()}`;

    const created = await OrderModel.create({
      orderId,
      customerId,
      customerName,
      items,
      totalAmount
    });

    io.emit("order_created", { order: created });
    res.status(201).json({ message: "Order created successfully", order: created });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res, io) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const OrderModel = getOrderModel();
    const updated = await OrderModel.findOneAndUpdate({ orderId }, { status }, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    io.emit("order_updated", { order: updated });
    return res.status(200).json({ message: "Order status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};

// Get analytics data
const getAnalyticsData = async () => {
  try {
    const OrderModel = getOrderModel();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = await OrderModel.countDocuments();
    const todayOrders = await OrderModel.countDocuments({
      createdAt: { $gte: today }
    });

    const totalRevenue = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const todayRevenue = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const orderStatus = await OrderModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    return {
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      orderStatus
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
};

const getAnalytics = async (req, res) => {
  try {
    const analytics = await getAnalyticsData();
    return res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  getAnalytics,
  getAnalyticsData,
  getOrderModel
};
