// controllers/productController.js
const db = require('../db');
const logger = require('../logger');

const list = async (req, res) => {
  const { rows } = await db.query('SELECT * FROM products ORDER BY created_at DESC');
  logger.debug('products_listed', { count: rows.length });
  res.json(rows);
};

const getById = async (req, res) => {
  const id = req.params.id;
  const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  if (rows.length === 0) {
    logger.debug('product_not_found', { productId: id });
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(rows[0]);
};

const create = async (req, res) => {
  const { name, description, price, stock } = req.body;
  const { rows } = await db.query(
    `INSERT INTO products (name, description, price, stock)
     VALUES ($1,$2,$3,$4) RETURNING *`,
     [name, description || null, price, stock || 0]
  );
  logger.info('product_created', { productId: rows[0].id, name: rows[0].name });
  res.status(201).json(rows[0]);
};

const update = async (req, res) => {
  const id = req.params.id;
  const { name, description, price, stock } = req.body;
  const { rows } = await db.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         stock = COALESCE($4, stock)
     WHERE id = $5
     RETURNING *`,
     [name, description, price, stock, id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  logger.info('product_updated', { productId: id });
  res.json(rows[0]);
};

const remove = async (req, res) => {
  const id = req.params.id;
  const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
  logger.info('product_deleted', { productId: id });
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
