const express = require("express");
const {
  getProductsByCategory,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage
} = require("../controllers/productController");

// Middleware to inject io
const setupProductRoutes = (io, upload) => {
  const router = express.Router();

  router.get("/:category", getProductsByCategory);

  router.post("/upload-image", upload.single("image"), (req, res) => {
    uploadImage(req, res);
  });

  router.post("/", upload.single("image"), (req, res) => {
    addProduct(req, res, io);
  });

  router.put("/:category/:id", upload.single("image"), (req, res) => {
    updateProduct(req, res, io);
  });

  router.delete("/:category/:id", (req, res) => {
    deleteProduct(req, res, io);
  });

  return router;
};

module.exports = setupProductRoutes;
