const express = require("express");
const { getCategories, createCategory } = require("../controllers/categoryController");

// Middleware to inject io
const setupCategoryRoutes = (io) => {
  const router = express.Router();

  router.get("/", getCategories);

  router.post("/", (req, res) => {
    createCategory(req, res, io);
  });

  return router;
};

module.exports = setupCategoryRoutes;
