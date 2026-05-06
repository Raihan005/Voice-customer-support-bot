import { Router } from 'express';
import pool from '../config/db.js';
import { validateAddToCart, validateUpdateCart } from '../middleware/validate.js';

const router = Router();

// ============================================
// GET /api/cart
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, ci.selected_color,
              p.id as product_id, p.name, p.price, p.emoji, p.category,
              p.colors, p.features, p.rating, p.reviews, p.description, p.in_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );

    const cart = result.rows.map(item => ({
      cartItemId: item.id,
      id: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      emoji: item.emoji,
      category: item.category,
      selectedColor: item.selected_color,
      quantity: item.quantity,
      colors: item.colors,
      features: item.features,
      rating: parseFloat(item.rating),
      reviews: item.reviews,
      description: item.description,
      inStock: item.in_stock,
    }));

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// ============================================
// POST /api/cart
// ============================================
router.post('/', validateAddToCart, async (req, res) => {
  try {
    const { productId, quantity = 1, selectedColor = null } = req.body;

    // Verify product exists
    const product = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Upsert: if same product+color exists, increment quantity
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, selected_color, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, selected_color)
       DO UPDATE SET quantity = cart_items.quantity + $4
       RETURNING id, quantity`,
      [req.user.id, productId, selectedColor, quantity]
    );

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});

// ============================================
// PUT /api/cart/:id
// ============================================
router.put('/:id', validateUpdateCart, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, quantity`,
      [quantity, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    res.json({
      message: 'Cart updated',
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// ============================================
// DELETE /api/cart/:id
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    res.json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ error: 'Failed to remove item.' });
  }
});

// ============================================
// DELETE /api/cart  (clear all)
// ============================================
router.delete('/', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

export default router;
