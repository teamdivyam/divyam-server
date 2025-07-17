import { config } from 'dotenv'
config();
const _config = {
    FRONTEND_URL: process.env.FRONT_END_URL,
    BACKEND_URL: process.env.NODE_ENV === "development"
        ? `http://localhost:${process.env.APP_PORT}` : `https://api.divyam.com`,
    ADMIN_DASHBOARD_URL: process.env.NODE_ENV === "development" ? `http://localhost:5173` : `https://admin.divyam.com`,
    PRODUCTION: process.env.PRODUCTION,
    APP_PORT: process.env.APP_PORT,
    DB_URL: process.env.DB_URL,
    OTP_RATE_LIMIT: process.env.RATE_LIMIT_OTP,

    USER_SECRET: process.env.USER_AUTH_SECRET,
    ADMIN_SECRET: process.env.ADMIN_AUTH_SECRET,
    EMPLOYEE_SECRET: process.env.EMPLOYEE_AUTH_SECRET,
    BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_BUCKET_KEY: process.env.AWS_SERVER_BUCKET_ACCESS_KEY,
    AWS_BUCKET_SECRET: process.env.AWS_SERVER_BUCKET_SECRET_KEY,
    AWS_REGION: process.env.AWS_REGION,
    CLOUDFRONT_PATH: process.env.AWS_CLOUDFRONT_PATH,

    MANGER_AUTH_SECRET: process.env.MANGER_AUTH_SECRET,

    RZR_PAY_ID: process.env.RZR_PAY_ID,
    RZR_PAY_SCRT: process.env.RZR_PAY_SCRT,

    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,

    CLOUDFRON_PATH: process.env.AWS_CLOUDFRONT_PATH,
    GUEST_USERS_SECRET: process.env.GUEST_USERS_SECRET,
    SHOW_ADMIN_REGISTER_PAGE: process.env.SHOW_ADMIN_REGISTER_PAGE,

    ORGIN1: process.env.ORIGIN1,
    ORGIN2: process.env.ORIGIN2,
    ORGIN3: process.env.ORIGIN3,
    NODE_ENV: process.env.NODE_ENV,
    SECRET: process.env.SECRET,
    // smtp_Config
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASSWORD,
    RESET_PASSWORD_SECRET: process.env.RESET_PASSWORD_SECRET
}

export { _config as config }
