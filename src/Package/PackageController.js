import Joi from "joi";
import PackageModel from "./PackageModel.js";
import createHttpError from "http-errors";
import generateOrderID from "../Counter/counterController.js";

import {
    NEW__PKG__VALIDATE__SCHEMA,
    UPDATE__PKG__VALIDATE_SCHEMA
} from "../Validators/Package/schema.js"

import UploadImageOnServer from "../services/UploadImageOnServer.js";
import DeleteObject from "../services/DeleteFileFromServer.js";

import handleImage from "../utils/handleImage.js";

import productImgModel from "./productImgModle.js";
import mongoose, { mongo, Mongoose } from "mongoose";
import logger from "../logger/index.js";

// body Validate..
const ADD_NEW_PACKAGE = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { error, value } = NEW__PKG__VALIDATE__SCHEMA.validate(req.body);
        if (error) {
            return next(createHttpError(400, error?.details?.[0]?.message));
        }
        let reqData = value;

        const isPackageExists = await PackageModel.findOne({ name: reqData.name })
            .session(session);

        if (isPackageExists) {
            return next(createHttpError(409, "Package name should be different"));
        }

        const PackageID = await generateOrderID("packageID", "DVYMPKG");
        if (!PackageID) {
            return next(createHttpError(500, "Can't able to generate Package ID."));
        }

        if (!reqData.price || reqData.price <= 5000) {
            return next(createHttpError(400, "Package price cannot be 0 or less than 5000"));
        }

        const productMainImgArr = reqData.productMainImgArr || [];
        const productBannerImgArr = reqData.productBannerImgArr || [];

        const mainImgDocs = await Promise.all(
            productMainImgArr.map(img =>
                productImgModel.create([{
                    imagePath: img.imgPath,
                    order: img.order,
                    title: img.title,
                    imageType: img.imageType
                }], { session })
            )
        );

        const bannerImgDocs = await Promise.all(
            productBannerImgArr.map(img =>
                productImgModel.create([{
                    imagePath: img.imgPath,
                    order: img.order,
                    title: img.title,
                    imageType: img.imageType
                }], { session })
            )
        );

        // Step 2: Extract just the _id values
        const mainImgIds = mainImgDocs.map(doc => doc[0]._id);
        const bannerImgIds = bannerImgDocs.map(doc => doc[0]._id);

        const prettyData = {
            pkg_id: PackageID,
            name: reqData.name,
            description: reqData.description,
            packageListTextItems: reqData.packageListTextItems,
            capacity: reqData.capacity,
            price: reqData.price,
            policy: reqData.policy,
            notes: reqData.notes,
            productBannerImgs: bannerImgIds,
            productImg: mainImgIds,
            rating: reqData.rating,
        };

        const insertPkg = await PackageModel.create([prettyData], { session });

        if (!insertPkg || insertPkg.length === 0) {
            throw new Error("Failed to create new package");
        }

        await session.commitTransaction();

        return res.status(201).json({ success: true, pkg_Id: prettyData.pkg_id });
    } catch (error) {
        await session.abortTransaction();
        logger.info(`Error occurred during new package creation ${error.message}`);
        return next(createHttpError(500, `ERR=>${error.message}`));
    } finally {
        await session.endSession();
    }
};

