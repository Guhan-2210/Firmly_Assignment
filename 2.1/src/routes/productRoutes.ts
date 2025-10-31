import { Hono } from "hono";
import { ProductModel } from "../models/product";
import { logger } from "../logger";

type Variables = {
  productModel: ProductModel;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  try {
    const productModel = c.get("productModel");
    const products = await productModel.findAll();
    logger.debug("products_listed", { count: products.length });
    return c.json(products);
  } catch (error: any) {
    logger.error("get_products_failed", { error: error.message });
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

app.get("/:id", async (c) => {
  try {
    const productModel = c.get("productModel");
    const product = await productModel.findById(c.req.param("id"));
    
    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }
    
    return c.json(product);
  } catch (error: any) {
    logger.error("get_product_failed", { error: error.message });
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

app.post("/", async (c) => {
  try {
    const productModel = c.get("productModel");
    const body = await c.req.json();
    
    // Validation
    if (!body.name || typeof body.name !== "string") {
      return c.json({ error: "Name is required" }, 400);
    }
    if (typeof body.price !== "number" || body.price < 0) {
      return c.json({ error: "Valid price is required" }, 400);
    }
    if (typeof body.stock !== "number" || body.stock < 0) {
      return c.json({ error: "Valid stock is required" }, 400);
    }
    
    const product = await productModel.create({
      name: body.name,
      description: body.description,
      price: body.price,
      stock: body.stock,
    });
    
    logger.info("product_created", { productId: product.id, name: product.name });
    return c.json(product, 201);
  } catch (error: any) {
    logger.error("create_product_failed", { error: error.message });
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.put("/:id", async (c) => {
  try {
    const productModel = c.get("productModel");
    const id = c.req.param("id");
    const body = await c.req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.stock !== undefined) updateData.stock = body.stock;

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: "No valid fields provided for update" }, 400);
    }

    const product = await productModel.update(id, updateData);

    logger.info("product_updated", { 
      productId: product.id, 
      updatedFields: Object.keys(updateData) 
    });
    
    return c.json(product);
  } catch (error: any) {
    logger.error("update_product_failed", { error: error.message });
    
    if (error.message === "Product not found") {
      return c.json({ error: "Product not found" }, 404);
    }
    
    return c.json({ error: "Failed to update product" }, 500);
  }
});

app.delete("/:id", async (c) => {
  try {
    const productModel = c.get("productModel");
    await productModel.delete(c.req.param("id"));
    
    logger.info("product_deleted", { productId: c.req.param("id") });
    return c.body(null, 204);
  } catch (error: any) {
    logger.error("delete_product_failed", { error: error.message });
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default app;