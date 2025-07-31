import logger from "../logger";
const isReferralCodeAvailable = async (referralCode, userId, orderId, amount) => {
    const API = `https://api-referral.divyam.com/api/referral/create-referral-event?referralCode=${referralCode}&refereeId=${userId}&orderId=${orderId}&amount=${amount}`;

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        });

        const data = await res.json();

        if (res.ok) {
            logger.info(`Refferal API Called ✅${data}`)
        }
    } catch (error) {
        console.log(`Something off ${error.message}`);
    }
}

export default isReferralCodeAvailable;