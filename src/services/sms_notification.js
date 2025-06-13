import userModel from "../Users/userModel.js"

/**
 * 
 * @param {ObjectId} userId 
 * @param  {String} message 
 * @returns {Success or false}
 * 
 * 
 */

export const SENT_SMS_NOTIFICATION = async (userId, message) => {
    try {
        const user = await userModel.findById(userId).select({ mobileNum: 1 });
        const mobileNum = user.mobileNum;
        const sendSMS = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("SMS Sent successfully.")
            }, 2000)
        })

    } catch (error) {
        throw new Error("Failed to send SMS NOTifications")
    }
}

