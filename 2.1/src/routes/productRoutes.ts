import { IRequest, Router, json } from 'itty-router';
import { ProductModel } from "../models/product";
import { logger } from "../logger";

type RequestWithModels = IRequest & {
  productModel?: ProductModel;
};

export function productRoutes(router: ReturnType<typeof Router>) {
  // Get all products
  (router as any).get("/api/products", async (req: RequestWithModels) => {
    try {
      const productModel = req.productModel!;
      const products = await productModel.findAll();
      logger.debug("products_listed", { count: products.length });
      return json(products);
    } catch (error: any) {
      logger.error("get_products_failed", { error: error.message });
      return json({ error: "Failed to fetch products" }, { status: 500 });
    }
  });

  // Get product by ID
   (router as any).get("/api/products/:id", async (req: RequestWithModels) => {
    try {
      const productModel = req.productModel!;
      const { id } = req.params as { id: string };
      const product = await productModel.findById(id);
      
      if (!product) {
        return json({ error: "Product not found" }, { status: 404 });
      }
      
      return json(product);
    } catch (error: any) {
      logger.error("get_product_failed", { error: error.message });
      return json({ error: "Failed to fetch product" }, { status: 500 });
    }
  });

  // Create product
  (router as any).post("/api/products", async (req: RequestWithModels) => {
    try {
      const productModel = req.productModel!;
      const body = await req.json() as any;
      
      // Validation
      if (!body.name || typeof body.name !== "string") {
        return json({ error: "Name is required" }, { status: 400 });
      }
      if (typeof body.price !== "number" || body.price < 0) {
        return json({ error: "Valid price is required" }, { status: 400 });
      }
      if (typeof body.stock !== "number" || body.stock < 0) {
        return json({ error: "Valid stock is required" }, { status: 400 });
      }
      
      const product = await productModel.create({
        name: body.name,
        description: body.description,
        price: body.price,
        stock: body.stock,
      });
      
      logger.info("product_created", { productId: product.id, name: product.name });
      return json(product, { status: 201 });
    } catch (error: any) {
      logger.error("create_product_failed", { error: error.message });
      return json({ error: "Failed to create product" }, { status: 500 });
    }
  });

  // Update product
   (router as any).put("/api/products/:id", async (req: RequestWithModels) => {
    try {
      const productModel = req.productModel!;
      const { id } = req.params as { id: string };
      const body = await req.json() as any;

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.price !== undefined) updateData.price = body.price;
      if (body.stock !== undefined) updateData.stock = body.stock;

      if (Object.keys(updateData).length === 0) {
        return json({ error: "No valid fields provided for update" }, { status: 400 });
      }

      const product = await productModel.update(id, updateData);

      logger.info("product_updated", { 
        productId: product.id, 
        updatedFields: Object.keys(updateData) 
      });
      
      return json(product);
    } catch (error: any) {
      logger.error("update_product_failed", { error: error.message });
      
      if (error.message === "Product not found") {
        return json({ error: "Product not found" }, { status: 404 });
      }
      
      return json({ error: "Failed to update product" }, { status: 500 });
    }
  });

  // Delete product
   (router as any).delete("/api/products/:id", async (req: RequestWithModels) => {
    try {
      const productModel = req.productModel!;
      const { id } = req.params as { id: string };
      await productModel.delete(id);
      
      logger.info("product_deleted", { productId: id });
      return new Response(null, { status: 204 });
    } catch (error: any) {
      logger.error("delete_product_failed", { error: error.message });
      return json({ error: "Failed to delete product" }, { status: 500 });
    }
  });
}