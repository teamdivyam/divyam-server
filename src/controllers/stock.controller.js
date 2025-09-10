import createHttpError from "http-errors";
import StockModel from "../models/stock.model.js";
import {
  StockSchema,
  CreateStockVariantSchema,
  SelectStockVariantSchema,
  VariantUpdateValidationSchema,
} from "../Validators/stock.js";
import {
  checkStockAlreadyExists,
  createStockSingleVariant,
  getAllStocks,
  getTotalStocks,
} from "../services/stock.js";
import generateStockId from "../utils/generateStockID.js";

const StockController = {
  getStock: async (req, res, next) => {
    try {
      const [stocks, totalStocks] = await Promise.all([
        getAllStocks(),
        getTotalStocks(),
      ]);

      res.status(200).json({
        success: true,
        stocks: stocks,
        totalStocks: totalStocks,
      });
    } catch (error) {
      console.error("error in getting stock:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  getSingleStock: async (req, res, next) => {
    try {
      const { sku } = req.params;

      const stock = await StockModel.findOne({ sku });

      // Variant stock of stock
      const variantStock = await StockModel.find({
        parentProduct: stock._id,
      }).lean();

      // Total quantity of stock
      const totalQuantity = variantStock.reduce((sum, variant) => {
        return sum + variant.quantity;
      }, 0);

      res.status(200).json({
        success: true,
        stock: stock,
        variantStock: variantStock,
        totalQuantity: totalQuantity
      });
    } catch (error) {
      console.error("error in getting single stock:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  getStockVariantOptions: async (req, res, next) => {
    try {
      const options = await StockModel.find({
        parentProduct: null,
        isVariant: false,
      }).select("name sku category");

      res.status(200).json({
        success: true,
        options: options,
      });
    } catch (error) {
      console.error("error in getting single stock:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  createStock: async (req, res, next) => {
    try {
      const { variant, variantMode } = req.query;

      console.log(variant, variantMode, req.body);

      if (variant === "false") {
        const { error, value: validatedData } = StockSchema.validate(
          req.body,
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

        if (await checkStockAlreadyExists(validatedData.name)) {
          return next(createHttpError(409, "Stock already existed"));
        }

        const sku = generateStockId(validatedData.category);

        await StockModel.create({
          sku: sku,
          name: validatedData.name,
          category: validatedData.category,
          quantity: validatedData.quantity,
          price: validatedData.price,
        });

        return res.status(201).json({
          success: true,
          message: "Stock created successfully",
        });
      } else if (variant === "true") {
        if (variantMode === "select") {
          const { error, value: validatedData } =
            SelectStockVariantSchema.validate(
              req.body,
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

          if (await checkStockAlreadyExists(validatedData.variantStockName)) {
            return next(createHttpError(409, "Stock already existed"));
          }

          const skuVarientStock = generateStockId(
            validatedData.variantStockCategory
          );

          await StockModel.create({
            sku: skuVarientStock,
            name: validatedData.variantStockName,
            category: validatedData.variantStockCategory,
            parentProduct: validatedData.parentStockId,
            isVariant: true,
            variantAttributes: {
              unit: validatedData.variantStockUnit,
              sizeOrWeight: validatedData.variantSizeOrWeight,
              capacity: validatedData.variantStockCapacity,
            },
            quantity: validatedData.variantStockQuantity,
          });

          return res.status(201).json({
            success: true,
            message: "Stock created successfully",
          });
        }
        if (variantMode === "create") {
          const { error, value: validatedData } =
            CreateStockVariantSchema.validate(
              req.body,
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

          // First Create Parent Stock
          if (await checkStockAlreadyExists(validatedData.parentStockName)) {
            return next(createHttpError(409, "Stock already existed"));
          }
          const skuParentStock = generateStockId(
            validatedData.parentStockCategory
          );

          const parentStock = await StockModel.create({
            sku: skuParentStock,
            name: validatedData.parentStockName,
            category: validatedData.parentStockCategory,
          });

          // Second Create Varient Stock
          if (await checkStockAlreadyExists(validatedData.variantStockName)) {
            return next(createHttpError(409, "Variant Stock already existed"));
          }
          const skuVarientStock = generateStockId(
            validatedData.variantStockCategory
          );

          await StockModel.create({
            sku: skuVarientStock,
            name: validatedData.variantStockName,
            category: validatedData.variantStockCategory,
            parentProduct: parentStock._id,
            isVariant: true,
            variantAttributes: {
              unit: validatedData.variantStockUnit,
              sizeOrWeight: validatedData.variantSizeOrWeight,
              capacity: validatedData.variantStockCapacity,
            },
            quantity: validatedData.variantStockQuantity,
          });

          return res.status(201).json({
            success: true,
            message: "Stock created successfully",
          });
        }
      }
    } catch (error) {
      console.error("error in getting single stock:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  // createStockWithVariant: async (req, res, next) => {
  //     try {
  //         const { error, value: validatedData } = StockSchema.validate(
  //             req.body,
  //             { stripUnknown: true } // Remove Unknown Fields
  //         );

  //         if (error) {
  //             // Create a detailed error message
  //             const errorMessage = error.details.map((detail) => ({
  //                 field: detail.path.join("."),
  //                 message: detail.message,
  //                 type: detail.type,
  //             }));

  //             // Send HTTP 400 error with validation details
  //             return next(
  //                 createHttpError(400, "Validation failed", {
  //                     errors: errorMessage,
  //                 })
  //             );
  //         }

  //         if (await checkStockAlreadyExists(validatedData.name)) {
  //             return next(createHttpError(409, "Stock already existed"));
  //         }

  //         const sku = generateStockId();

  //         await StockModel.create({
  //             sku: sku,
  //             name: validatedData.name,
  //             category: validatedData.category,
  //             parentProduct: validatedData.parentProduct,
  //             isVariant: true,
  //             variantAttributes: {
  //                 unit: validatedData.unit,
  //                 sizeOrWeight: validatedData.sizeOrWeight,
  //                 capacity: validatedData.capacity,
  //             },
  //             quantity: validatedData.quantity,
  //             price: validatedData.price,
  //         });

  //         return res.status(201).json({
  //             success: true,
  //             message: "Stock created successfully",
  //         });
  //     } catch (error) {
  //         console.error("error in getting single stock:", error);
  //         next(createHttpError(500, "Internal Server Error"));
  //     }
  // },

  updateStock: async (req, res, next) => {
    try {
      const { sku } = req.params;

      const { error, value: validatedData } =
        VariantUpdateValidationSchema.validate(
          req.body,
          { stripUnknown: true } // Remove Unknown Fields
        );

      if (error) {
        // Create a detailed error message
        const errorMessage = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          type: detail.type,
        }));

        console.log("Error update stock validation:", errorMessage);

        // Send HTTP 400 error with validation details
        return next(
          createHttpError(400, "Validation failed", {
            errors: errorMessage,
          })
        );
      }

      await StockModel.findOneAndUpdate(
        { sku },
        {
          status: validatedData.variantStatus,
          name: validatedData.variantName,
          category: validatedData.category,
          capacity: validatedData.capacity,
          quantity: validatedData.quantity,
          sizeOrWeight: validatedData.sizeOrWeight,
          unit: validatedData.unit,
        }
      );

      res.status(204).send();
    } catch (error) {
      console.error("error in update single stock:", error);
      next(createHttpError(500, "Internal Server Error"));
    }
  },

  deleteStock: async (req, res, next) => {},
};

export default StockController;
