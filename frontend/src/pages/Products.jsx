import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, Search, X } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function Products({ socket }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState("");
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkOriginalPrice, setBulkOriginalPrice] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    description: "",
    stock: "",
    rating: "",
    image: null
  });

  const getFileNameWithoutExtension = (fileName = "") => {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex <= 0) return fileName;
    return fileName.slice(0, dotIndex);
  };

  const isHomeCategory = (category) => String(category || "").trim().toLowerCase() === "home";

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        setCategories(response.data.categories || []);
        if (response.data.categories?.length > 0) {
          setActiveCategory(response.data.categories[0]);
          setFormCategory(response.data.categories[0]);
        }
      } catch (error) {
        setMessage("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch products for active category
  useEffect(() => {
    if (activeCategory) {
      fetchProducts();
    }
  }, [activeCategory]);

  // Filter products by search
  useEffect(() => {
    setFilteredProducts(
      products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, products]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on("product_added", (data) => {
      if (data.category === activeCategory) {
        setProducts(prev => [data.product, ...prev]);
      }
    });

    socket.on("product_updated", (data) => {
      if (data.category === activeCategory) {
        setProducts(prev =>
          prev.map(p => p._id === data.product._id ? data.product : p)
        );
      }
    });

    socket.on("product_deleted", (data) => {
      if (data.category === activeCategory) {
        setProducts(prev => prev.filter(p => p._id !== data.productId));
      }
    });

    return () => {
      socket.off("product_added");
      socket.off("product_updated");
      socket.off("product_deleted");
    };
  }, [socket, activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/products/${activeCategory}`
      );
      setProducts(response.data.products || []);
      setMessage("");
    } catch (error) {
      setMessage("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Only image files are allowed");
      return;
    }

    const fileNameWithoutExtension = getFileNameWithoutExtension(file.name);

    setImageUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);
      formDataUpload.append("category", formCategory || activeCategory);

      const response = await axios.post(
        `${API_BASE_URL}/api/products/upload-image`,
        formDataUpload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setUploadedImageUrl(response.data.imageUrl);
      setUploadedImagePublicId(response.data.imagePublicId || "");
      // Automatically set imageName from filename and clear file reference in formData
      setFormData({ ...formData, image: null, name: fileNameWithoutExtension });
      setMessage("Image uploaded successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const createProductsFromUploadedFiles = async (
    uploadedFiles,
    uploadCategory,
    { price = "", originalPrice = "", stock = "" } = {}
  ) => {
    const isHomeBulk = isHomeCategory(uploadCategory);
    let successCount = 0;
    let failedCount = 0;

    for (const fileData of uploadedFiles) {
      try {
        // If image was pre-uploaded, send JSON with imageUrl/imagePublicId to avoid re-upload
        if (fileData.imageUrl && fileData.imagePublicId) {
          const payloadObj = {
            name: fileData.name,
            price: isHomeBulk ? 0 : price,
            originalPrice: isHomeBulk ? 0 : (originalPrice || price),
            discount: 0,
            sizes: "",
            description: "",
            stock: isHomeBulk ? 0 : stock,
            rating: 0,
            category: uploadCategory,
            imageUrl: fileData.imageUrl,
            imagePublicId: fileData.imagePublicId,
            imageName: fileData.name
          };

          await axios.post(`${API_BASE_URL}/api/products`, payloadObj);
        } else {
          const payload = new FormData();
          payload.append("name", fileData.name);
          payload.append("price", isHomeBulk ? 0 : price);
          payload.append("originalPrice", isHomeBulk ? 0 : (originalPrice || price));
          payload.append("discount", 0);
          payload.append("sizes", "");
          payload.append("description", "");
          payload.append("stock", isHomeBulk ? 0 : stock);
          payload.append("rating", "0");
          payload.append("category", uploadCategory);
          payload.append("image", fileData.file);

          await axios.post(`${API_BASE_URL}/api/products`, payload, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }

        successCount++;
      } catch (err) {
        failedCount++;
        console.error(`Failed to create product ${fileData.name}:`, err.response?.data || err.message || err);
      }
    }

    return { successCount, failedCount };
  };

  const handleBulkImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadCategory = (formCategory || activeCategory || "home").toLowerCase();
    const isHomeBulk = isHomeCategory(uploadCategory);

    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        setMessage(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    setImageUploading(true);
    try {
      if (isHomeBulk) {
        setMessage("Uploading images and creating products...");
      }

      const uploadedFiles = [];

      for (const file of validFiles) {
        const fileNameWithoutExtension = getFileNameWithoutExtension(file.name);
        
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        formDataUpload.append("category", uploadCategory);

        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/products/upload-image`,
            formDataUpload,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          uploadedFiles.push({
            file: file,
            imageUrl: response.data.imageUrl,
            imagePublicId: response.data.imagePublicId || "",
            name: fileNameWithoutExtension
          });
        } catch (err) {
          const serverMsg = err.response?.data?.message || err.message || `Failed to upload ${file.name}`;
          setMessage(serverMsg);
          console.error(`Bulk image upload error for ${file.name}:`, err.response?.data || err.message || err);
        }
      }

      if (uploadedFiles.length === 0) {
        setMessage("No valid images were uploaded");
        return;
      }

      if (isHomeBulk) {
        const { successCount, failedCount } = await createProductsFromUploadedFiles(uploadedFiles, uploadCategory, {
          price: 0,
          originalPrice: 0,
          stock: 0
        });

        if (successCount > 0) {
          setMessage(
            `Bulk upload completed successfully: ${successCount} product(s) created${failedCount > 0 ? ` (${failedCount} failed)` : ""}`
          );
        } else {
          setMessage("Bulk upload failed: no products were created");
        }

        setBulkFiles([]);
        setBulkPrice("");
        setBulkStock("");
        setBulkOriginalPrice("");
        setShowBulkUpload(false);
        setFormCategory("");

        if (activeCategory === uploadCategory) {
          fetchProducts();
        } else {
          setActiveCategory(uploadCategory);
        }
      } else {
        setBulkFiles(uploadedFiles);
        setMessage(`${uploadedFiles.length} image(s) uploaded successfully!`);
      }
    } finally {
      setImageUploading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkFiles.length === 0) {
      setMessage("Please upload images first");
      return;
    }

    const uploadCategory = formCategory || activeCategory || "home";
    const isHomeBulk = isHomeCategory(uploadCategory);

    if (!isHomeBulk && (!bulkPrice || !bulkStock)) {
      setMessage("Please fill in price and stock for bulk upload");
      return;
    }

    setImageUploading(true);
    try {
      const { successCount, failedCount } = await createProductsFromUploadedFiles(bulkFiles, uploadCategory, {
        price: bulkPrice,
        originalPrice: bulkOriginalPrice,
        stock: bulkStock
      });

      if (successCount > 0) {
        setMessage(
          `Bulk upload completed successfully: ${successCount} product(s) created${failedCount > 0 ? ` (${failedCount} failed)` : ""}`
        );
      } else {
        setMessage("Bulk upload failed: no products were created");
      }

      setBulkFiles([]);
      setBulkPrice("");
      setBulkStock("");
      setBulkOriginalPrice("");
      setShowBulkUpload(false);
      setFormCategory("");

      // Switch to uploaded category to show uploaded products
      setActiveCategory(uploadCategory);

      fetchProducts();
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || "Error creating products";
      setMessage(serverMsg);
      console.error("Bulk submit error:", error.response?.data || error.message || error);
    } finally {
      setImageUploading(false);
    }
  };

  const removeBulkFile = (index) => {
    setBulkFiles(bulkFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const useCategory = formCategory || activeCategory;

      // If image was already uploaded via /upload-image, send JSON payload with imageUrl/publicId
      if (uploadedImageUrl) {
        const payloadObj = {
          name: formData.name,
          price: formData.price || 0,
          originalPrice: formData.originalPrice || 0,
          discount: formData.discount || 0,
          sizes: sizesInput || "",
          description: formData.description,
          stock: formData.stock,
          rating: formData.rating,
          category: useCategory,
          imageUrl: uploadedImageUrl,
          imagePublicId: uploadedImagePublicId,
          imageName: formData.name || ""
        };

        if (editingId) {
          await axios.put(`${API_BASE_URL}/api/products/${useCategory}/${editingId}`, payloadObj);
          setMessage("Product updated successfully!");
          resetForm();
        } else {
          await axios.post(`${API_BASE_URL}/api/products`, payloadObj);
          setMessage("Product added successfully!");
          setFormData({ name: "", price: "", originalPrice: "", discount: "", description: "", stock: "", rating: "", image: null });
          setSizesInput("");
          setEditingId(null);
        }

        // clear uploaded image helper state
        setUploadedImageUrl("");
        setUploadedImagePublicId("");
      } else {
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("price", formData.price || 0);
        payload.append("originalPrice", formData.originalPrice || 0);
        payload.append("discount", formData.discount || 0);
        payload.append("sizes", sizesInput || "");
        payload.append("description", formData.description);
        payload.append("stock", formData.stock);
        payload.append("rating", formData.rating);
        payload.append("category", useCategory);
        if (formData.image) {
          payload.append("image", formData.image);
        }

        if (editingId) {
          await axios.put(`${API_BASE_URL}/api/products/${useCategory}/${editingId}`, payload);
          setMessage("Product updated successfully!");
          resetForm();
        } else {
          await axios.post(`${API_BASE_URL}/api/products`, payload);
          setMessage("Product added successfully!");
          setFormData({ name: "", price: "", originalPrice: "", discount: "", description: "", stock: "", rating: "", image: null });
          setSizesInput("");
          setEditingId(null);
        }
      }

      fetchProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error saving product");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const normalized = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    if (categories.includes(normalized)) {
      setMessage(`Category '${normalized}' already exists`);
      return;
    }
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/categories`, { name: newCategoryName });
      const created = resp.data.category || normalized;
      setCategories(prev => Array.from(new Set([created, ...prev])));
      setActiveCategory(created);
      setFormCategory(created);
      setNewCategoryName("");
      setShowAddCategory(false);
      setMessage(`Category '${created}' created`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/products/${activeCategory}/${productId}`
      );
      setMessage("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      setMessage("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      originalPrice: "",
      discount: "",
      description: "",
      stock: "",
      rating: "",
      image: null
    });
    setSizesInput("");
    setEditingId(null);
    setUploadedImageUrl("");
    setUploadedImagePublicId("");
    setImageUploading(false);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      description: product.description,
      stock: product.stock,
      rating: product.rating,
      image: null
    });
    setSizesInput(product.sizes ? product.sizes.join(",") : "");
    setEditingId(product._id);
    setShowForm(true);
  };

  const selectedBulkCategory = formCategory || activeCategory || "home";
  const isHomeBulkCategory = isHomeCategory(selectedBulkCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <Plus size={20} />
            Add Product
          </button>
          <button
            onClick={() => {
              setShowBulkUpload(!showBulkUpload);
              if (!showBulkUpload) {
                setFormCategory(activeCategory || "home");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <Plus size={20} />
            Bulk Upload (Home)
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            {editingId ? "Edit Product" : "Add New Product"}
          </h3>

          {/* Category Selection */}
          <div className="mb-6 space-y-3">
            <select
              value={formCategory || activeCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="px-3 py-2 bg-gray-100 rounded text-sm">Add Category</button>
              {showAddCategory && (
                <div className="flex gap-2">
                  <input value={newCategoryName} onChange={(e)=>setNewCategoryName(e.target.value)} placeholder="Category name" className="px-3 py-2 border rounded text-sm" />
                  <button type="button" onClick={handleCreateCategory} className="px-3 py-2 bg-blue-500 text-white rounded text-sm">Create</button>
                </div>
              )}
            </div>
          </div>

          {/* HOME Category Form - Simple version */}
          {(formCategory || activeCategory) === "home" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                    id="home-image-input"
                  />
                  <label htmlFor="home-image-input" className="cursor-pointer">
                    <div className="text-gray-600">
                      <p className="font-medium mb-1">Click to select image</p>
                      <p className="text-xs text-gray-500">Image name will auto-populate</p>
                    </div>
                  </label>
                  {imageUploading && <p className="text-sm text-blue-600 mt-2">Uploading image...</p>}
                </div>
              </div>

              {/* Image Preview */}
              {uploadedImageUrl && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img src={uploadedImageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Image: {formData.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Successfully uploaded</p>
                  </div>
                </div>
              )}

              {/* Image Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Name</label>
                <input
                  type="text"
                  placeholder="Auto-filled from filename"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Enter image description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  {editingId ? "Update" : "Upload"} Image
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* OTHER Categories Form - Full version */
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="number"
                placeholder="Original Price"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Discount (percent)"
                value={formData.discount || ""}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Sizes (comma separated)"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Rating (0-5)"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                />
                {imageUploading && <p className="text-sm text-blue-600 mt-2">Uploading image...</p>}
                {uploadedImageUrl && (
                  <div className="mt-3">
                    <img src={uploadedImageUrl} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {editingId ? "Update" : "Add"} Product
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bulk Upload Form */}
      {showBulkUpload && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Bulk Image Upload</h3>
          <div className="space-y-4">
            <select
              value={formCategory || "home"}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <p className="text-sm text-gray-600">
              {isHomeBulkCategory
                ? "Home category: products are auto-created from image filenames after you select files."
                : "Note: Products will appear in the selected category"}
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBulkImageUpload}
                disabled={imageUploading}
                className="hidden"
                id="bulk-file-input"
              />
              <label htmlFor="bulk-file-input" className="cursor-pointer">
                <div className="text-gray-600">
                  <p className="font-medium mb-2">Click to select images or drag and drop</p>
                  <p className="text-sm text-gray-500">Select multiple images at once</p>
                </div>
              </label>
              {imageUploading && (
                <p className="text-sm text-blue-600 mt-4">
                  {isHomeBulkCategory ? "Uploading and creating products..." : "Uploading images..."}
                </p>
              )}
            </div>

            {bulkFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Uploaded Images ({bulkFiles.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bulkFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img src={file.imageUrl} alt={file.name} className="w-full h-24 object-cover rounded-lg" />
                      <p className="text-xs mt-1 truncate font-medium">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeBulkFile(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkFiles.length > 0 && !isHomeBulkCategory && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <input
                  type="number"
                  placeholder="Price (for all)"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Original Price (for all)"
                  value={bulkOriginalPrice}
                  onChange={(e) => setBulkOriginalPrice(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Stock (for all)"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {bulkFiles.length > 0 && !isHomeBulkCategory && (
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={imageUploading || (!isHomeBulkCategory && (!bulkPrice || !bulkStock))}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-300"
                >
                  {imageUploading ? "Creating..." : `Create ${bulkFiles.length} Products`}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkFiles([]);
                  setBulkPrice("");
                  setBulkStock("");
                  setBulkOriginalPrice("");
                  setFormCategory("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No products found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="h-40 bg-gray-200 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
                    {product.originalPrice > product.price && (
                      <p className="text-sm line-through text-gray-500">₹{product.originalPrice}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {product.rating || 0} ⭐
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <span>Stock: {product.stock}</span>
                  <span>Sold: {product.sold || 0}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
