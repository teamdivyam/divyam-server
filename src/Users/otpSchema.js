import mongoose, { Schema } from 'mongoose';

const otpSchema = new Schema({
    otp: { type: String, required: true },
    userId: { type: mongoose.Types.ObjectId, ref: "user" },
    isVerified: { type: Boolean },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 360,
        // expires Value in sec. 
        // expire in 6 Minutes...
    }
});

const otpModel = mongoose.model('Otp', otpSchema);

export default otpModel;

