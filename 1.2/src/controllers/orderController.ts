import { Request, Response } from "express";
import { prisma } from "../db";
import { logger } from "../logger";

export const createOrder = async (req: Request, res: Response) => {
  const { userId, items } = req.body;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Check if user exists FIRST
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // 2. Now fetch products
      const productIds = items.map((i: any) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      // 3. Validate products and stock
      let total = 0;
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.stock < item.quantity)
          throw new Error(`Insufficient stock for product ${product.name}`);
        total += product.price * item.quantity;
      }

      // 4. Create order
      const newOrder = await tx.order.create({
        data: { userId, total, status: "created" },
      });

      // 5. Create order items and update stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    logger.info("order_created", { orderId: order.id, userId, total: order.total });
    res.status(201).json(order);
  } catch (error: any) {
    // This will now show the real error
    res.status(400).json({ error: error.message });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
};
