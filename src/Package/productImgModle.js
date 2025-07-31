import mongoose from "mongoose";
import { config } from "../config/_config.js";

const productImgSchema = new mongoose.Schema(
    {
        imagePath: { type: String, required: true, index: true },
        order: { type: Number, required: true },
        title: { type: String },
        description: { type: String },
        ctaUrl: { type: String },
        isActive: { type: Boolean, default: true },

        imageType: {
            type: String,
            enum: ['product', 'banner'],
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


const virtualImagePath = productImgSchema.virtual("imgSrc");

virtualImagePath.get(function () {
    if (this.imageType === 'banner') {
        return `${config.CLOUDFRONT_PATH}/UI/product-banner/${this.imagePath}`;
    }

    return `${config.CLOUDFRONT_PATH}/UI/product-Img/${this.imagePath}`;
});


const productImgModel = mongoose.model('productsimg', productImgSchema);

export default productImgModel;