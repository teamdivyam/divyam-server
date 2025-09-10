import mongoose from "mongoose";
import slugify from "slugify";

export const PRODUCT_CATEGORY = {
  COOKING: "COOKING",
  DINING: "DINING",
  SERVING: "SERVING",
  DECORATIVE: "DECORATIVE",
  OTHERS: "OTHERS",
};

export const PRODUCT_STATUS = {
  active: "active",
  inactive: "inactive",
};

const VariantSchema = new mongoose.Schema(
  {
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
    sku: String,
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.active,
    },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  slug: { type: String, unique: true },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  discount: {
    type: Number,
    min: 0,
    default: 0,
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  mainImage: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    enum: Object.values(PRODUCT_CATEGORY),
    default: PRODUCT_CATEGORY.OTHERS,
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: Object.values(PRODUCT_STATUS),
    default: PRODUCT_STATUS.active,
  },
  variants: [
    {
      type: VariantSchema,
      default: [],
    },
  ],
});

const ProductModel = mongoose.model("Product", ProductSchema);

export default ProductModel;
