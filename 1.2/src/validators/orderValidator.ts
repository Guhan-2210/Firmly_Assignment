import Joi from "joi";

export const orderSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});
