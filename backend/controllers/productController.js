const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");

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

  const productSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      originalPrice: { type: Number, default: 0 },
      description: { type: String, default: "", trim: true },
      category: { type: String, required: true, trim: true, lowercase: true },
      imageUrl: { type: String, required: true },
      imagePublicId: { type: String, required: true },
      stock: { type: Number, default: 0, min: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      discount: { type: Number, default: 0, min: 0 },
      sizes: { type: [String], default: [] },
      imageName: { type: String, default: "" },
      sold: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ["active", "inactive", "discontinued"],
        default: "active"
      }
    },
    { timestamps: true }
  );

  return mongoose.model(modelName, productSchema, category);
}

// Get all products for a category
const getProductsByCategory = async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    console.log(`[getProductsByCategory] Fetching products for category: "${req.params.category}" → Normalized: "${category}"`);

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const ProductModel = getProductModel(category);
    const products = await ProductModel.find().sort({ createdAt: -1 });
    console.log(`[getProductsByCategory] Found ${products.length} products in category "${category}"`);
    return res.status(200).json({ products });
  } catch (error) {
    console.error(`[getProductsByCategory] Error fetching from "${req.params.category}"`, error.message);
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

// Add new product
const addProduct = async (req, res, io) => {
  try {
    const { name, price, originalPrice, description, stock, rating, imageName } = req.body;
    const category = normalizeCategory(req.body?.category);

    console.log(`[addProduct] Received category: "${req.body?.category}" → Normalized: "${category}"`);

    if (!name || !category) {
      return res.status(400).json({ message: "name and category are required" });
    }

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const isHome = category === "home";

    // Only validate price for non-home categories
    if (!isHome) {
      if (!price) {
        return res.status(400).json({ message: "price is required for non-home products" });
      }
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }
    }

    const ProductModel = getProductModel(category);

    let imageUrl;
    let imagePublicId;

    // Support two flows:
    // 1) Client uploaded image separately and provides imageUrl + imagePublicId in body
    // 2) Client sent image file in multipart/form-data (req.file)
    if (req.body.imageUrl && req.body.imagePublicId) {
      imageUrl = req.body.imageUrl;
      imagePublicId = req.body.imagePublicId;
    } else {
      if (!req.file) {
        return res.status(400).json({ message: "image is required" });
      }

      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }

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

    const created = await ProductModel.create({
      name,
      price: isHome ? 0 : Number(price),
      originalPrice: isHome ? 0 : (Number(originalPrice) || 0),
      discount: Number(req.body.discount) || 0,
      sizes: req.body.sizes ? String(req.body.sizes).split(",").map(s => s.trim()).filter(Boolean) : [],
      imageName: req.body.imageName || "",
      description: description || "",
      category,
      imageUrl,
      imagePublicId,
      stock: isHome ? 0 : (Number(stock) || 0),
      rating: isHome ? 0 : (Number(rating) || 0)
    });

    console.log(`[addProduct] Created product "${created.name}" in category "${category}" with ID: ${created._id}`);

    io.emit("product_added", { product: created, category });
    return res.status(201).json({
      message: "Product added successfully!",
      product: created
    });
  } catch (error) {
    console.error(`[addProduct] Error creating product in category "${req.body?.category}"`, error.message);
    return res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

// Update product
const updateProduct = async (req, res, io) => {
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

    // If client provided new imageUrl/publicId (pre-uploaded), replace and remove old image
    if (req.body.imageUrl && req.body.imagePublicId) {
      if (existing.imagePublicId && existing.imagePublicId !== req.body.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existing.imagePublicId);
        } catch (e) {
          // ignore destroy errors
        }
      }
      imageUrl = req.body.imageUrl;
      imagePublicId = req.body.imagePublicId;
    } else if (req.file) {
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
        discount: req.body.discount !== undefined ? Number(req.body.discount) : existing.discount,
        sizes: req.body.sizes ? String(req.body.sizes).split(",").map(s => s.trim()).filter(Boolean) : existing.sizes,
        imageName: req.body.imageName || existing.imageName,
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
    return res.status(200).json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res, io) => {
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
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

// Upload image directly
const uploadImage = async (req, res) => {
  try {
    const category = normalizeCategory(req.body?.category);
    console.log(`[uploadImage] Uploading image for category: "${req.body?.category}" → Normalized: "${category}"`);

    if (!req.file) {
      return res.status(400).json({ message: "image is required" });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    const safeName = req.file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: `ecommerce-admin/${category}`,
        public_id: `${Date.now()}-${safeName}`
      }
    );

    console.log(`[uploadImage] Successfully uploaded to Cloudinary: ${uploadResult.public_id}`);

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id
    });
  } catch (error) {
    console.error(`[uploadImage] Error uploading image for "${req.body?.category}"`, error.message);
    return res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
};

module.exports = {
  getProductsByCategory,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getProductModel,
  normalizeCategory,
  isValidCategory
};
