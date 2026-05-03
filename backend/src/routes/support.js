import { Router } from 'express';
import pool from '../config/db.js';
import { validateCreateTicket } from '../middleware/validate.js';

const router = Router();

// ============================================
// GET /api/support
// List user's support tickets
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.id, st.subject, st.category, st.message, st.status,
              st.created_at, st.updated_at,
              st.order_id,
              o.total as order_total, o.status as order_status, o.created_at as order_date
       FROM support_tickets st
       LEFT JOIN orders o ON st.order_id = o.id
       WHERE st.user_id = $1
       ORDER BY st.created_at DESC`,
      [req.user.id]
    );

    const tickets = result.rows.map(t => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      message: t.message,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      order: t.order_id ? {
        id: t.order_id,
        total: parseFloat(t.order_total),
        status: t.order_status,
        date: t.order_date,
      } : null,
    }));

    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets.' });
  }
});

// ============================================
// POST /api/support
// Create a support ticket (optionally linked to an order)
// ============================================
router.post('/', validateCreateTicket, async (req, res) => {
  try {
    const { subject, category = 'general', message, orderId = null } = req.body;

    // If orderId is provided, verify the order belongs to this user
    if (orderId) {
      const orderCheck = await pool.query(
        'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, req.user.id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found or does not belong to you.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, order_id, subject, category, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, subject, category, message, status, order_id, created_at`,
      [req.user.id, orderId, subject, category, message]
    );

    const ticket = result.rows[0];

    res.status(201).json({
      message: 'Support ticket submitted successfully!',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        orderId: ticket.order_id,
        createdAt: ticket.created_at,
      },
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket.' });
  }
});

export default router;
