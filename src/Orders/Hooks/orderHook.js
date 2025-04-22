import createHttpError from "http-errors";
import crypto from "crypto"
import handleFailedPayments from "./handleFailedPayments.js";
import handleCapturedPayments from "./handleSuccessPayment.js";

export const NEW_ORDER_WEB_HOOK = async (req, res, next) => {
    console.log("WEBHOOK_CALLED ✅");

    try {
        // const RZRPAY_WEBHOOK_SECRET = "mahtab1234";
        const { entity, event, payload, created_at } = req.body;
        const { payment } = payload;
        const { entity: paymentInfo } = payment;

        if (paymentInfo.status === "failed") {
            const paymentFailed = await handleFailedPayments(paymentInfo);

            if (!paymentFailed) {
                return next(createHttpError(400, "Something went wrong during Order processing."))
            }

            // on success
            return res.status(200)
                .json({
                    success: true,
                })
        }

        if (paymentInfo.status === "captured") {
            const paymentSuccess = await handleCapturedPayments(paymentInfo);

            if (!paymentSuccess) {
                return next(createHttpError(400, "Something went wrong during Order processing."))
            }

            // on-Success
            return res.status(200)
                .json({
                    success: true,
                })
        }


        return res.status(400).json({
            success: false,
        })





        // const razorpayKeySecret = config.RZR_PAY_SCRT;
        // // Parse the incoming webhook payload

        // const payload = event.body;

        // const signature = event.headers['x-razorpay-signature'];

        // // Verify the signature
        // const expectedSignature = crypto
        //     .createHmac('sha256', razorpayKeySecret)
        //     .update(payload)
        //     .digest('hex');

        // if (expectedSignature === signature) {
        //     console.log('Signature verified successfully.');
        // }

        // console.log(
        //     paymentInfo
        // );



    } catch (error) {
        console.log(error);
        return next(createHttpError(400, "Internal error"))
    }

}