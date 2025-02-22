import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/_config.js';

const _config = {
    REGION: config.AWS_REGION,
    BUCKET_NAME: config.BUCKET_NAME,
    ACCESS_KEY_ID: config.AWS_BUCKET_KEY,
    SECRET_ACCESS_KEY: config.AWS_BUCKET_SECRET
}

// console.log("CONFIG_WORKING_FINE", config);
const s3 = new S3Client({
    region: _config.REGION,
    credentials: {
        accessKeyId: _config.ACCESS_KEY_ID,
        secretAccessKey: _config.SECRET_ACCESS_KEY,
    },
});

const moveFileFromOneFolderToAnother = async (bucketName, sourcePath, destiNationPath) => {
    if (!bucketName || !sourcePath || !destiNationPath) {
        console.error("Error: Missing required parameters.");
        return;
    }

    // console.warn(
    //     `Argumensts =>`,
    //     "1", bucketName,
    //     "2", sourcePath,
    //     "3", destiNationPath
    // );

    const copySource = encodeURI(`${bucketName}/${sourcePath}`);
    try {
        const copyAndMoveFile = await s3.send(
            new CopyObjectCommand({
                Bucket: config.BUCKET_NAME,
                CopySource: copySource,
                Key: destiNationPath,
            })
        );

        const DeleteMovedFile = await s3.send(
            new DeleteObjectCommand({
                Bucket: bucketName,
                Key: sourcePath,
                // Original file to be deleted
            })
        );

        console.log("Successfully file moved..");
        // check for status code
        if (copyAndMoveFile?.$metadata?.httpStatusCode == 200
            &&
            DeleteMovedFile?.$metadata?.httpStatusCode == 204) {
            return {
                statusCode: 301,
                msg: "Successfully moved file from one folder to another."
            }
        }

    } catch (error) {
        console.log(error);
        throw new Error(`Unable to move file${error}`)

    }
}

/*
moveFileFromOneFolderToAnother 
take required 

@params
// ------------
@BUCKET_NAME,
@SourcePath,
@destinationPath,
*/

// moveFileFromOneFolderToAnother(
//     config.BUCKET_NAME,
//     "Uploads/admins/---king-it-should-be-large-make-.png",
//     "bin/1737617028634-Blue.png"
// );

export default moveFileFromOneFolderToAnother;



