import mongoose, { Schema } from "mongoose";


const PackageSchema = new Schema({
    id: { type: String, unique: true, require: true },
    pkg_id: { type: String, unique: true, require: true },
    name: { type: String, require: true, unique: true, },
    description: { type: String, },
    packageListTextItems: [],
    images: {
        type: String, require: true,
    },
    utensils: [
        {
            utensil_id: { type: String, },
            name: { type: String, },
            quantity: { type: Number, },
        }
    ]
    ,
    capacity: { type: String, require: true },
    "price": { type: Number, require: true },
    "policy": { type: String, },
    "status": { type: String, default: "Available" },
    "notes": { type: String, },
}, { timestamps: true })

const PackageModel = mongoose.model("PackageModel", PackageSchema);

export default PackageModel