const UPDATE_PACKAGE = async (req, res, next) => {
    const SLUG = req.params?.PERMALINK;

    if (!SLUG) {
        return next(createHttpError(401, "Invalid Package Id."));
    }

    const { error, value } = UPDATE__PKG__VALIDATE_SCHEMA.validate(req.body);

    if (error) {
        return next(createHttpError(400, error.details[0].message));
    }

    const {
        name,
        description,
        notes,
        price,
        capacity,
        packageListTextItems,
        bannerImgs = [],
        productImgs = [],
        rating,
        isFeaturedProduct,
        isVisible
    } = req.body;

    try {
        if (!Array.isArray(bannerImgs)) {
            return next(createHttpError(400, "Banner images must be an array"));
        }

        if (!Array.isArray(productImgs)) {
            return next(createHttpError(400, "Product images must be an array"));
        }

        // Process Banner Images
        const bannerImageDocs = await Promise.all(
            bannerImgs.map(async (img) => {
                if (!img.imgUrl) {
                    throw new Error("Image URL is required for banner images");
                }

                const imgPath = img.imgUrl.split("/");
                const selectedImg = imgPath[imgPath.length - 1];

                const existingBanner = await productImgModel.findOne(
                    { imagePath: selectedImg });

                return existingBanner || productImgModel.create({
                    imagePath: selectedImg,
                    order: img.order,
                    title: img.title || selectedImg,
                    imageType: "banner"
                });
            })
        );


        // Process product Images
        const productImageDocs = await Promise.all(
            productImgs.map(async (img) => {
                if (!img.imgUrl) {
                    throw new Error("Image URL is required for product images");
                }

                const imgPath = img.imgUrl.split("/");
                const selectedImg = imgPath[imgPath.length - 1];

                const existingProduct =
                    await productImgModel.findOne({ imagePath: selectedImg });

                return existingProduct || productImgModel.create({
                    imagePath: selectedImg,
                    order: img.order,
                    title: img.title || selectedImg,
                    imageType: "product"
                });
            })
        );

        const bannerImgArr = bannerImageDocs.map((doc) => doc._id);
        const productImgArr = productImageDocs.map((doc) => doc._id);

        // Update Package
        const UPDATED_PACKAGE = await PackageModel.findOneAndUpdate(
            { slug: SLUG },
            {
                name,
                description,
                notes,
                price,
                capacity,
                rating,
                packageListTextItems,
                productImg: productImgArr,
                productBannerImgs: bannerImgArr,
                isFeatured: isFeaturedProduct,
                isVisible,
            }
        );


        if (!UPDATED_PACKAGE) {
            return next(createHttpError(400, "Something went wrong, please try again later."));
        }

        res.json({
            success: true,
            msg: "Updated Successfully.."
        });

    } catch (error) {
        console.log(error);
        return next(createHttpError(401, `${error.message}`));
    }
};


const DELETE_SINGLE_PACKAGE = async (req, res, next) => {
    try {
        const PKG_ID = req?.params?.PKG_ID;

        if (!PKG_ID) {
            return next(createHttpError(401, "404 not-found"))
        }

        // check in db too..
        const delPackage = await PackageModel.findByIdAndDelete(PKG_ID)

        if (!delPackage) {
            return next(createHttpError(401, "There is no package with this ID"))
        }

        //DELETE OBJECT TO

        // const objectKey = `UI/package/${delPackage.images}`;

        // const deleteOBJ = await DeleteObject(config.BUCKET_NAME, objectKey);

        // const moveFileToBin = await moveFileFromOneFolderToAnother(config.BUCKET_NAME
        //     , objectKey,
        //     `bin/package/${delPackage.images}`
        // )

        // if (!moveFileToBin) {
        //     return next(createHttpError(500, "Internal error.."));
        // }

        // On Success
        return res.json({
            success: true,
            msg: "Successfully Deleted.."
        })

    } catch (error) {
        return next(createHttpError(401, "Something went wrong During package deletion.."))
    }
}

const PAGINATION_VALIDATION_SCHEMA = Joi.object({
    page: Joi.number(),
    limit: Joi.number()
})


const GET_ALL_FEATURED_PACKAGE = async (req, res, next) => {
    try {
        const { error, value } = PAGINATION_VALIDATION_SCHEMA.validate(req.query);


        if (!error) {
            return next(createHttpError(400, error.details.at(0).message))
        }

        const { page, limit } = req.body;

        const PAGE = page || 1;
        const LIMIT = limit || 10;
        const skip = (PAGE - 1) * LIMIT;




        const getFeaturedPackage = await PackageModel.find(
            {
                isFeatured: true,
                isVisible: true
            })
            .populate(
                { path: 'productImg', select: { _id: 0, 'imagePath': 1, isActive: 1, order: 1 } }
            )
            .populate({ path: 'productBannerImgs', select: { _id: 0, 'imagePath': 1, isActive: 1, order: 1 } })
            .skip(skip)
            .limit(LIMIT)
            .exec();

        if (!getFeaturedPackage || !getFeaturedPackage.length) {
            return next(createHttpError(400, "Something went wrong.."))
        }

        return res.status(200).json(getFeaturedPackage)

    } catch (error) {
        console.log(error);
        return next(createHttpError(400, "Invalid request.."))
    }
}

