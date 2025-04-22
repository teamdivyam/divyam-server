import { customAlphabet } from "nanoid";

const generateOtp = (length) => {
    const nanoid = customAlphabet("0123456789", length);
    return nanoid()
}

export default generateOtp