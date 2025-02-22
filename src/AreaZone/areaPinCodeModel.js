import mongoose from "mongoose";

const areaSchema = new mongoose.Schema({
    pinCode: { type: Number, required: true, unique: true, index: true },
})

const areaPinModel = mongoose.model('pinCode', areaSchema);

export default areaPinModel;