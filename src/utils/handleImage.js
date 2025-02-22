import sharp from "sharp";

const handleImage = async (imageFile) => {
    try {
        const processImg = await sharp(imageFile.buffer)
            .jpeg({ quality: 80 })
            .toBuffer();

        return {
            fieldname: imageFile.fieldname,
            originalname: imageFile.originalname,
            encoding: imageFile.encoding,
            mimetype: imageFile.mimetype,
            buffer: processImg,
            size: imageFile.size
        };
    } catch (error) {
        throw new Error(`Error occurred during image file processing: ${error.message}`);
    }
}


export default handleImage