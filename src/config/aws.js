import { S3Client } from "@aws-sdk/client-s3";

export const S3ClientConfig = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_SERVER_BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SERVER_BUCKET_SECRET_KEY
    }
})