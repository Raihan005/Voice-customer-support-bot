import { Router } from 'express';
import pool from '../config/db.js';
import { validatePlaceOrder } from '../middleware/validate.js';

const router = Router();

// ============================================
// GET /api/orders
// ============================================
router.get('/', async (req, res) => {
  try {
    // Fetch orders
    const ordersResult = await pool.query(
      `SELECT id, total, status, shipping_info, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Fetch order items for all orders
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.quantity, oi.unit_price, oi.selected_color,
                  oi.product_name, oi.product_emoji, oi.product_id
           FROM order_items oi
           WHERE oi.order_id = $1`,
          [order.id]
        );

        return {
          id: order.id,
          total: parseFloat(order.total),
          status: order.status,
          shipping: order.shipping_info,
          date: order.created_at,
          items: itemsResult.rows.map(item => ({
            id: item.product_id,
            name: item.product_name,
            emoji: item.product_emoji,
            price: parseFloat(item.unit_price),
            quantity: item.quantity,
            selectedColor: item.selected_color,
          })),
        };
      })
    );

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ============================================
// POST /api/orders
// Creates order from current cart
// ============================================
router.post('/', validatePlaceOrder, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get cart items with product info
    const cartResult = await client.query(
      `SELECT ci.quantity, ci.selected_color,
              p.id as product_id, p.name, p.price, p.emoji
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Calculate total
    const subtotal = cartResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    );
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, status, shipping_info)
       VALUES ($1, $2, 'Processing', $3)
       RETURNING id, created_at`,
      [req.user.id, total.toFixed(2), JSON.stringify(req.body.shipping)]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, selected_color, quantity, unit_price, product_name, product_emoji)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.selected_color, item.quantity, item.price, item.name, item.emoji]
      );
    }

    // Clear cart
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully! 🎉',
      order: {
        id: order.id,
        total: parseFloat(total.toFixed(2)),
        status: 'Processing',
        shipping: req.body.shipping,
        date: order.created_at,
        items: cartResult.rows.map(item => ({
          id: item.product_id,
          name: item.name,
          emoji: item.emoji,
          price: parseFloat(item.price),
          quantity: item.quantity,
          selectedColor: item.selected_color,
        })),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order.' });
  } finally {
    client.release();
  }
});

export default router;
