import Joi from "joi";
import { CATEGORY, UNITS } from "../models/stock.model.js";

// Validation schema
export const StockSchema = Joi.object({
    name: Joi.string().required(),

    category: Joi.string()
        .valid(...Object.keys(CATEGORY))
        .default("OTHERS"),

    quantity: Joi.number().min(0).default(0),

    // price: Joi.number().required().min(0),
});

export const StockParentSchema = Joi.object({
    name: Joi.string().required(),

    category: Joi.string()
        .valid(...Object.keys(CATEGORY))
        .default("OTHERS"),
});

export const SelectStockVariantSchema = Joi.object({
    variantStockName: Joi.string().required(),

    variantStockCategory: Joi.string()
        .valid(...Object.values(CATEGORY))
        .default("OTHERS"),

    parentStockId: Joi.string()
        .hex()
        .length(24) // MongoDB ObjectId length
        .allow(null),

    variantStockUnit: Joi.string().valid(...Object.values(UNITS)),
    variantSizeOrWeight: Joi.string(),
    variantStockCapacity: Joi.number(),
    variantStockQuantity: Joi.number().min(0).default(0),
});

export const CreateStockVariantSchema = Joi.object({
    parentStockName: Joi.string().required(),
    parentStockCategory: Joi.string()
        .valid(...Object.values(CATEGORY))
        .default("OTHERS"),

    variantStockName: Joi.string().required(),
    variantStockCategory: Joi.string()
        .valid(...Object.values(CATEGORY))
        .default("OTHERS"),
    variantStockUnit: Joi.string().valid(...Object.values(UNITS)),
    variantSizeOrWeight: Joi.string(),
    variantStockCapacity: Joi.number(),
    variantStockQuantity: Joi.number().min(0).default(0),
});
