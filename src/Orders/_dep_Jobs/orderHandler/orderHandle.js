import mongoose from "mongoose"


/**
 *  USER ID
 * @returns 
 */


const handleOrder = async (USERID) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const USER_ID = USERID

        if (!USER_ID) {
            return next(createHttpError(400, "Something went wrong, Payment failed"));
        }

        const { error, value } = VALIATE_ORDER_BODY_SCHEMA.validate(req.body);

        if (error) {
            return next(createHttpError(400, "Invalid order details"));
        }

        const { packageID, qty } = req.body;

        const productQuantity = qty || 1;

        const isUserAvailable = await userModel.findById(USER_ID);

        if (!isUserAvailable) {
            return next(createHttpError(400, "Internal error"))
        }

        if (!isUserAvailable.isVerified) {
            return next(createHttpError(400, "Something went wrong.."))
        }

        const notes = {
            fullName: isUserAvailable.fullName,
            email: isUserAvailable.email,
            contact: isUserAvailable.mobileNum
        }


        // Fetch package info
        const Package = await PackageModel.findById(packageID);

        if (!Package) {
            return next(createHttpError(400, "Package not found"));
        }


        const totalAmount = Package.price * productQuantity;

        const razorpayOrder = await instance.orders.create({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `order_${new Date().getTime()}`,
        });


        if (!razorpayOrder) {
            await session.abortTransaction();
            return next(createHttpError(500, "Payment gateway error"));
        }

        const INSERT_NEW_ORDER = await OrderModel.create(
            [
                {
                    orderId: razorpayOrder.id,
                    customer: USER_ID,
                    product: {
                        productId: Package._id,
                        quantity: productQuantity,
                        price: totalAmount
                    },
                    payment: {
                        currency: "INR",
                    },
                    totalAmount: totalAmount
                }
            ],
            { session }
        );


        if (!INSERT_NEW_ORDER) {
            await session.abortTransaction();
            return next(createHttpError(400, "Failed to place order. Please try again."));
        }


        await session.commitTransaction();

        return res.status(201).json({
            status: 200,
            message: "Order created successfully",
            orderId: razorpayOrder.id,
            amount: totalAmount,
            notes //options
        });

    } catch (error) {
        await session.abortTransaction();
        return next(createHttpError(500, error.message || "Internal Server Error"));
    } finally {
        session.endSession();
    }
}

export default handleOrder