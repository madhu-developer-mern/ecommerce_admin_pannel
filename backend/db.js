const mongoose = require("mongoose");
const path = require("path");

async function connectDB(options = {}) {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || options.dbName || "ecommerce_admin";

  if (!uri) {
    throw new Error("MONGO_URI is not set in environment");
  }

  try {
    return await mongoose.connect(uri, { dbName });
  } catch (err) {
    console.error("MongoDB connection error:", err.stack || err.message);
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
}

module.exports = { connectDB };
