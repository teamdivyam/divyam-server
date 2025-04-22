import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/_config.js";

const s3 = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,
    },
});

/**
 * 
 * @param {*} bucketName 
 * @param {*} key 
 * @param {*} contentType 
 * @returns  Signed-url
 */

const getPreSignedURL = async (bucketName, key, contentType) => {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })

        return url
    } catch (error) {
        throw new Error("Error during requesting presigned url")
    }
}

export default getPreSignedURL