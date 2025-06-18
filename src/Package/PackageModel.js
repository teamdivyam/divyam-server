import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const PackageSchema = new Schema({
    pkg_id: { type: String, unique: true, required: true },
    name: { type: String, required: true, unique: true, },
    slug: { type: String, unique: true },
    description: { type: String, },
    capacity: { type: String, required: true },
    "price": { type: Number, required: true },
    "policy": { type: String, },

    packageListTextItems: [],

    productImg: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productsimg",
            required: true
        },
    ],

    productBannerImgs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "productsimg",
        required: true
    }],

    isVisible: {
        type: Boolean,
        default: true,
        index: true
    },

    isFeatured: { type: Boolean, default: false },

    rating: {
        type: Number,
        required: true
    },
    isDeleted: { type: Boolean, default: false },
    notes: { type: String, },
}, { timestamps: true })


PackageSchema.pre("save", function (next) {

    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }

    next();
}
);


const PackageModel = mongoose.model("Package", PackageSchema);

export default PackageModel