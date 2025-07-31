import express from "express";
import cors from "cors";
import helmet from "helmet";
import Route from "./Routes/user.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import AdminRoute from "./Routes/adminRoute.js";
import { config } from "./config/_config.js";
import logger from "./logger/index.js";
import globalErrorHandler from "./middleware/ErrorHandler.js";
import { NEW_ORDER_WEB_HOOK } from "./Orders/Hooks/orderHook.js";


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.ip} ${req.method} ${req.url}`);
    next();
});

const allowedOrigins = [
    config.ORGIN1,
    config.ORGIN2,
    config.ORGIN3,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'Cookie', 'x-device-id'],
    })
);

/**
 * Middleware to limit User api
 */
const ipLimiter = rateLimit({
    windowMs: 60000 * 30,// 30 minutes
    max: 1 * 1000, //1 k req 
    message: 'Too many requests Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        const deviceId = req?.headers['x-device-id'];
        return deviceId;
    }
});

app.use('/api', ipLimiter, Route);
app.use('/api/admin', AdminRoute);

// Razorpay-webhook 
app.post('/api/v1/razorpay-webhook', NEW_ORDER_WEB_HOOK);
app.get('/health', (req, res, next) => {
    res.status(200).json(
        {
            success: true
        }
    )
});

// RATE_LIMITER
const singleLimiter = rateLimit({
    windowMs: 60000 * 2,// 2 minutes
    limit: 50,
    message: 'Too many requests Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const deviceId = req?.headers['x-device-id'];
        return deviceId;
    }
});

app.get('/rate', singleLimiter, async (req, res, next) => {
    return res.status(200)
        .json({
            success: true
        })
});

app.get('/ip', async (req, res, next) => {
    try {
        return res.status(200).json({
            ip: req.ip,
            ips: req.ips
        })
    } catch (error) {
        throw new Error(error)
    }
})

// for-undeclared-routes
app.use(function (req, res, next) {
    return res.status(400).json({
        success: false,
        status: 404,
        msg: "please try again later || ROUTE_NOT_FOUND"
    })
});

// global Error handler middleware
app.use(globalErrorHandler);
export default app



// app.use('/api/employee/', EMPRoutes);
// app.use('/api/v1/manager', ManagerRoute);
// app.use('/api/v1/agent', DeliveryAgentRoute);
// app.use('/api/v1/supervisor', SuperViclearsorRoutes)