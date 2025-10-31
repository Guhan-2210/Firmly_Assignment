import { DatabaseClient, generateId } from "../../db/client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
}

export class ProductModel {
  constructor(private db: DatabaseClient) {}

  async findAll(): Promise<Product[]> {
    const sql = `
      SELECT id, name, description, price, stock, created_at
      FROM products
      ORDER BY created_at DESC
    `;
    return this.db.query<Product>(sql);
  }

  async findById(id: string): Promise<Product | null> {
    const sql = `
      SELECT id, name, description, price, stock, created_at
      FROM products
      WHERE id = ?
    `;
    return this.db.queryOne<Product>(sql, [id]);
  }

  async create(data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
  }): Promise<Product> {
    const id = generateId();
    const sql = `
      INSERT INTO products (id, name, description, price, stock)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, name, description, price, stock, created_at
    `;
    
    const result = await this.db.queryOne<Product>(sql, [
      id,
      data.name,
      data.description || null,
      data.price,
      data.stock,
    ]);

    if (!result) {
      throw new Error("Failed to create product");
    }

    return result;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
    }
  ): Promise<Product> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(data.description);
    }
    if (data.price !== undefined) {
      updates.push("price = ?");
      params.push(data.price);
    }
    if (data.stock !== undefined) {
      updates.push("stock = ?");
      params.push(data.stock);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(id);

    const sql = `
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = ?
      RETURNING id, name, description, price, stock, created_at
    `;

    const result = await this.db.queryOne<Product>(sql, params);
    
    if (!result) {
      throw new Error("Product not found");
    }

    return result;
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM products WHERE id = ?`;
    const result = await this.db.execute(sql, [id]);
    
    if (!result.success) {
      throw new Error("Failed to delete product");
    }
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const sql = `
      UPDATE products
      SET stock = stock - ?
      WHERE id = ?
    `;
    await this.db.execute(sql, [quantity, id]);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => "?").join(",");
    const sql = `
      SELECT id, name, description, price, stock, created_at
      FROM products
      WHERE id IN (${placeholders})
    `;
    return this.db.query<Product>(sql, ids);
  }
}