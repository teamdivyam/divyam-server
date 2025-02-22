import mongoose, { Schema } from "mongoose";
// Testing for
// 1. 211006
// 2. ⁠211001
const areaZoneSchema = new Schema({
    areaPinCode: { type: Number, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isAvailable: { type: Boolean, required: true }
}, { timestamps: true })

const AreaZoneModel = mongoose.model("areaZone", areaZoneSchema)
export default AreaZoneModel
