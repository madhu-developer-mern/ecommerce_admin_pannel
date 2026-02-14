const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Server } = require("socket.io");

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DB_NAME = process.env.DB_NAME || "ecommerce_admin";

const DEFAULT_CATEGORIES = ["mobiles", "shirts", "shoes", "watches", "laptops", "headphones", "tablets", "accessories"];

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: FRONTEND_URL
  })
);
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Enhanced Product Schema with inventory
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    imagePublicId: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    sold: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active"
    }
  },
  { timestamps: true }
);

// Orders Schema
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        productName: String,
        quantity: Number,
        price: Number
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
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

function normalizeCategory(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isValidCategory(category) {
  if (!category || category.length < 2 || category.length > 40) return false;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(category);
}

function getProductModel(category) {
  const modelSafe = category.replace(/[^a-zA-Z0-9_]/g, "_");
  const modelName = `Product_${modelSafe}`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  return mongoose.model(modelName, productSchema, category);
}

function getOrderModel() {
  if (mongoose.models["Order"]) {
    return mongoose.models["Order"];
  }
  return mongoose.model("Order", orderSchema, "orders");
}

async function getCategories() {
  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const dbCategories = collections
    .map((item) => item.name)
    .filter((name) => !name.startsWith("system."))
    .filter((name) => name !== "orders")
    .filter((name) => isValidCategory(name));

  return [...new Set([...DEFAULT_CATEGORIES, ...dbCategories])].sort((a, b) => a.localeCompare(b));
}

// Real-time Analytics Data
async function getAnalyticsData() {
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

    const totalProducts = await Promise.all(
      DEFAULT_CATEGORIES.map(async (cat) => {
        const model = getProductModel(cat);
        return await model.countDocuments();
      })
    );

    return {
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      orderStatus,
      totalProducts: totalProducts.reduce((a, b) => a + b, 0)
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

// ============ Routes ============

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const rawName = req.body?.name;
    const category = normalizeCategory(rawName);

    if (!isValidCategory(category)) {
      return res.status(400).json({
        message: "Invalid category name. Use letters, numbers, hyphen or underscore."
      });
    }

    const exists = await mongoose.connection.db.listCollections({ name: category }, { nameOnly: true }).toArray();
    if (!exists.length) {
      await mongoose.connection.db.createCollection(category);
      io.emit("category_added", { category });
      return res.status(201).json({ message: "Category created successfully", category });
    }

    return res.json({ message: "Category already exists", category });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create category", error: error.message });
  }
});

app.get("/api/products/:category", async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const ProductModel = getProductModel(category);
    const products = await ProductModel.find().sort({ createdAt: -1 });
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

app.get("/api/analytics", async (req, res) => {
  try {
    const analytics = await getAnalyticsData();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, originalPrice, description, stock, rating } = req.body;
    const category = normalizeCategory(req.body?.category);

    if (!name || !price || !category) {
      return res.status(400).json({ message: "name, price and category are required" });
    }

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "image is required" });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    const ProductModel = getProductModel(category);

    const safeName = req.file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: `ecommerce-admin/${category}`,
        public_id: `${Date.now()}-${safeName}`
      }
    );

    const created = await ProductModel.create({
      name,
      price: numericPrice,
      originalPrice: Number(originalPrice) || 0,
      description: description || "",
      category,
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      stock: Number(stock) || 0,
      rating: Number(rating) || 0
    });

    io.emit("product_added", { product: created, category });
    return res.status(201).json({
      message: "Product added successfully",
      product: created
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add product", error: error.message });
  }
});

app.put("/api/products/:category/:id", upload.single("image"), async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    const { id } = req.params;
    const { name, price, originalPrice, description, stock, rating, status } = req.body;

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const ProductModel = getProductModel(category);
    const existing = await ProductModel.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (req.file) {
      await cloudinary.uploader.destroy(existing.imagePublicId);
      const safeName = req.file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: `ecommerce-admin/${category}`,
          public_id: `${Date.now()}-${safeName}`
        }
      );
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      {
        name: name || existing.name,
        price: price ? Number(price) : existing.price,
        originalPrice: originalPrice ? Number(originalPrice) : existing.originalPrice,
        description: description ?? existing.description,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        rating: rating !== undefined ? Number(rating) : existing.rating,
        status: status || existing.status,
        imageUrl,
        imagePublicId
      },
      { new: true }
    );

    io.emit("product_updated", { product: updated, category });
    return res.json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

app.delete("/api/products/:category/:id", async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    const { id } = req.params;

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const ProductModel = getProductModel(category);
    const existing = await ProductModel.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    await cloudinary.uploader.destroy(existing.imagePublicId);
    await ProductModel.findByIdAndDelete(id);

    io.emit("product_deleted", { productId: id, category });
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

// Order Routes
app.get("/api/orders", async (req, res) => {
  try {
    const OrderModel = getOrderModel();
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
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
});

app.put("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const OrderModel = getOrderModel();
    const updated = await OrderModel.findOneAndUpdate({ orderId }, { status }, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    io.emit("order_updated", { order: updated });
    res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
});

// Socket.io Events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("request_analytics", async () => {
    const analytics = await getAnalyticsData();
    socket.emit("analytics_update", analytics);
  });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: DB_NAME
    });

    server.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket running on http://localhost:${PORT}`);
      console.log(`🗄️  MongoDB connected. DB: ${DB_NAME}`);
      console.log(`🌐 MongoDB host: ${mongoose.connection.host}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
}

startServer();
