import createHttpError from "http-errors";
import UploadImageOnServer from "../utils/UploadImageOnServer.js";

/*
Middleware to Upload file on server
*/

const UploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(createHttpError(400, "Failed to upload file on server"))
        }
        const uploadFile = await UploadImageOnServer(req.file);

        if (!uploadFile) {
            return next(createHttpError(400, "Failed to upload file on server"))
        }
        console.log(uploadFile);
        next()

    } catch (error) {
        return createHttpError(400, "Failed to upload file on server")
    }
};

export default UploadImage;
