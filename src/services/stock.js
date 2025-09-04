import StockModel, { CATEGORY } from "../models/stock.model.js";
import generateStockId from "../utils/generateStockID.js";

export const getTotalStocks = async () => {
    try {
        const result = await StockModel.countDocuments({ status: "active" });

        return result;
    } catch (error) {
        throw error;
    }
};

export const getAllStocks = async () => {
    try {
        const stocks = await StockModel.find({parentProduct: null, isVariant: false }).select(
            "-_id sku name category"
        );

        return stocks;
    } catch (error) {
        throw error;
    }
};

export const checkStockAlreadyExists = async (name) => {
    try {
        const isStockExists = await StockModel.findOne({
            name: { $regex: new RegExp(name, "i") },
        });

        if (isStockExists) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("error stock exists service:", error);
        throw error;
    }
};

export const createStockSingleVariant = async (stock) => {
    try {
        const sku = generateStockId(stock.category);

        const newStock = await StockModel.create({
            sku: sku,
            category: stock.category || CATEGORY.OTHERS,
            subcategory: stock.subcategory || null,
            tags: stock.tags || [],

            name: stock.name,
            description: stock.description || null,
            brand: stock.brand || null,
            unit: stock.unit || null,
            sizeOrWeight: stock.sizeOrWeight || null,
            images: [],
            costPrice: stock.costPrice || null,
            quantityAvailable: stock.quantityAvailable || 0,
            minStockLevel: stock.minStockLevel || 0,
            location: stock.location || null,
            status: stock.status || "active",
        });

        return newStock;
    } catch (error) {
        console.error("error stock-service insert single-variant:", error);
        throw error;
    }
};

export const createStockVariants = async (req, res, next) => {
    try {
    } catch (error) {
        console.error("error in adding stock:", error);
        next(createHttpError(500, "Internal Server Error"));
    }
};
