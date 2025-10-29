// controllers/orderController.js
const db = require('../db');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

/**
Expected request body:
{
  "user_id": "uuid-of-user",
  "items": [
    { "product_id": "uuid", "quantity": 2 },
    ...
  ]
}
*/

const createOrder = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { user_id, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: 'Order must include items' };
    }

    // Lock product rows to avoid race conditions (SELECT ... FOR UPDATE)
    // Fetch product prices and stock
    const productIds = items.map(i => i.product_id);
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const productRes = await client.query(
      `SELECT id, price, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    const productMap = new Map(productRes.rows.map(r => [r.id, r]));

    // Validate stock and compute total
    let total = 0;
    for (const it of items) {
      const p = productMap.get(it.product_id);
      if (!p) {
        throw { status: 400, message: `Product not found: ${it.product_id}` };
      }
      if (p.stock < it.quantity) {
        throw { status: 400, message: `Insufficient stock for product ${it.product_id}` };
      }
      total += parseFloat(p.price) * it.quantity;
    }

    // Create order
    const orderId = uuidv4();
    await client.query(
      `INSERT INTO orders (id, user_id, total, status) VALUES ($1,$2,$3,$4)`,
      [orderId, user_id, total.toFixed(2), 'created']
    );

    // Insert order_items and decrement stock
    for (const it of items) {
      const p = productMap.get(it.product_id);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4)`,
        [orderId, it.product_id, it.quantity, p.price]
      );

      // update stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [it.quantity, it.product_id]
      );
    }

    await client.query('COMMIT');

    logger.info('order_created', { orderId, user_id, total, itemsCount: items.length });

    res.status(201).json({ order_id: orderId, total, status: 'created' });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      logger.error('rollback_failed', { message: rbErr.message, stack: rbErr.stack });
    }

    if (err && err.status) {
      logger.debug('order_creation_validation_failed', { message: err.message });
      return res.status(err.status).json({ error: err.message });
    }

    logger.error('order_creation_error', { message: err.message || err, stack: err.stack || null });
    return res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

const getOrder = async (req, res) => {
  const id = req.params.id;
  const { rows: orderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });

  const order = orderRows[0];
  const { rows: items } = await db.query(
    `SELECT oi.*, p.name FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
    [id]
  );

  res.json({ ...order, items });
};

module.exports = { createOrder, getOrder };
