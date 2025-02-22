import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    fullName: { type: String },
    age: { type: String },
    gender: { type: String },
    mobileNum: { type: String, required: true, unique: true },
    avatar: { type: String },
    address: { type: String },
    areaPin: { type: String },
    role: {
        type: String,
        enum: ["user"],
        default: "user"
    },
    accessToken: { type: String },
    otp: { type: mongoose.Types.ObjectId, ref: "otp", require: true },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const userModel = mongoose.model("User", userSchema);
export default userModel;
