import express from "express";
import { validate } from "../middlewares/validate";
import { orderSchema } from "../validators/orderValidator";
import { createOrder, getOrder } from "../controllers/orderController";

const router = express.Router();

router.post("/", validate(orderSchema), createOrder);
router.get("/:id", getOrder);

export default router;
