const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./Models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studentmart";

const SAMPLE_PRODUCTS = [
    {
        name: "Wireless Bluetooth Headphones",
        description: "Comfortable over-ear wireless headphones with 30-hour battery life and noise isolation for study sessions.",
        price: 1299,
        category: "Electronics",
        stock: 18,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
    },
    {
        name: "College Laptop Backpack",
        description: "Water-resistant 15.6-inch laptop backpack with USB charging port and multi-compartment storage.",
        price: 899,
        category: "Accessories",
        stock: 22,
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"
    },
    {
        name: "Insulated Steel Water Bottle",
        description: "750ml double-wall stainless steel flask that keeps beverages cold for 24 hours or hot for 12 hours.",
        price: 499,
        category: "Accessories",
        stock: 35,
        imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80"
    },
    {
        name: "Spiral Ruled Notebook Pack (Set of 4)",
        description: "A4 size 200-page smooth 80 GSM ruled spiral notebooks ideal for lecture notes and lab records.",
        price: 299,
        category: "Stationery",
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80"
    },
    {
        name: "Data Structures & Algorithms Guide",
        description: "Comprehensive university reference covering trees, graphs, dynamic programming, and interview prep.",
        price: 599,
        category: "Books",
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80"
    },
    {
        name: "LED Study Desk Lamp",
        description: "Foldable rechargeable LED desk lamp with 3 brightness modes and eye-care warm light.",
        price: 649,
        category: "Electronics",
        stock: 14,
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80"
    },
    {
        name: "Campus Varsity Hoodie",
        description: "Soft cotton-fleece unisex hoodie with relaxed fit for chilly morning lectures and hostel nights.",
        price: 999,
        category: "Clothing",
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80"
    },
    {
        name: "Ergonomic Wireless Mouse",
        description: "Silent-click 2.4GHz wireless optical mouse with adjustable DPI for coding and CAD work.",
        price: 549,
        category: "Electronics",
        stock: 28,
        imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80"
    },
    {
        name: "Engineering Geometry & Drafting Kit",
        description: "Precision compass, divider, protractor, and scale set inside a protective hard case.",
        price: 349,
        category: "Stationery",
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&q=80"
    },
    {
        name: "Classic Cotton Campus T-Shirt",
        description: "Breathable 100% combed cotton crew-neck tee for everyday campus wear.",
        price: 399,
        category: "Clothing",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(MONGO_URI);
        let inserted = 0;
        let skipped = 0;

        for (const item of SAMPLE_PRODUCTS) {
            const exists = await Product.findOne({ name: item.name });
            if (exists) {
                skipped++;
            } else {
                await Product.create(item);
                inserted++;
            }
        }

        const total = await Product.countDocuments();
        console.log(`Seed complete: ${inserted} added, ${skipped} already existed. Total products: ${total}`);
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed products:", error);
        process.exit(1);
    }
}

seedProducts();
