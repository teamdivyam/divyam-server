import mongoose from "mongoose";

export const CATEGORY = {
    COOKING: "COOKING",
    DINING: "DINING",
    SERVING: "SERVING",
    DECORATIVE: "DECORATIVE",
    OTHERS: "OTHERS",
};

export const UNITS = {
    LITRE: "lt",
    KILOGRAM: "kg",
    CENTIMETRE: "cm",
    INCH: "inch",
};

const StockSchema = new mongoose.Schema(
    {
        sku: { type: String, unique: true, required: true },
        name: { type: String, required: true },
        category: {
            type: String,
            enum: Object.values(CATEGORY),
            default: "OTHERS",
        },
        parentProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stock",
            default: null,
        },
        isVariant: { type: Boolean, default: false }, // true = child product
        variantAttributes: {                          // Only if variant
            unit: { type: String, enum: Object.values(UNITS)},
            sizeOrWeight: String,
            capacity: Number,
        },

        // Stock & Price (always at variant level OR at root if no variant)
        quantity: { type: Number, default: 0 },    
        // price: { type: Number, required: true },
    },  
    {
        timestamps: true,
        versionKey: false,
    }
);

const StockModel = mongoose.model("Stock", StockSchema);
export default StockModel;