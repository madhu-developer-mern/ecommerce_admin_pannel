const express = require("express");
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  getAnalytics
} = require("../controllers/orderController");

// Middleware to inject io
const setupOrderRoutes = (io) => {
  const router = express.Router();

  router.get("/", getOrders);
  
  router.post("/", (req, res) => {
    createOrder(req, res, io);
  });
  
  router.put("/:orderId/status", (req, res) => {
    updateOrderStatus(req, res, io);
  });
  
  router.get("/analytics", getAnalytics);

  return router;
};

module.exports = setupOrderRoutes;
