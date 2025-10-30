import { Request, Response } from "express";
import { prisma } from "../db";
import { logger } from "../logger";

export const getAllProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  logger.debug("products_listed", { count: products.length });
  res.json(products);
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, stock } = req.body;
  const product = await prisma.product.create({
    data: { name, description, price, stock },
  });
  logger.info("product_created", { productId: product.id, name });
  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const product = await prisma.product.update({
      where: { id: id },
      data: updateData,
    });

    logger.info("product_updated", { productId: product.id, updatedFields: Object.keys(updateData) });
    res.json(product);
  } catch (error: any) {
    logger.error("update_failed", { error: error.message });
    res.status(500).json({ error: "Failed to update product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  logger.info("product_deleted", { productId: req.params.id });
  res.status(204).send();
};
