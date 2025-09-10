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

export const STOCK_STATUS = {
  active: "active",
  inactive: "inactive",
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
    quantity: { type: Number },
    status: {
      type: String,
      enum: Object.values(STOCK_STATUS),
      default: STOCK_STATUS.active,
    },
    parentProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      default: null,
    },
    isVariant: { type: Boolean, default: false },
    variantAttributes: {
      unit: { type: String, enum: Object.values(UNITS) },
      sizeOrWeight: String,
      capacity: Number,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const StockModel = mongoose.model("Stock", StockSchema);
export default StockModel;
