
const globalErrorHandler = (error, req, res, next) => {
    res.status(error.status || 500).json({
        statusCode: error.status || 500,
        success: false,
        msg: error.message || 'Internal Server Error...',
    });
}

export default globalErrorHandler;