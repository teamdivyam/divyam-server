import { config } from 'dotenv'
config()

const _config = {
    FRONTEND_URL: process.env.FRONT_END_URL,
    APP_PORT: process.env.APP_PORT,
    DB_URL: process.env.DB_URL,

    USER_SECRET: process.env.USER_AUTH_SECRET,
    ADMIN_SECRET: process.env.ADMIN_AUTH_SECRET,
    EMPLOYEE_SECRET: process.env.EMPLOYEE_AUTH_SECRET,

    BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_BUCKET_KEY: process.env.AWS_SERVER_BUCKET_ACCESS_KEY,
    AWS_BUCKET_SECRET: process.env.AWS_SERVER_BUCKET_SECRET_KEY,
    AWS_REGION: process.env.AWS_REGION,

    MANGER_AUTH_SECRET: process.env.MANGER_AUTH_SECRET,
}

export { _config as config }
