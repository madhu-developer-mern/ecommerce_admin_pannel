const express = require("express");
const https = require("https");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { Server } = require("socket.io");
const { v2: cloudinary } = require("cloudinary");
const { connectDB } = require("./db");
const userAuthRoutes = require("./routes/userAuth");
const { router: adminAuthRoutes } = require("./routes/adminAuth");
const setupProductRoutes = require("./routes/products");
const setupCategoryRoutes = require("./routes/categories");
const setupOrderRoutes = require("./routes/orders");
const { getAnalyticsData } = require("./controllers/orderController");

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DB_NAME = process.env.DB_NAME || "ecommerce_admin";

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// Mount routes
app.use("/api/user", userAuthRoutes);
app.use("/api/auth", adminAuthRoutes);
app.use("/api/categories", setupCategoryRoutes(io));
app.use("/api/products", setupProductRoutes(io, upload));
app.use("/api/orders", setupOrderRoutes(io));

// Analytics endpoint
app.get("/api/analytics", async (req, res) => {
  try {
    const analytics = await getAnalyticsData();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
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

// Start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    await connectDB({ dbName: DB_NAME });
    console.log(`✅ MongoDB connected. DB: ${DB_NAME}`);

    const certPath = path.join(__dirname, "certificates");
    const certFile = path.join(certPath, "server.crt");
    const keyFile = path.join(certPath, "server.key");

    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      try {
        const options = {
          cert: fs.readFileSync(certFile),
          key: fs.readFileSync(keyFile)
        };
        const httpsServer = https.createServer(options, app);
        const ioHttps = new Server(httpsServer, {
          cors: {
            origin: FRONTEND_URL,
            methods: ["GET", "POST"]
          }
        });

        httpsServer.listen(PORT, () => {
          console.log(`🔒 Backend running on https://localhost:${PORT}`);
          console.log(`📡 WebSocket running on https://localhost:${PORT}`);
        });
      } catch (httpsError) {
        console.warn("⚠️  HTTPS setup failed, falling back to HTTP:", httpsError.message);
        server.listen(PORT, () => {
          console.log(`🚀 Backend running on http://localhost:${PORT}`);
          console.log(`📡 WebSocket running on http://localhost:${PORT}`);
        });
      }
    } else {
      server.listen(PORT, () => {
        console.log(`🚀 Backend running on http://localhost:${PORT}`);
        console.log(`📡 WebSocket running on http://localhost:${PORT}`);
        console.log(`\n💡 To enable HTTPS, run: node generate-certificates.js`);
      });
    }
  } catch (error) {
    console.error("Server failed to start:", error.stack || error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
