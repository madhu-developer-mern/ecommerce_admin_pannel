import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config/api";

function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [productsByCategory, setProductsByCategory] = useState({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image: null
  });

  async function fetchCategories(preferredCategory = "") {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      const nextCategories = Array.isArray(response.data?.categories) ? response.data.categories : [];

      setCategories(nextCategories);
      setProductsByCategory((prev) => {
        const merged = { ...prev };
        nextCategories.forEach((cat) => {
          if (!merged[cat]) merged[cat] = [];
        });
        return merged;
      });

      const fallback = nextCategories[0] || "";
      const resolved =
        (preferredCategory && nextCategories.includes(preferredCategory) && preferredCategory) ||
        (activeCategory && nextCategories.includes(activeCategory) && activeCategory) ||
        fallback;

      if (resolved && resolved !== activeCategory) {
        setActiveCategory(resolved);
      }

      setFormData((prev) => ({
        ...prev,
        category: resolved || prev.category
      }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load categories.");
    }
  }

  async function fetchProducts(category) {
    if (!category) return;

    setIsLoadingProducts(true);
    setMessage("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${category}`);
      setProductsByCategory((prev) => ({
        ...prev,
        [category]: response.data.products || []
      }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeCategory) {
      fetchProducts(activeCategory);
    }
  }, [activeCategory]);

  const currentProducts = useMemo(
    () => productsByCategory[activeCategory] || [],
    [productsByCategory, activeCategory]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formData.category) {
      setMessage("Please select a category.");
      return;
    }
    if (!formData.image) {
      setMessage("Please select an image.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("price", formData.price);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      payload.append("image", formData.image);

      await axios.post(`${API_BASE_URL}/api/products`, payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage("Product uploaded successfully.");
      setFormData((prev) => ({
        ...prev,
        name: "",
        price: "",
        description: "",
        image: null
      }));
      await fetchProducts(formData.category);
      setActiveCategory(formData.category);
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setMessage("Enter a category name.");
      return;
    }

    setIsAddingCategory(true);
    setMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/categories`, { name: trimmed });
      const createdCategory = response.data?.category;

      setMessage(response.data?.message || "Category added.");
      setNewCategoryName("");
      setShowAddCategory(false);

      await fetchCategories(createdCategory);
      if (createdCategory) {
        setActiveCategory(createdCategory);
        await fetchProducts(createdCategory);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add category.");
    } finally {
      setIsAddingCategory(false);
    }
  }

  async function handleDelete(productId) {
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${activeCategory}/${productId}`);
      setMessage("Product deleted successfully.");
      await fetchProducts(activeCategory);
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-600">Category collections in MongoDB + Cloudinary</p>

          <div className="mt-4 space-y-2">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              const count = productsByCategory[category]?.length ?? 0;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setFormData((prev) => ({ ...prev, category }));
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left capitalize transition ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-900 hover:bg-brand-100"
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowAddCategory((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Collection</span>
            </button>

            {showAddCategory && (
              <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  placeholder="fridges"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isAddingCategory}
                  className="w-full rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingCategory ? "Adding..." : "Create Collection"}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add Product</h2>

            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />

            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              required
            />

            <textarea
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              rows="3"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-brand-500"
              value={formData.category}
              onChange={(e) => {
                const next = e.target.value;
                setFormData((prev) => ({ ...prev, category: next }));
                setActiveCategory(next);
              }}
              required
            >
              {categories.map((category) => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>

            <input
              className="w-full rounded-xl border border-slate-300 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-900"
              type="file"
              accept="image/*"
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Uploading..." : "Upload Product"}
            </button>
          </form>
        </aside>

        <main className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold capitalize text-slate-900">
                {activeCategory ? `${activeCategory} Collection` : "Collection"}
              </h2>
              <p className="text-sm text-slate-500">
                MongoDB collection: {activeCategory || "No category selected"}
              </p>
            </div>
            {message && (
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">
                {message}
              </span>
            )}
          </div>

          {isLoadingProducts ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading products...</p>
          ) : !activeCategory ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Add your first category collection using the plus button.
            </p>
          ) : currentProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No products yet for <span className="capitalize">{activeCategory}</span>.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {currentProducts.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <img src={product.imageUrl} alt={product.name} className="h-44 w-full object-cover" />
                  <div className="space-y-2 p-4">
                    <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
                    <p className="text-sm font-medium text-brand-700">
                      Rs. {Number(product.price).toLocaleString()}
                    </p>
                    <p className="max-h-10 overflow-hidden text-sm text-slate-600">
                      {product.description || "No description"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
