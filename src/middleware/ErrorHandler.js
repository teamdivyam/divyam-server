// app.use((err, req, res, next) => {
//     res.status(err.status || 500).json({
//         statusCode: 122,
//         success: false,
//         message: err.message || 'Internal Server Error',


//     });
// });


const globalErrorHandler = (error, req, res, next) => {
    res.status(error.status || 500).json({
        statusCode: error.status || 500,
        success: false,
        msg: error.message || 'Internal Server Error...',
    });
}

export default globalErrorHandler;