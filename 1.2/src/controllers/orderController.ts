import { Request, Response } from "express";
import { prisma } from "../db";
import { logger } from "../logger";

export const createOrder = async (req: Request, res: Response) => {
  const { userId, items } = req.body;

  const order = await prisma.$transaction(async (tx) => {

    const productIds = items.map((i: any) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    let total = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock < item.quantity)
        throw new Error(`Insufficient stock for product ${product.name}`);
      total += product.price * item.quantity;
    }

    const newOrder = await tx.order.create({
      data: { userId, total, status: "created" },
    });

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
};

export const getOrder = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
};
