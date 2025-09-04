import Joi from "joi"; // adjust path if needed
import { PRODUCT_CATEGORY, PRODUCT_STATUS } from "../models/product.model.js";

export const ProductSchema = Joi.object({
  stock: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
    .required()
    .messages({
      "string.pattern.base": "Stock must be a valid ObjectId",
      "any.required": "Stock is required",
    }),

  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.empty": "Description is required",
  }),

  discount: Joi.number().min(0).default(0),

  discountPrice: Joi.number().min(0).default(0),

  originalPrice: Joi.number().min(0).default(0),

  category: Joi.string()
    .valid(...Object.values(PRODUCT_CATEGORY))
    .default(PRODUCT_CATEGORY.OTHERS),

  tags: Joi.array().items(Joi.string()).default([]),

  status: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .default(PRODUCT_STATUS.active),

  variants: Joi.array().items(
    Joi.object({
      stock: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
        .required()
        .messages({
          "string.pattern.base": "Stock must be a valid ObjectId",
          "any.required": "Stock is required",
        }),
      sku: Joi.string(),
      discount: Joi.number().min(0).default(0),
      discountPrice: Joi.number().min(0).default(0),
      originalPrice: Joi.number().min(0).default(0),
      status: Joi.string()
        .valid(...Object.values(PRODUCT_STATUS))
        .default(PRODUCT_STATUS.active),
    })
  ),
});
