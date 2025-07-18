// server.js - Week 2 Express.js RESTful API Assignment

const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Sample in-memory database
let products = [
  { id: '1', name: 'Laptop', description: '16GB RAM', price: 1200, category: 'electronics', inStock: true },
  { id: '2', name: 'Smartphone', description: '128GB storage', price: 800, category: 'electronics', inStock: true },
  { id: '3', name: 'Coffee Maker', description: 'Programmable', price: 50, category: 'kitchen', inStock: false }
];

// Middleware: JSON parsing
app.use(bodyParser.json());

// Middleware: Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware: Authentication
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
});

// Middleware: Validation for product creation and update
function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || price == null || !category || inStock == null) {
    return res.status(400).json({ error: 'Validation error: Missing required fields' });
  }
  next();
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see products.');
});

// GET all products with filtering, pagination, and search
app.get('/api/products', (req, res) => {
  let result = [...products];
  const { category, search, page = 1, limit = 10 } = req.query;

  if (category) {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = result.slice(start, end);

  res.json({
    total: result.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginated
  });
});

// GET product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST create new product
app.post('/api/products', validateProduct, (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  const newProduct = { id: uuidv4(), name, description, price, category, inStock };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update existing product
app.put('/api/products/:id', validateProduct, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const { name, description, price, category, inStock } = req.body;
  product.name = name;
  product.description = description;
  product.price = price;
  product.category = category;
  product.inStock = inStock;
  res.json(product);
});

// DELETE a product
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted', product: deleted[0] });
});

// GET product statistics (count by category)
app.get('/api/products/stats/categories', (req, res) => {
  const stats = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  res.json(stats);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
