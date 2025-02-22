import express from "express";
import globalErrorHandler from "./middleware/ErrorHandler.js";
import cors from "cors";
import helmet from "helmet";
import Route from "./Routes/user.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import managerRoute from "./Routes/managerRoute.js"
import AdminRoute from "./Routes/adminRoute.js";
import DeliveryPartnerModel from "./DeliveryPartners/DeliveryPartnerModel.js";
import EMPRoutes from "./Routes/employeeRoute.js";

const app = express();
app.use(express.json())
app.use(cookieParser())
app.use(helmet())
app.disable('x-powered-by');


const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'Cookie'],
    })
);

// Limit each IP to 100 requests  windowMs
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,  //MS => 10 minutes
    max: 1200,
    message: 'Too many requests. Please try again later.',
});

app.use(globalLimiter)

app.use('/api', Route)
app.use('/api/admin', AdminRoute)
app.use('/api/v1/manager', managerRoute);
app.use('/api/employee/', EMPRoutes);
app.use('/api/v1/delivery-agent', DeliveryPartnerModel);

app.get('/', (req, res, next) => {
    res.json({ msg: "working...." })
})

// Error handler middleware
app.use(globalErrorHandler);

export default app