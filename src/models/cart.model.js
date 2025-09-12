import mongoose from "mongoose";

const ProductCartSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    variantId: String,
    productName: String,
    variantName: String,
    slug: String,
    productImage: String,
    quantity: { type: Number, default: 1 },
    originalPrice: Number,
    discount: Number,
    discountPrice: Number,
  },
  {
    _id: false,
  }
);

const PackageCartSchema = new mongoose.Schema(
  {
    packageId: {
      type: String,
      unique: true,
      required: true,
    },
    quantity: { type: String, default: 1 },
  },
  {
    _id: false,
  }
);

const CartSchema = new mongoose.Schema(
  {
    cartId: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    productCartList: [{ type: ProductCartSchema, default: [] }],
    packageCartList: [{ type: PackageCartSchema, default: [] }],
    subTotal: Number,
    total: Number,
  },
  {
    timestamps: true,
  }
);

const CartModel = mongoose.model("Cart", CartSchema);
export default CartModel;
