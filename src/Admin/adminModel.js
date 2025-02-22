import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    fullName: { type: String },
    age: { type: String },
    gender: { type: String },
    mobileNum: { type: String, unique: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    avatar: { type: String, require: true },
    role: {
        type: String,
        enum: ["admin"],
        default: "admin"
    },
    accessToken: { type: String },
}, { timestamps: true });

const adminModel = mongoose.model("Admin", AdminSchema);

export default adminModel;
