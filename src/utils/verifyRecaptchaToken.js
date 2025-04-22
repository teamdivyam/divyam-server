
import { config } from "../config/_config.js";

/**
 * Verify Google reCAPTCHA token
 * @param {string} token - reCAPTCHA response token
 * @returns {Promise<boolean>} true if verification is successful, otherwise false
 */

const verifyRecaptcha = async (token) => {
    if (!token) return false;

    try {
        const GOOGLE_RECAPTCHA_VERIFY_API = `https://www.google.com/recaptcha/api/siteverify`;
        const secretKey = config.RECAPTCHA_SECRET;

        const response = await fetch(GOOGLE_RECAPTCHA_VERIFY_API,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `secret=${secretKey}&response=${token}`
            }
        )

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        const { success, score } = data;


        if (!success || score < 0.5) {
            return false
        }

        return true // verification passed

    } catch (error) {
        console.log(`Re-captcha verification failed ${error}`)
        return false;
    }
}

export default verifyRecaptcha