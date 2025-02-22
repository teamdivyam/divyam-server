import createHttpError from "http-errors"

const sendOTP = async (otp, mobileNum) => {
    try {
        const bodyVALUE = {
            route: "otp",
            variables_values: otp,
            schedule_time: null,
            numbers: mobileNum
        }

        console.log(otp, mobileNum, bodyVALUE);

        const res = await fetch("https://www.fast2sms.com/dev/bulkV2",
            {
                "method": "POST",
                headers: {
                    Authorization: 'gUR4kxVpamiHnzytMqbTG7Wcuo539sL2BK1AP6YINJDSQFrdE841cfDRVi6yBMhS9Q5jEpHCnPJLkuOm',
                    "Content-Type": "application/json",

                },
                body: JSON.stringify(bodyVALUE)
            })

        if (!res) {
            return next(createHttpError(401, "can't able to send otp.."))
        }

        const result = await res.json()

        return await result

    } catch (error) {
        res.json({ msg: ".." })
        console.log("Error FROM OTP_FUNC", error.message);
    }

}


export default sendOTP