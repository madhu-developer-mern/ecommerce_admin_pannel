const mongoose = require("mongoose");
const { isValidCategory, normalizeCategory } = require("./productController");

const DEFAULT_CATEGORIES = ["mobiles", "shirts", "shoes", "watches", "laptops", "headphones", "tablets", "accessories"];

// Get all categories
const getCategories = async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
    const dbCategories = collections
      .map((item) => item.name)
      .filter((name) => !name.startsWith("system."))
      .filter((name) => name !== "orders")
      .filter((name) => isValidCategory(name));

    const categories = [...new Set([...DEFAULT_CATEGORIES, ...dbCategories])].sort((a, b) => a.localeCompare(b));
    return res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};

// Create new category
const createCategory = async (req, res, io) => {
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

    return res.status(409).json({ message: "Category already exists", category });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create category", error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory
};