// FOR_ADMIN
const GET_ALL_PACKAGE = async (req, res, next) => {
    try {
        const { error, value } = PAGINATION_VALIDATION_SCHEMA.validate(req.query);

        if (error) {
            return next(createHttpError(400, error.details[0].message))
        }

        const { page, limit } = req.body;

        const PAGE = page || 1;
        const LIMIT = limit || 10;

        const skip = (PAGE - 1) * LIMIT;

        let Package = await PackageModel.find({},
            { createdAt: 0, updatedAt: 0, __v: 0, productBannerImgs: 0 })
            .populate({ path: 'productImg', select: { _id: 0, 'imagePath': 1, isActive: 1, order: 1 } })
            .skip(skip)
            .limit(LIMIT)
            .exec();

        // log package data for production

        if (!Package || !Package.length) {
            return next(createHttpError(400, "Internal error"));
        }

        return res.status(200).json(Package)
    } catch (error) {
        next(createHttpError(401, error))
        return
    }
}

const GET_ALL_PACKAGE_FOR_USERS = async (req, res, next) => {
    try {
        const { error, value } = PAGINATION_VALIDATION_SCHEMA.validate(req.query);
        if (error) {
            return next(createHttpError(400, error.details[0].message))
        }

        const { page, limit } = req.body;

        const PAGE = page || 1;
        const LIMIT = limit || 10;

        const skip = (PAGE - 1) * LIMIT;

        let Package = await PackageModel.find({ isVisible: true },
            { createdAt: 0, updatedAt: 0, __v: 0, productBannerImgs: 0 })
            .populate({ path: 'productImg', select: { _id: 0, 'imagePath': 1, isActive: 1, order: 1 } })
            .skip(skip)
            .limit(LIMIT)
            .exec();

        // log package data for production
        if (!Package || !Package.length) {
            return next(createHttpError(400, "Internal error"));
        }

        return res.status(200).json(Package)
    } catch (error) {
        return next(createHttpError(400, "Internal Error"))
    }
}

// FOR_ADMIN
const GET_SINGLE_PACKAGE = async (req, res, next) => {
    const PKG_PERMALINK = req?.params?.PERMALINK;

    if (!PKG_PERMALINK) {
        return next(createHttpError(401, "404 not found"))
    }

    const isPackageExists = await PackageModel.findOne({ slug: PKG_PERMALINK },
        { createdAt: 0, updatedAt: 0, __v: 0 })
        .populate(
            {
                path: "productImg",
                select: { _id: 0, imagePath: 1, isActive: 1, order: 1, title: 1, imageType: 1 }

            }
        )
        .populate(
            {
                path: "productBannerImgs",
                select: { _id: 0, imagePath: 1, isActive: 1, order: 1, title: 1, imageType: 1 }

            }
        )
        .exec();


    if (!isPackageExists) {
        return next(createHttpError(401, "Invalid package id."))
    }

    res.json(isPackageExists)
}

// FOR_USERS
const GET_SINGLE_PACKAGE_FOR_USERS = async (req, res, next) => {
    try {
        const SLUG = req.params.SLUG;

        const Package = await PackageModel.findOne({ slug: SLUG, isVisible: true },
            { slug: 0, __v: 0, createdAt: 0, updatedAt: 0, isFeatured: 0 })
            .populate(
                {
                    path: "productImg",
                    select: {
                        imagePath: 1,
                        imageType: 1,
                        order: 1,
                        title: 1,
                        isActive: 1,
                        _id: 0
                    }
                }
            )
            .populate(
                {
                    path: "productBannerImgs",
                    select: {
                        imagePath: 1,
                        imageType: 1,
                        order: 1,
                        title: 1,
                        isActive: 1,
                        _id: 0
                    }
                }
            )
            .exec()

        if (!Package) {
            return next(createHttpError(400, "Package not available"))
        }

        return res.status(200).json(Package)

    } catch (error) {
        return next(createHttpError(400, "Internal error.."))
    }
}

export {
    ADD_NEW_PACKAGE,
    DELETE_SINGLE_PACKAGE,
    UPDATE_PACKAGE,
    GET_ALL_PACKAGE,
    GET_SINGLE_PACKAGE,
    GET_ALL_FEATURED_PACKAGE,
    GET_SINGLE_PACKAGE_FOR_USERS,
    GET_ALL_PACKAGE_FOR_USERS
};