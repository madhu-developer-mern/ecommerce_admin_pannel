const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const DB_NAME = process.env.DB_NAME || "ecommerce_admin";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  description: String,
  category: String,
  imageUrl: String,
  imagePublicId: String,
  stock: Number,
  rating: Number,
  sold: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date
});

const SAMPLE_PRODUCTS = {
  mobiles: [
    {
      name: "iPhone 15 Pro",
      price: 129999,
      originalPrice: 139999,
      description: "Latest Apple flagship with A17 Pro chip, advanced camera system, and titanium design",
      stock: 25,
      rating: 4.8,
      sold: 342,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&h=500&fit=crop"
    },
    {
      name: "Samsung Galaxy S24",
      price: 79999,
      originalPrice: 89999,
      description: "Powerful Android phone with 200MP camera, AMOLED display, and 5G connectivity",
      stock: 30,
      rating: 4.6,
      sold: 256,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop"
    },
    {
      name: "Google Pixel 8",
      price: 59999,
      originalPrice: 69999,
      description: "AI-powered camera, pure Android experience, and exceptional computational photography",
      stock: 18,
      rating: 4.7,
      sold: 189,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1601524603052-857cf19cd6f4?w=500&h=500&fit=crop"
    }
  ],
  laptops: [
    {
      name: "MacBook Pro 16\"",
      price: 249999,
      originalPrice: 259999,
      description: "Powerful laptop with M3 Max chip, Retina display, and all-day battery",
      stock: 12,
      rating: 4.9,
      sold: 145,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"
    },
    {
      name: "Dell XPS 15",
      price: 169999,
      originalPrice: 179999,
      description: "Premium Windows laptop with Intel i9, RTX 4090, and InfinityEdge display",
      stock: 15,
      rating: 4.7,
      sold: 112,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1588872657840-218e412ee5ff?w=500&h=500&fit=crop"
    },
    {
      name: "Lenovo ThinkPad X1",
      price: 129999,
      originalPrice: 139999,
      description: "Business ultrabook with 14-hour battery, lightweight design, and premium build",
      stock: 20,
      rating: 4.6,
      sold: 98,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop"
    }
  ],
  headphones: [
    {
      name: "Sony WH-1000XM5",
      price: 24999,
      originalPrice: 29999,
      description: "Industry-leading noise cancellation, 40-hour battery, premium sound quality",
      stock: 45,
      rating: 4.8,
      sold: 567,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
    },
    {
      name: "Apple AirPods Max",
      price: 54999,
      originalPrice: 59999,
      description: "Spatial audio, active noise cancellation, seamless Apple integration",
      stock: 22,
      rating: 4.7,
      sold: 234,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop"
    },
    {
      name: "Bose QuietComfort 45",
      price: 29999,
      originalPrice: 34999,
      description: "Legendary comfort, excellent noise cancellation, premium audio experience",
      stock: 35,
      rating: 4.6,
      sold: 421,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop"
    }
  ],
  tablets: [
    {
      name: "iPad Pro 12.9\"",
      price: 119999,
      originalPrice: 129999,
      description: "Powerful tablet with M2 chip, Liquid Retina XDR display, ideal for creators",
      stock: 18,
      rating: 4.8,
      sold: 156,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1526045612519-e21cc028cb29?w=500&h=500&fit=crop"
    },
    {
      name: "Samsung Galaxy Tab S9",
      price: 69999,
      originalPrice: 79999,
      description: "6.3mm thin, 120Hz AMOLED display, Snapdragon 8 Gen 2 processor",
      stock: 25,
      rating: 4.6,
      sold: 198,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=500&fit=crop"
    }
  ],
  shirts: [
    {
      name: "Premium Cotton T-Shirt",
      price: 1299,
      originalPrice: 1699,
      description: "100% cotton, comfortable fit, available in multiple colors",
      stock: 150,
      rating: 4.5,
      sold: 1250,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop"
    },
    {
      name: "Designer Casual Shirt",
      price: 2999,
      originalPrice: 3999,
      description: "Premium fabric, modern design, perfect for casual outings",
      stock: 80,
      rating: 4.7,
      sold: 456,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1596777684687-eac26f61a659?w=500&h=500&fit=crop"
    }
  ],
  shoes: [
    {
      name: "Nike Air Max 90",
      price: 8999,
      originalPrice: 10999,
      description: "Classic silhouette, comfortable cushioning, iconic style",
      stock: 60,
      rating: 4.6,
      sold: 892,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop"
    },
    {
      name: "Adidas Ultraboost",
      price: 12999,
      originalPrice: 15999,
      description: "Revolutionary comfort, responsive boost technology, sleek design",
      stock: 45,
      rating: 4.7,
      sold: 634,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop"
    }
  ],
  watches: [
    {
      name: "Apple Watch Series 9",
      price: 39999,
      originalPrice: 49999,
      description: "Advanced health tracking, always-on Retina display, cellular connectivity",
      stock: 35,
      rating: 4.8,
      sold: 523,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"
    },
    {
      name: "Samsung Galaxy Watch 6",
      price: 24999,
      originalPrice: 29999,
      description: "Sleek design, comprehensive health features, rotating bezel control",
      stock: 42,
      rating: 4.6,
      sold: 398,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"
    }
  ],
  accessories: [
    {
      name: "USB-C Cable 2m",
      price: 499,
      originalPrice: 799,
      description: "High-speed data transfer, durable design, universal compatibility",
      stock: 200,
      rating: 4.4,
      sold: 2341,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
    },
    {
      name: "Phone Stand",
      price: 899,
      originalPrice: 1299,
      description: "Adjustable, stable, compatible with all smartphones",
      stock: 120,
      rating: 4.5,
      sold: 892,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
    }
  ]
};

async function seedDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    console.log("🌱 Starting database seeding...");
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: DB_NAME
    });

    for (const [category, products] of Object.entries(SAMPLE_PRODUCTS)) {
      const modelName = `Product_${category.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      
      // Drop existing collection
      try {
        await mongoose.connection.db.dropCollection(category);
        console.log(`✓ Dropped collection: ${category}`);
      } catch (e) {
        // Collection might not exist
      }

      const ProductModel = mongoose.model(
        modelName,
        productSchema,
        category
      );

      const seedProducts = products.map(product => ({
        ...product,
        category,
        imagePublicId: `seed/${category}/${product.name.replace(/\s+/g, "-")}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await ProductModel.insertMany(seedProducts);
      console.log(`✓ Seeded ${products.length} products in category: ${category}`);
    }

    console.log("✅ Database seeding completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
