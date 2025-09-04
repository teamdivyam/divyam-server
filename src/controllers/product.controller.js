import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ProductSchema } from "../Validators/product.js";
import ProductModel from "../models/product.model.js";
import createHttpError from "http-errors";
import { S3ClientConfig } from "../config/aws.js";
import { v4 as uuidv4 } from "uuid";
import generateProductID from "../utils/generateProductID.js";
import StockModel from "../models/stock.model.js";

const ProductController = {
  getProducts: async (req, res, next) => {
    try {
      const products = await ProductModel.find({});

      res.status(200).json({
        success: true,
        products: products,
      });
    } catch (error) {
      console.error("error in get product:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  createProduct: async (req, res, next) => {
    try {
      console.log("body:", req.body);
      const {
        stock,
        sku,
        name,
        description,
        tags,
        variants,
        status,
        discount,
        discountPrice,
        originalPrice,
        category
      } = req.body;
      const { error, value: validatedData } = ProductSchema.validate(
        {
          stock,
          sku,
          name,
          description,
          tags: JSON.parse(tags),
          variants: JSON.parse(variants),
          status,
          discount,
          discountPrice,
          originalPrice,
          category
        },
        { stripUnknown: true } // Remove Unknown Fields
      );

      if (error) {
        // Create a detailed error message
        const errorMessage = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          type: detail.type,
        }));

        console.log("Error message:", errorMessage);

        // Send HTTP 400 error with validation details
        return next(
          createHttpError(400, "Validation failed", {
            errors: errorMessage,
          })
        );
      }

      let productImageURLs = undefined;

      if (req.files) {
        const uploadFilePromises = req.files.map(async (file) => {
          const key = `UI/product-Img/${uuidv4()}-${file.originalname}`;

          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await S3ClientConfig.send(command);

          return `https://assets.divyam.com/${key}`;
        });

        productImageURLs = await Promise.all(uploadFilePromises);
      }

      const productId = generateProductID();

      console.log("asa", validatedData);

      await ProductModel.create({
        stock: validatedData.stock,
        productId: productId,
        name: validatedData.name,
        description: validatedData.description,
        discount: validatedData.discount || validatedData.variants[0]?.discount,
        discountPrice: validatedData.discountPrice || validatedData.variants[0]?.discountPrice,
        originalPrice: validatedData.originalPrice|| validatedData.variants[0]?.originalPrice,
        category: validatedData.category,
        tags: validatedData.tags,
        images: productImageURLs,
        variants: validatedData.variants,
      });

      res.status(201).json({
        success: true,
        message: "New Product Created",
      });
    } catch (error) {
      console.error("error in create product:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },
  updateProduct: async (req, res, next) => {},
};

export default ProductController;
