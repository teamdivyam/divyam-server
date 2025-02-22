import createHttpError from "http-errors";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from "../config/_config.js";

const s3 = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,
    },
});

const UploadImage = (req, res, next) => {
    try {
        if (typeof next !== 'function') {
            console.error("Next is not a function");
        }

        if (!req.file) {
            return next(createHttpError(400, "No file uploaded"));
        }
        const file = req.file;
        // getting these data from multer
        const fileName = `uploads/${Date.now()}-${file.originalname}`;

        const uploadParams = {
            Bucket: config.BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        // init();
        const uploadCommand = new PutObjectCommand(uploadParams);

        s3.send(uploadCommand)
            .then(() => {
                console.log("file Uploaded Successfully...");
                req.fileName = fileName;
                req.fileUrl =
                    `https://${config.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${fileName}`;
                next();
            })
            .catch(error => {
                console.error('Error during uploading file..:', error);
                return next(createHttpError(500, `${error}Error during uploading file..`));
            });
    } catch (error) {
        return next(createHttpError(401, "Oops can't able upload file "))
    }
};

export default UploadImage;
