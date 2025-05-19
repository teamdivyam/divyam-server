import userModel from "../Users/userModel.js";
/**
 * @param {string} email - The email to check
 * @param {string} userId - The ID of the current user (to exclude from the check)
 * @returns {Promise<boolean>} - Returns true if email is unique, false otherwise
 */

const isEmailUnique = async (email, userId) => {
    try {
        if (!email) return true;

        // Find any user with this email that isn't the current user
        const existingUser = await userModel.findOne({
            email: email,
            _id: { $ne: userId } // Exclude the current user being updated
        }).lean();

        if (existingUser) {
            return false;
        }

        // Email is unique
        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
};

export default isEmailUnique;