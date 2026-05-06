import { Router } from 'express';
import pool from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateCreateProduct, validateUpdateProduct } from '../middleware/validate.js';

const router = Router();

// ============================================
// GET /api/products
// Public-ish (requires auth but all roles can access)
// Supports: ?search=, ?category=, ?sort=price-low|price-high|rating
// ============================================
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Category filter
    if (category && category !== 'All') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Sort
    switch (sort) {
      case 'price-low':
        query += ' ORDER BY price ASC';
        break;
      case 'price-high':
        query += ' ORDER BY price DESC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC';
        break;
      default:
        query += ' ORDER BY id ASC';
    }

    const result = await pool.query(query, params);

    // Transform snake_case to camelCase for frontend compatibility
    const products = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      category: p.category,
      emoji: p.emoji,
      rating: parseFloat(p.rating),
      reviews: p.reviews,
      description: p.description,
      colors: p.colors,
      features: p.features,
      inStock: p.in_stock,
    }));

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ============================================
// GET /api/products/categories
// ============================================
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    const categories = ['All', ...result.rows.map(r => r.category)];
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// ============================================
// POST /api/products  (Admin only)
// ============================================
router.post('/', requireAdmin, validateCreateProduct, async (req, res) => {
  try {
    const { name, price, category, emoji, description, colors, features, inStock } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, price, category, emoji, description, colors, features, in_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, price, category, emoji || '📦', description || '', colors || [], features || [], inStock !== false]
    );

    const p = result.rows[0];
    res.status(201).json({
      message: 'Product created',
      product: {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        category: p.category,
        emoji: p.emoji,
        rating: parseFloat(p.rating),
        reviews: p.reviews,
        description: p.description,
        colors: p.colors,
        features: p.features,
        inStock: p.in_stock,
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// ============================================
// PUT /api/products/:id  (Admin only)
// ============================================
router.put('/:id', requireAdmin, validateUpdateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    // Build dynamic UPDATE query
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name',
      price: 'price',
      category: 'category',
      emoji: 'emoji',
      description: 'description',
      colors: 'colors',
      features: 'features',
      inStock: 'in_stock',
      rating: 'rating',
      reviews: 'reviews',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (fields[key] !== undefined) {
        setClauses.push(`${column} = $${paramIndex}`);
        params.push(fields[key]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const p = result.rows[0];
    res.json({
      message: 'Product updated',
      product: {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        category: p.category,
        emoji: p.emoji,
        rating: parseFloat(p.rating),
        reviews: p.reviews,
        description: p.description,
        colors: p.colors,
        features: p.features,
        inStock: p.in_stock,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ============================================
// DELETE /api/products/:id  (Admin only)
// ============================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: `Product "${result.rows[0].name}" deleted.` });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

export default router;
