function handleError(res, error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
        success: false,
        message: error.message || "Internal server error"
    });
}
module.exports = { handleError };
