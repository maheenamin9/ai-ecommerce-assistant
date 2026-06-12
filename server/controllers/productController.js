import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const seedProducts = async (req, res) => {
  try {
    const sampleProducts = [
      { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior sound quality.', price: 299.99, category: 'Electronics', brand: 'SoundPro', stock: 50, rating: 4.5, numReviews: 128, tags: ['headphones', 'wireless', 'noise-cancelling', 'audio'] },
      { name: 'Smart Fitness Watch', description: 'Track your health with heart rate monitoring, GPS, sleep tracking, and 7-day battery life.', price: 199.99, category: 'Electronics', brand: 'FitTech', stock: 75, rating: 4.3, numReviews: 89, tags: ['smartwatch', 'fitness', 'health', 'wearable'] },
      { name: 'Ergonomic Office Chair', description: 'Fully adjustable ergonomic chair with lumbar support, breathable mesh back, and 5-year warranty.', price: 449.99, category: 'Furniture', brand: 'ErgoComfort', stock: 30, rating: 4.7, numReviews: 204, tags: ['chair', 'office', 'ergonomic', 'furniture'] },
      { name: 'Ultra-Thin Laptop Stand', description: 'Aluminum laptop stand with 6 adjustable height settings, compatible with all laptops 10-17 inches.', price: 49.99, category: 'Accessories', brand: 'DeskMate', stock: 120, rating: 4.6, numReviews: 67, tags: ['laptop', 'stand', 'desk', 'accessories'] },
      { name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX switches, anti-ghosting, and macro keys.', price: 129.99, category: 'Electronics', brand: 'GameForce', stock: 60, rating: 4.4, numReviews: 156, tags: ['keyboard', 'gaming', 'mechanical', 'rgb'] },
      { name: 'Portable Bluetooth Speaker', description: 'Waterproof portable speaker with 360° surround sound, 24-hour playtime, and built-in microphone.', price: 89.99, category: 'Electronics', brand: 'SoundPro', stock: 90, rating: 4.5, numReviews: 312, tags: ['speaker', 'bluetooth', 'portable', 'waterproof'] },
      { name: 'Standing Desk Converter', description: 'Convert any desk into a standing desk. Supports dual monitors and has a smooth gas-spring lift.', price: 249.99, category: 'Furniture', brand: 'ErgoComfort', stock: 25, rating: 4.2, numReviews: 44, tags: ['desk', 'standing', 'ergonomic', 'office'] },
      { name: '4K Webcam', description: 'Professional 4K webcam with auto-focus, built-in ring light, and noise-cancelling microphone.', price: 149.99, category: 'Electronics', brand: 'VisionTech', stock: 45, rating: 4.6, numReviews: 93, tags: ['webcam', '4k', 'camera', 'streaming'] },
    ];

    await Product.deleteMany({});
    const products = await Product.insertMany(sampleProducts);
    res.json({ message: `Seeded ${products.length} products`, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
