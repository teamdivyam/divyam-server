export const isReferralCodeValid = async (referralCode) => {
    if (!referralCode) return;

    try {
        const referralCodeAPI = `https://api-referral.divyam.com/api/referral/verify-referral-code?referralCode=${referralCode}`;

        const res = await fetch(referralCodeAPI);

        const result = await res.json();

        if (!res.ok || !result.success) {
            return false;
        }

        if (result.success === true) {
            return true
        }

    } catch (error) {
        return false;
    }
}
