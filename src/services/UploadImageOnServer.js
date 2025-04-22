import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from "../config/_config.js";

const s3 = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,
    },
});

/*
@file 
@destinationPath on server
*/
const UploadImageOnServer = async (file, uploadDestinationPath) => {
    try {
        // set folder path 
        let destinationPath;
        switch (uploadDestinationPath) {
            case "USER": {
                destinationPath = "Uploads/users"
                break;
            }
            case "ADMIN": {
                destinationPath = "Uploads/admins"
                break;
            }
            case "PACKAGE": {
                destinationPath = "Uploads/package"
                break;
            }
            case "assets": {
                destinationPath = "Uploads/assets"
                break;
            }
            case "EMP": {
                destinationPath = "Uploads/employee"
                break;
            }
            default: {
                destinationPath = "Uploads/default"
            }
        }

        // getting these data from multer
        // prepare filename
        const fileName = `${destinationPath}/${Date.now()}-${file.originalname}`;

        const uploadParams = {
            Bucket: config.BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        // init();
        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);

        const fileUrl = `https://${config.BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${fileName}`;

        return { fileName, fileUrl };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to upload file on server..');
    }
}

export default UploadImageOnServer;